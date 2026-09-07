import type { ChatMessage, IntakeMessage, Locale } from '@demo/domain'
import { journalText } from '../intake/history'

export type ThreadSide = 'cn' | 'ru' | 'agent'

export interface CaseThreadItem {
  id: string
  side: ThreadSide
  author: string
  body: string
  at: string
  untranslated?: boolean
}

/** Журнал интейка — единственная переписка, пока ядро не отдаёт чат кейса. */
export function intakeToThread(messages: IntakeMessage[], locale: Locale, labels: { cn: string; agent: string }): CaseThreadItem[] {
  return messages.flatMap((message) => {
    if (message.role === 'system') return []
    const body = journalText(message, locale)
    if (!body) return []
    return [
      {
        id: message.id,
        side: message.role === 'user' ? 'cn' : 'agent',
        author: message.role === 'user' ? labels.cn : labels.agent,
        body,
        at: message.at,
      },
    ]
  })
}

export function caseChatToThread(
  messages: ChatMessage[],
  resolve: (text: ChatMessage['text']) => { value: string; translated: boolean },
  sideLabel: (side: ChatMessage['side']) => string,
): CaseThreadItem[] {
  return messages.map((message) => {
    const resolved = resolve(message.text)
    return {
      id: message.id,
      side: message.side,
      author: `${message.author} · ${sideLabel(message.side)}`,
      body: resolved.value,
      at: message.at,
      untranslated: !resolved.translated,
    }
  })
}
