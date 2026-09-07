import type { UIMessage } from '@ai-sdk/react'
import type { IntakeMessage } from '@demo/domain'

/**
 * Журнал ядра ↔ нить assistant-ui.
 *
 * Роль в ядре — `agent`, в AI SDK — `assistant`. Текст в журнале трёхъязычный,
 * в нить кладём уже выбранную локаль. Карточки инструментов в журнале не живут:
 * после перезагрузки остаётся проза хода.
 */

export function journalText(message: IntakeMessage, locale: 'zh' | 'en' | 'ru'): string {
  return message.text[locale] || message.text.ru || message.text.en || message.text.zh || ''
}

export function journalToUiMessages(messages: IntakeMessage[], locale: 'zh' | 'en' | 'ru'): UIMessage[] {
  return messages
    .filter((message) => message.role !== 'system')
    .map((message) => ({
      id: message.id,
      role: message.role === 'user' ? 'user' : 'assistant',
      parts: [{ type: 'text' as const, text: journalText(message, locale) }],
    }))
}

export function uiMessageText(message: UIMessage): string {
  return message.parts
    .map((part) => (part.type === 'text' ? part.text : ''))
    .filter(Boolean)
    .join('\n')
    .trim()
}

export function toJournalRole(role: UIMessage['role']): 'user' | 'agent' | null {
  if (role === 'user') return 'user'
  if (role === 'assistant') return 'agent'
  return null
}
