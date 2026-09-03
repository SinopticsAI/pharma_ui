import type { ChatModelAdapter } from '@assistant-ui/react'
import { mockAgentTurn, type CardPayload } from '@demo/mock'

/**
 * Адаптер одного хода агента.
 *
 * Ответ приходит целиком: Serverless Container не умеет отдавать поток, он
 * обязан завершить ход до возврата. Поэтому здесь нет постепенной дописи
 * текста, а экран показывает явное состояние ожидания.
 *
 * Без VITE_AGENT_API работает сценарный мок, чтобы демо кликалось без
 * поднятого Mastra.
 */

const AGENT_API = import.meta.env.VITE_AGENT_API as string | undefined

export interface AgentTurn {
  text: string
  card?: CardPayload
}

async function callAgent(
  agentId: string,
  sessionId: string,
  messages: { role: string; content: string }[],
  token: string | undefined,
): Promise<AgentTurn> {
  const response = await fetch(`${AGENT_API}/chat/${agentId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ messages, sessionId }),
  })
  if (!response.ok) {
    throw new Error(`agent ${response.status}`)
  }
  const payload = (await response.json()) as { text?: string; card?: CardPayload }
  return { text: payload.text ?? '', card: payload.card }
}

export function createIntakeAdapter(options: {
  agentId: 'companyIntake' | 'productIntake'
  sessionId: string
  token?: string
  onCard: (card: CardPayload) => void
}): ChatModelAdapter {
  return {
    async run({ messages, abortSignal }) {
      const history = messages.map((message) => ({
        role: message.role,
        content: message.content
          .map((part) => (part.type === 'text' ? part.text : ''))
          .join(' ')
          .trim(),
      }))

      const turn = AGENT_API
        ? await callAgent(options.agentId, options.sessionId, history, options.token)
        : await mockAgentTurn(options.sessionId)

      if (abortSignal.aborted) {
        return { content: [] }
      }
      if (turn.card) {
        options.onCard(turn.card)
      }
      return { content: turn.text ? [{ type: 'text', text: turn.text }] : [] }
    },
  }
}
