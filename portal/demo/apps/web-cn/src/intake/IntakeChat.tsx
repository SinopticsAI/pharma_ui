import {
  AssistantRuntimeProvider,
  AttachmentPrimitive,
  ComposerPrimitive,
  MessagePrimitive,
  ThreadPrimitive,
} from '@assistant-ui/react'
import { useChatRuntime } from '@assistant-ui/react-ai-sdk'
import { describeError, useApi, useIdentity } from '@demo/api-client'
import { useAuth } from '@demo/auth'
import type { ProgressSection } from '@demo/domain'
import { useQueryClient } from '@tanstack/react-query'
import { useMemo, useRef, useState } from 'react'
import { useApproveCompanyProfile, useApproveProductData } from '../queries'
import { createIntakeAttachmentAdapter, pickIntakeFile } from './attachments'
import { IntakeToolUIs } from './cards'
import { type IntakeActions, IntakeActionsProvider, useIntakeActions } from './context'
import { type AgentId, createIntakeTransport } from './transport'

/**
 * Экран интейка: слева нить диалога и загрузки, справа комплектность по разделам.
 *
 * Документ прикладывается скрепкой в самом композере: файл становится вложением
 * сообщения, а не отдельной загрузкой рядом с чатом.
 */

const SECTION_LABEL: Record<ProgressSection['key'], string> = {
  identity: 'Реквизиты и реестр',
  documents: 'Документы компании',
  authority: 'Полномочия и подписи',
  banking: 'Банк и счета',
  risk: 'Проверка рисков',
}

function ProgressPanel({
  sections,
  missing,
  percent,
  title,
}: {
  sections: ProgressSection[]
  missing: string[]
  percent: number
  title: string
}) {
  return (
    <aside className="space-y-3 rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between text-sm">
        <span>{title}</span>
        <strong>{percent}%</strong>
      </div>
      <ul className="space-y-2 text-sm">
        {sections.map((section) => {
          const done = section.total > 0 && section.filled === section.total
          return (
            <li key={section.key} className="flex items-center justify-between gap-2">
              <span>{SECTION_LABEL[section.key] ?? section.key}</span>
              <span className="text-muted-foreground">{done ? 'готово' : `${section.filled} из ${section.total}`}</span>
            </li>
          )
        })}
        {sections.length === 0
          ? missing.map((field) => (
              <li key={field} className="flex items-center justify-between gap-2">
                <span>{field}</span>
                <span className="text-muted-foreground">нужно</span>
              </li>
            ))
          : null}
      </ul>
      <p className="text-xs text-muted-foreground">
        Разделы отмечает агент по мере разбора документов, а не вы вручную.
      </p>
    </aside>
  )
}

function Thread() {
  const { setItemType } = useIntakeActions()

  return (
    <ThreadPrimitive.Root className="flex h-[560px] flex-col rounded-lg border bg-card">
      <ThreadPrimitive.Viewport className="flex-1 space-y-3 overflow-y-auto p-4">
        <ThreadPrimitive.Empty>
          <p className="text-sm text-muted-foreground">
            Приложите документ компании скрепкой — агент разберёт его и заполнит карточку. Анкету писать не нужно.
          </p>
        </ThreadPrimitive.Empty>

        <ThreadPrimitive.Messages
          components={{
            UserMessage: () => (
              <MessagePrimitive.Root
                className="ml-auto max-w-[80%] space-y-1 rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground"
                data-role="user"
              >
                <MessagePrimitive.Parts />
                <MessagePrimitive.Attachments>
                  {() => (
                    <AttachmentPrimitive.Root className="flex items-center gap-2 text-xs opacity-80">
                      <AttachmentPrimitive.Name />
                    </AttachmentPrimitive.Root>
                  )}
                </MessagePrimitive.Attachments>
              </MessagePrimitive.Root>
            ),
            AssistantMessage: () => (
              <MessagePrimitive.Root
                className="max-w-[90%] space-y-2 rounded-lg bg-muted px-3 py-2 text-sm"
                data-role="assistant"
              >
                <MessagePrimitive.Parts />
              </MessagePrimitive.Root>
            ),
          }}
        />

        <ThreadPrimitive.If running>
          <div className="text-sm text-muted-foreground">Агент читает документ</div>
        </ThreadPrimitive.If>
      </ThreadPrimitive.Viewport>

      <ComposerPrimitive.Root className="space-y-2 border-t p-3">
        <div className="flex flex-wrap gap-2 empty:hidden">
          <ComposerPrimitive.Attachments>
            {() => (
              <AttachmentPrimitive.Root className="inline-flex items-center gap-2 rounded-md border bg-background px-2 py-1 text-xs">
                <AttachmentPrimitive.Name />
                <AttachmentPrimitive.Remove
                  className="text-muted-foreground hover:text-foreground"
                  aria-label="Убрать вложение"
                >
                  ×
                </AttachmentPrimitive.Remove>
              </AttachmentPrimitive.Root>
            )}
          </ComposerPrimitive.Attachments>
        </div>

        <div className="flex items-end gap-2">
          <ComposerPrimitive.Input
            className="min-h-9 flex-1 resize-none rounded-md border border-input bg-transparent px-3 py-2 text-sm"
            placeholder="Напишите агенту"
            rows={1}
          />
          {/* Скрепка без карточки: тип документа определит агент по содержимому. */}
          <ComposerPrimitive.AddAttachment
            multiple={false}
            onClick={() => setItemType('other')}
            className="inline-flex h-9 items-center rounded-md border border-input px-3 text-sm hover:bg-accent"
          >
            Приложить документ
          </ComposerPrimitive.AddAttachment>
          <ComposerPrimitive.Send className="inline-flex h-9 items-center rounded-md bg-primary px-3 text-sm text-primary-foreground">
            Отправить
          </ComposerPrimitive.Send>
        </div>
      </ComposerPrimitive.Root>
    </ThreadPrimitive.Root>
  )
}

