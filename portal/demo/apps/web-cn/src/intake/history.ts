import type { UIMessage } from '@ai-sdk/react'
import type { IntakeMessage } from '@demo/domain'

/**
 * Журнал ядра ↔ нить assistant-ui.
 *
 * Роль в ядре — `agent`, в AI SDK — `assistant`. Текст в журнале трёхъязычный,
 * в нить кладём уже выбранную локаль. Карточки живут в `payload.parts`: после
 * перезагрузки `journalToUiMessages` поднимает и прозу, и tool-parts.
 */

export type JournalTextPart = { type: 'text'; text: string }
export type JournalToolPart = { type: 'tool'; toolName: string; args: unknown; toolCallId?: string }
export type JournalPart = JournalTextPart | JournalToolPart

export type JournalPayload = {
  clientMessageId: string
  parts: JournalPart[]
}

export type JournalAppend = {
  role: 'user' | 'agent'
  text: string
  payload: JournalPayload
}

export type JournalUiRole = 'user' | 'assistant'

export const JOURNAL_USER_ROLES: ReadonlySet<JournalUiRole> = new Set(['user'])
export const JOURNAL_ASSISTANT_ROLES: ReadonlySet<JournalUiRole> = new Set(['assistant'])

const DRAFT_TOOLS = new Set(['showDraft', 'show-draft'])
const DOCUMENT_TOOLS = new Set(['askDocument', 'ask-document'])

export function journalToolFallbackKey(
  toolName: string,
): 'intake.chat.journal.draftCard' | 'intake.chat.journal.documentCard' | 'intake.chat.journal.toolCard' {
  if (DRAFT_TOOLS.has(toolName)) return 'intake.chat.journal.draftCard'
  if (DOCUMENT_TOOLS.has(toolName)) return 'intake.chat.journal.documentCard'
  return 'intake.chat.journal.toolCard'
}

export function journalText(message: IntakeMessage, locale: 'zh' | 'en' | 'ru'): string {
  return message.text[locale] || message.text.ru || message.text.en || message.text.zh || ''
}

export function journalPersistedIds(messages: IntakeMessage[]): Set<string> {
  const ids = new Set<string>()
  for (const message of messages) {
    ids.add(message.id)
    const clientId = readClientMessageId(message.payload)
    if (clientId) ids.add(clientId)
  }
  return ids
}

export function journalToUiMessages(messages: IntakeMessage[], locale: 'zh' | 'en' | 'ru'): UIMessage[] {
  return messages.flatMap((message) => {
    if (message.role === 'system') return []
    const restored = restoreUiMessage(message, locale)
    return restored ? [restored] : []
  })
}

/** Дерево для `useChatRuntime({ messageRepository })`: сеем нить из журнала, не из Mastra. */
export type JournalMessageRepository = {
  messages: { parentId: string | null; message: UIMessage }[]
  headId: string | null
}

