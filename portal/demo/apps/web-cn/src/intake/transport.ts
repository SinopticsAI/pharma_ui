import { AssistantChatTransport } from '@assistant-ui/react-ai-sdk'
import type { Locale } from '@demo/domain'

/**
 * Транспорт диалога интейка.
 *
 * Браузер ходит на тот же origin, что и REST: `POST /chat/{agentId}` через шлюз
 * Edge. Ответ приходит потоком сообщений AI SDK, но целиком — Serverless
 * Container обязан завершить ход до возврата, поэтому эффекта печати нет и
 * ожидание показывается явным блоком.
 *
 * Тело запроса — параметры выполнения агента Mastra, поэтому идентификатор
 * диалога уходит как `memory.thread`, а не как произвольное поле `sessionId`.
 * Читать эту нить кабинет не умеет и не должен: окно берёт `chat_messages`.
 *
 * Байты скана в `/chat` не едут. Шлюз режет тело HTTP на 2.5 МБ — это не лимит
 * файла и не лимит бакета. PUT идёт в Object Storage; extract качает оригинал
 * оттуда. Агенту в чате достаточно текста с itemId.
 */

export type AgentId = 'companyIntake' | 'productIntake'

const BINARY_PART = new Set(['file', 'image'])

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function keepTextPart(part: unknown): boolean {
  if (!isRecord(part)) return true
  const type = typeof part.type === 'string' ? part.type : ''
  return !BINARY_PART.has(type)
}

/** AI SDK кладёт data-URI скана в parts — для агента оставляем только текст. */
export function messagesWithoutScanBytes(messages: unknown[]): unknown[] {
  return messages.map((message) => {
    if (!isRecord(message)) return message
    const next: Record<string, unknown> = { ...message }
    if (Array.isArray(next.parts)) next.parts = next.parts.filter(keepTextPart)
    if (Array.isArray(next.content)) next.content = next.content.filter(keepTextPart)
    delete next.experimental_attachments
    delete next.attachments
    return next
  })
}

export function agentApiBase(): string {
  const value = import.meta.env.VITE_AGENT_API as string | undefined
  if (!value) {
    throw new Error('VITE_AGENT_API не задан: кабинету некуда отправить диалог интейка')
  }
  return value.replace(/\/$/, '')
}

export function createIntakeTransport(options: {
  agentId: AgentId
  sessionId: string
  accountId: string
  locale: Locale
  organizationId?: string
  productId?: string
  getToken: () => Promise<string | null>
}) {
  return new AssistantChatTransport({
    api: `${agentApiBase()}/chat/${options.agentId}`,
    // Локаль уходит в теле (`data.locale`): `X-Pharma-Locale` нет в CORS
    // шлюза pharma_env, и лишний заголовок роняет preflight.
    //
    // `X-Pharma-Account` — временный обход: инструменты агента резолвят аккаунт
    // из этого заголовка, потому что `accountId` в JWT пустой. Как только агент
    // начнёт резолвить его по `sub` (SinopticsAI/pharma-agent#1), заголовок
    // уйдёт: доверять аккаунту из браузера нельзя.
    headers: async () => {
      const token = await options.getToken()
      return {
        'X-Pharma-Account': options.accountId,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      }
    },
    body: {
      memory: { thread: options.sessionId, resource: options.accountId },
      data: {
        locale: options.locale,
        ...(options.organizationId ? { organizationId: options.organizationId } : {}),
        ...(options.productId ? { productId: options.productId } : {}),
      },
    },
    prepareSendMessagesRequest: ({ id, messages, body, trigger, messageId, requestMetadata }) => ({
      body: {
        ...body,
        id,
        messages: messagesWithoutScanBytes(messages),
        trigger,
        messageId,
        metadata: requestMetadata,
      },
    }),
  })
}
