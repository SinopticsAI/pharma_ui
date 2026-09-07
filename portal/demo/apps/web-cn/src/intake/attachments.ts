import type { Attachment, AttachmentAdapter, CompleteAttachment, PendingAttachment } from '@assistant-ui/react'
import { generateId } from '@assistant-ui/react'
import type { ApiClient, UploadRequest } from '@demo/api-client'
import type { QueryClient } from '@tanstack/react-query'

/**
 * Вложение прямо в нить диалога.
 *
 * Документ приходит скрепкой композера, а не отдельной формой рядом с чатом:
 * человек видит файл вложением, агент — фактом загрузки. Сама загрузка остаётся
 * presigned-контрактом ядра: `upload-url` → `PUT` в хранилище → `confirm-upload`.
 * Содержимое файла через кабинет не проходит.
 *
 * Агент file part не принимает — с документами он работает своими инструментами
 * Edge. Поэтому `send` возвращает текстовую часть с `itemId`: по ней агент
 * находит документ в ядре и разбирает его. Байты файла в нить не уходят.
 *
 * Эту часть видит и человек: AI SDK восстанавливает вложения сообщения только из
 * file part, а текстовая часть остаётся в теле сообщения. Поэтому она написана
 * словами, а не тегом.
 */

/** Те же расширения, что принимает досье: скан, фото, офисный документ. */
export const INTAKE_ATTACHMENT_ACCEPT = '.pdf,.png,.jpg,.jpeg,.webp,.tif,.tiff,.doc,.docx,.xls,.xlsx'

/** Один файл за раз: `add` всегда обещание, а не поток промежуточных состояний. */
export interface IntakeAttachmentAdapter extends AttachmentAdapter {
  add(state: { file: File }): Promise<PendingAttachment>
}

export interface IntakeAttachmentOptions {
  api: ApiClient
  queryClient: QueryClient
  organizationId: string
  /** Без него документ ложится на уровень компании и виден всем её продуктам. */
  productId?: string
  /** Диалог, в котором пришёл файл: по нему ядро адресует разбор в Plane. */
  sessionId: string
  /** Тип документа, который последней назвала карточка `ask-document`. */
  itemType: () => string
  /** Загрузка падает вне нити: ошибку показывает экран, а вложение остаётся в композере. */
  onError?: (error: unknown) => void
  /** Текст, который видят человек и агент: в нём обязаны остаться itemId и organizationId. */
  uploadedText?: (parts: { name: string; organizationId: string; itemType: string; itemId: string }) => string
}

export function createIntakeAttachmentAdapter(options: IntakeAttachmentOptions): IntakeAttachmentAdapter {
  // Тип документа известен в момент выбора файла, а нужен в момент отправки:
  // между ними человек успевает набрать текст и приложить второй файл.
  const itemTypes = new Map<string, string>()

  return {
    accept: INTAKE_ATTACHMENT_ACCEPT,

    async add({ file }): Promise<PendingAttachment> {
      const id = generateId()
      itemTypes.set(id, options.itemType())
      return {
        id,
        type: 'document',
        name: file.name,
        contentType: file.type || 'application/octet-stream',
        file,
        status: { type: 'requires-action', reason: 'composer-send' },
      }
    },

    async send(attachment): Promise<CompleteAttachment> {
      const itemType = itemTypes.get(attachment.id) ?? 'other'
      const request: UploadRequest = {
        itemType,
        fileName: attachment.file.name,
        contentType: attachment.file.type || 'application/octet-stream',
        title: attachment.file.name,
        productId: options.productId,
      }

      try {
        const ticket = await options.api.requestOrgUploadUrl(options.organizationId, request)
        await options.api.putFile(ticket, attachment.file)
        await options.api.confirmOrgUpload(options.organizationId, ticket.itemId, options.sessionId)

        // Комплектность считает ядро: панель разделов пересчитается сама.
        void options.queryClient.invalidateQueries({ queryKey: ['organization', options.organizationId] })
        void options.queryClient.invalidateQueries({ queryKey: ['organization-items', options.organizationId] })
        if (options.productId) {
          void options.queryClient.invalidateQueries({ queryKey: ['product', options.productId] })
        }

        itemTypes.delete(attachment.id)
        return {
          ...attachment,
          status: { type: 'complete' },
          content: [
            {
              type: 'text',
              text: (
                options.uploadedText ??
                ((parts) =>
                  `Документ «${parts.name}» загружен в ядро. organizationId: ${parts.organizationId}, itemType: ${parts.itemType}, itemId: ${parts.itemId}`)
              )({
                name: attachment.file.name,
                organizationId: options.organizationId,
                itemType,
                itemId: ticket.itemId,
              }),
            },
          ],
        }
      } catch (error) {
        options.onError?.(error)
        throw error
      }
    },

    async remove(attachment: Attachment): Promise<void> {
      itemTypes.delete(attachment.id)
    },
  }
}

/**
 * Выбор файла для карточки `ask-document`: она называет тип документа и сразу
 * открывает диалог, а файл уходит в композер тем же путём, что и скрепка.
 */
export function pickIntakeFile(): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = INTAKE_ATTACHMENT_ACCEPT
    input.hidden = true
    document.body.appendChild(input)

    const finish = (file: File | null) => {
      input.remove()
      resolve(file)
    }
    input.onchange = () => finish(input.files?.[0] ?? null)
    input.oncancel = () => finish(null)
    input.click()
  })
}