export function uiMessagesToRepository(messages: UIMessage[]): JournalMessageRepository {
  const links: JournalMessageRepository['messages'] = []
  let parentId: string | null = null
  for (const message of messages) {
    links.push({ parentId, message })
    parentId = message.id
  }
  return { messages: links, headId: messages.at(-1)?.id ?? null }
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

export function uiMessageToJournalAppend(
  message: UIMessage,
  fallbackText: (toolName: string) => string,
): JournalAppend | null {
  const role = toJournalRole(message.role)
  if (!role) return null
  const parts = journalPartsFromUi(message)
  const tools = parts.filter((part): part is JournalToolPart => part.type === 'tool')
  const text = uiMessageText(message) || (tools[0] ? fallbackText(tools[0].toolName) : '')
  if (!text && tools.length === 0) return null
  return {
    role,
    text,
    payload: { clientMessageId: message.id, parts },
  }
}

export function unpersistedAppends(
  messages: UIMessage[],
  persisted: ReadonlySet<string>,
  roles: ReadonlySet<JournalUiRole>,
  fallbackText: (toolName: string) => string,
): JournalAppend[] {
  const seen = new Set(persisted)
  const writes: JournalAppend[] = []
  for (const message of messages) {
    if (seen.has(message.id)) continue
    if (message.role !== 'user' && message.role !== 'assistant') continue
    if (!roles.has(message.role)) continue
    const append = uiMessageToJournalAppend(message, fallbackText)
    if (!append) continue
    seen.add(message.id)
    writes.push(append)
  }
  return writes
}

/** Нить assistant-ui отдаёт `content`, AI SDK — `parts`. К журналу сводим к UIMessage. */
export function normalizeUiMessages(raw: unknown): UIMessage[] {
  if (!Array.isArray(raw)) return []
  return raw.flatMap((item) => {
    const message = normalizeUiMessage(item)
    return message ? [message] : []
  })
}

function normalizeUiMessage(raw: unknown): UIMessage | null {
  if (!raw || typeof raw !== 'object') return null
  const rec = raw as Record<string, unknown>
  if (typeof rec.id !== 'string' || !rec.id) return null
  if (rec.role !== 'user' && rec.role !== 'assistant' && rec.role !== 'system') return null
  const source = Array.isArray(rec.parts) ? rec.parts : Array.isArray(rec.content) ? rec.content : []
  const parts = source.flatMap((item) => {
    const part = normalizeUiPart(item)
    return part ? [part] : []
  })
  return { id: rec.id, role: rec.role, parts }
}

function restoreUiMessage(message: IntakeMessage, locale: 'zh' | 'en' | 'ru'): UIMessage | null {
  const text = journalText(message, locale)
  const stored = readPayloadParts(message.payload)
  const tools = stored.filter((part): part is JournalToolPart => part.type === 'tool')
  const parts: UIMessage['parts'] = []
  if (text) parts.push({ type: 'text', text })
  for (const [index, tool] of tools.entries()) {
    parts.push(toToolUiPart(tool, message.id, index))
  }
  if (parts.length === 0) return null
  return {
    id: readClientMessageId(message.payload) ?? message.id,
    role: message.role === 'user' ? 'user' : 'assistant',
    parts,
  }
}

function journalPartsFromUi(message: UIMessage): JournalPart[] {
  const parts: JournalPart[] = []
  for (const part of message.parts) {
    if (part.type === 'text') {
      const text = part.text.trim()
      if (text) parts.push({ type: 'text', text })
      continue
    }
    const tool = toolFromUiPart(part)
    if (tool) parts.push(tool)
  }
  return parts
}

function toolFromUiPart(part: UIMessage['parts'][number]): JournalToolPart | null {
  const rec = part as unknown as Record<string, unknown>
  const toolName = toolNameFromRecord(rec)
  if (!toolName) return null
  const toolCallId = typeof rec.toolCallId === 'string' ? rec.toolCallId : undefined
  return {
    type: 'tool',
    toolName,
    args: rec.input ?? rec.args ?? {},
    ...(toolCallId ? { toolCallId } : {}),
  }
}

function normalizeUiPart(raw: unknown): UIMessage['parts'][number] | null {
  if (!raw || typeof raw !== 'object') return null
  const rec = raw as Record<string, unknown>
  if (rec.type === 'text' && typeof rec.text === 'string') {
    return { type: 'text', text: rec.text }
  }
  const nested = rec.toolInvocation
  const fromNested = nested && typeof nested === 'object' ? (nested as Record<string, unknown>) : null
  const toolName = toolNameFromRecord(rec) ?? (fromNested ? toolNameFromRecord(fromNested) : null)
  if (!toolName) return null
  const toolCallId =
    (typeof rec.toolCallId === 'string' && rec.toolCallId) ||
    (typeof fromNested?.toolCallId === 'string' && fromNested.toolCallId) ||
    `tool-${toolName}`
  return toToolUiPart(
    {
      type: 'tool',
      toolName,
      args: rec.input ?? rec.args ?? fromNested?.args ?? fromNested?.input ?? {},
      toolCallId,
    },
    toolCallId,
    0,
  )
}

function toToolUiPart(tool: JournalToolPart, messageId: string, index: number): UIMessage['parts'][number] {
  return {
    type: `tool-${tool.toolName}`,
    toolCallId: tool.toolCallId || `${messageId}:${index}:${tool.toolName}`,
    state: 'output-available',
    input: tool.args ?? {},
    output: undefined,
  } as UIMessage['parts'][number]
}

function toolNameFromRecord(rec: Record<string, unknown>): string | null {
  if (typeof rec.toolName === 'string' && rec.toolName) return rec.toolName
  if (typeof rec.type !== 'string') return null
  if (rec.type === 'dynamic-tool' || rec.type === 'tool-call' || rec.type === 'tool-invocation') return null
  if (rec.type.startsWith('tool-')) return rec.type.slice('tool-'.length) || null
  return null
}

function readClientMessageId(payload: IntakeMessage['payload']): string | undefined {
  if (!payload || typeof payload !== 'object') return undefined
  const value = payload.clientMessageId
  return typeof value === 'string' && value ? value : undefined
}

function readPayloadParts(payload: IntakeMessage['payload']): JournalPart[] {
  if (!payload || typeof payload !== 'object' || !Array.isArray(payload.parts)) return []
  const parts: JournalPart[] = []
  for (const item of payload.parts) {
    if (!item || typeof item !== 'object') continue
    const rec = item as Record<string, unknown>
    if (rec.type === 'text' && typeof rec.text === 'string' && rec.text.trim()) {
      parts.push({ type: 'text', text: rec.text })
      continue
    }
    if (rec.type === 'tool' && typeof rec.toolName === 'string' && rec.toolName) {
      parts.push({
        type: 'tool',
        toolName: rec.toolName,
        args: rec.args ?? {},
        ...(typeof rec.toolCallId === 'string' && rec.toolCallId ? { toolCallId: rec.toolCallId } : {}),
      })
    }
  }
  return parts
}