export function IntakeChat({
  agentId,
  sessionId,
  organizationId,
  productId,
  title,
  sections,
  missing = [],
  percent,
}: {
  agentId: AgentId
  sessionId: string
  organizationId: string
  productId?: string
  title: string
  sections: ProgressSection[]
  missing?: string[]
  percent: number
}) {
  const api = useApi()
  const queryClient = useQueryClient()
  const identity = useIdentity()
  const { getAccessToken } = useAuth()
  const [uploadError, setUploadError] = useState<unknown>(null)

  // Тип документа называет карточка `ask-document` перед выбором файла, а нужен
  // он адаптеру в момент отправки — поэтому не состояние, а ссылка.
  const itemType = useRef('other')

  const approveCompany = useApproveCompanyProfile(organizationId)
  const approveProduct = useApproveProductData(productId ?? '')

  const transport = useMemo(
    () =>
      createIntakeTransport({
        agentId,
        sessionId,
        accountId: identity.accountId,
        getToken: getAccessToken,
      }),
    [agentId, sessionId, identity.accountId, getAccessToken],
  )

  const attachments = useMemo(
    () =>
      createIntakeAttachmentAdapter({
        api,
        queryClient,
        organizationId,
        productId,
        itemType: () => itemType.current,
        onError: (error) => setUploadError(() => error),
      }),
    [api, queryClient, organizationId, productId],
  )

  const runtime = useChatRuntime({ transport, adapters: { attachments } })

  const actions = useMemo<IntakeActions>(
    () => ({
      send: (text) => {
        void runtime.thread.append({ role: 'user', content: [{ type: 'text', text }] })
      },
      setItemType: (value) => {
        itemType.current = value
      },
      attachDocument: (value) => {
        itemType.current = value
        void pickIntakeFile().then((file) => {
          if (!file) return
          setUploadError(null)
          return runtime.thread.composer.addAttachment(file).catch((error: unknown) => {
            setUploadError(() => error)
          })
        })
      },
      approveDraft: (scope, _entityId) => {
        if (scope === 'company') approveCompany.mutate()
        else if (productId) approveProduct.mutate()
      },
      busy: approveCompany.isPending || approveProduct.isPending,
    }),
    [runtime, approveCompany, approveProduct, productId],
  )

  // Загрузка падает вне нити: сообщение агенту не уходит, вложение остаётся в
  // композере. Показываем причину рядом с чатом, чтобы можно было повторить.
  const failure = uploadError ?? approveCompany.error ?? approveProduct.error

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <IntakeActionsProvider value={actions}>
        <IntakeToolUIs />
        <div className="grid gap-4 lg:grid-cols-[1fr_260px]">
          <div className="space-y-2">
            {failure ? <p className="text-sm text-destructive">{describeError(failure)}</p> : null}
            <Thread />
          </div>
          <ProgressPanel sections={sections} missing={missing} percent={percent} title={title} />
        </div>
      </IntakeActionsProvider>
    </AssistantRuntimeProvider>
  )
}
