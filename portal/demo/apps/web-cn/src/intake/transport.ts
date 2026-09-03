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
 */

export type AgentId = 'companyIntake' | 'productIntake'

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
  getToken: () => Promise<string | null>
}) {
  return new AssistantChatTransport({
    api: `${agentApiBase()}/chat/${options.agentId}`,
    headers: async () => {
      const token = await options.getToken()
      return {
        'X-Pharma-Locale': options.locale,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      }
    },
    body: {
      memory: { thread: options.sessionId, resource: options.accountId },
    },
  })
}
