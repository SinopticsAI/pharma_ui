import { AssistantChatTransport } from '@assistant-ui/react-ai-sdk'

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
  getToken: () => Promise<string | null>
}) {
  return new AssistantChatTransport({
    api: `${agentApiBase()}/chat/${options.agentId}`,
    // Заголовки ограничены списком `allowHeaders` шлюза: всё лишнее роняет
    // preflight, и запрос до агента не доходит. Поэтому локаль диалога
    // заголовком не уходит — агент берёт `zh`, основной язык этого кабинета.
    // Вернуть выбор языка можно, когда шлюз разрешит `X-Pharma-Locale`.
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
    },
  })
}
