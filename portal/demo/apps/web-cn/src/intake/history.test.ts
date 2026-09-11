import type { UIMessage } from '@ai-sdk/react'
import type { IntakeMessage } from '@demo/domain'
import { describe, expect, it } from 'vitest'
import {
  JOURNAL_ASSISTANT_ROLES,
  JOURNAL_USER_ROLES,
  journalHasDraftTool,
  journalPersistedIds,
  journalText,
  journalToolFallbackKey,
  journalToUiMessages,
  messagesHaveDraftTool,
  normalizeUiMessages,
  uiMessagesToRepository,
  uiMessageToJournalAppend,
  unpersistedAppends,
} from './history'

const fallback = (toolName: string) => {
  if (journalToolFallbackKey(toolName) === 'intake.chat.journal.draftCard') return 'карточка черновика'
  if (journalToolFallbackKey(toolName) === 'intake.chat.journal.documentCard') return 'карточка документа'
  return 'карточка'
}

function ui(partial: { id: string; role: UIMessage['role']; parts: UIMessage['parts'] }): UIMessage {
  return partial
}

function row(partial: {
  id: string
  role: IntakeMessage['role']
  text?: IntakeMessage['text']
  payload?: IntakeMessage['payload']
}): IntakeMessage {
  return {
    sessionId: 'ses-1',
    itemId: '',
    at: '2026-09-07T00:00:00Z',
    text: {},
    ...partial,
  }
}

function toolInput(message: UIMessage, toolName: string): unknown {
  const part = message.parts.find((item) => item.type === `tool-${toolName}`)
  expect(part).toBeTruthy()
  return (part as { input?: unknown } | undefined)?.input
}

function expectAppend(message: UIMessage) {
  const append = uiMessageToJournalAppend(message, fallback)
  expect(append).toBeTruthy()
  if (!append) throw new Error('expected journal append')
  return append
}

function expectRestored(messages: IntakeMessage[], locale: 'zh' | 'en' | 'ru') {
  const restored = journalToUiMessages(messages, locale)[0]
  expect(restored).toBeTruthy()
  if (!restored) throw new Error('expected restored message')
  return restored
}

describe('journal ↔ UIMessage', () => {
  it('поднимает user-текст и сохраняет clientMessageId', () => {
    const source = ui({
      id: 'u1',
      role: 'user',
      parts: [{ type: 'text', text: 'лицензия готова' }],
    })
    const append = expectAppend(source)
    expect(append).toEqual({
      role: 'user',
      text: 'лицензия готова',
      payload: {
        clientMessageId: 'u1',
        parts: [{ type: 'text', text: 'лицензия готова' }],
      },
    })

    expect(
      journalToUiMessages(
        [row({ id: 'msg-1', role: 'user', text: { ru: append.text }, payload: append.payload })],
        'ru',
      ),
    ).toEqual([source])
  })

  it('поднимает agent-текст', () => {
    const source = ui({
      id: 'a1',
      role: 'assistant',
      parts: [{ type: 'text', text: 'приложите лицензию' }],
    })
    const append = expectAppend(source)
    expect(append.role).toEqual('agent')

    const restored = expectRestored(
      [row({ id: 'msg-2', role: 'agent', text: { ru: append.text, zh: '请上传执照' }, payload: append.payload })],
      'zh',
    )
    expect(restored.id).toEqual('a1')
    expect(restored.parts).toEqual([{ type: 'text', text: '请上传执照' }])
  })

  it('крутит tool-only show-draft / showDraft', () => {
    const args = {
      scope: 'company',
      entityId: 'org-1',
      fields: [{ key: 'name', label: { ru: 'Название' }, value: 'Acme', source: 'doc' }],
      canApprove: true,
    }
    const source = ui({
      id: 'a-draft',
      role: 'assistant',
      parts: [
        {
          type: 'tool-showDraft',
          toolCallId: 'call-draft',
          state: 'output-available',
          input: args,
          output: undefined,
        } as UIMessage['parts'][number],
      ],
    })
    const append = expectAppend(source)
    expect(append.text).toEqual('карточка черновика')
    expect(append.payload.parts).toEqual([{ type: 'tool', toolName: 'showDraft', args, toolCallId: 'call-draft' }])

    const restored = expectRestored(
      [row({ id: 'msg-draft', role: 'agent', text: { ru: append.text }, payload: append.payload })],
      'ru',
    )
    expect(restored.id).toEqual('a-draft')
    expect(toolInput(restored, 'showDraft')).toEqual(args)
  })

  it('разбирает строковый fields из журнала в массив', () => {
    const restored = expectRestored(
      [
        row({
          id: 'msg-jhgdc31u',
          role: 'agent',
          text: { ru: 'карточка черновика' },
          payload: {
            clientMessageId: 'a-qwen',
            parts: [
              {
                type: 'tool',
                toolName: 'show-draft',
                args: {
                  scope: 'product',
                  entityId: 'prd-ypujohgf',
                  fields:
                    '[{"key": "name", "label": {"ru": "Наименование"}, "value": "Safe-Accu Blood Glucose Meter", "source": "ifu.pdf"}]',
                  missing: '[]',
                  canApprove: 'False',
                },
              },
            ],
          },
        }),
      ],
      'ru',
    )
    expect(toolInput(restored, 'show-draft')).toEqual({
      scope: 'product',
      entityId: 'prd-ypujohgf',
      fields: [
        {
          key: 'name',
          label: { ru: 'Наименование' },
          value: 'Safe-Accu Blood Glucose Meter',
          source: 'ifu.pdf',
        },
      ],
      missing: [],
      canApprove: false,
    })
  })

  it('крутит tool-only ask-document / askDocument', () => {
    const args = { itemType: 'business-license', question: { ru: 'Лицензия?' } }
    const source = ui({
      id: 'a-doc',
      role: 'assistant',
      parts: [
        {
          type: 'tool-ask-document',
          toolCallId: 'call-doc',
          state: 'output-available',
          input: args,
          output: undefined,
        } as UIMessage['parts'][number],
      ],
    })
    const append = expectAppend(source)
    expect(append.text).toEqual('карточка документа')
    expect(append.payload.parts[0]).toMatchObject({ type: 'tool', toolName: 'ask-document', args })

    const restored = expectRestored(
      [row({ id: 'msg-doc', role: 'agent', text: { ru: append.text }, payload: append.payload })],
      'ru',
    )
    expect(toolInput(restored, 'ask-document')).toEqual(args)
  })

  it('не шлёт повторно id из журнала и payload.clientMessageId', () => {
    const ids = journalPersistedIds([row({ id: 'msg-1', role: 'user', payload: { clientMessageId: 'u1', parts: [] } })])
    expect(ids.has('msg-1')).toEqual(true)
    expect(ids.has('u1')).toEqual(true)
  })
})

describe('user написал, /chat упал', () => {
  it('user есть в том, что ушло бы в appendIntakeMessage, assistant не пишется', () => {
    const user = ui({
      id: 'u-fail',
      role: 'user',
      parts: [{ type: 'text', text: 'вот лицензия' }],
    })

    const userWrites = unpersistedAppends([user], new Set(), JOURNAL_USER_ROLES, fallback)
    expect(userWrites).toEqual([
      {
        role: 'user',
        text: 'вот лицензия',
        payload: {
          clientMessageId: 'u-fail',
          parts: [{ type: 'text', text: 'вот лицензия' }],
        },
      },
    ])

    const afterUser = new Set(userWrites.map((write) => write.payload.clientMessageId))
    expect(unpersistedAppends([user], afterUser, JOURNAL_ASSISTANT_ROLES, fallback)).toEqual([])
    expect(unpersistedAppends([user], new Set(), JOURNAL_ASSISTANT_ROLES, fallback)).toEqual([])
  })

  it('пустой user не помечает ход записанным', () => {
    const empty = ui({ id: 'u-empty', role: 'user', parts: [{ type: 'text', text: '   ' }] })
    expect(uiMessageToJournalAppend(empty, fallback)).toBeNull()
    expect(unpersistedAppends([empty], new Set(), JOURNAL_USER_ROLES, fallback)).toEqual([])
  })

  it('пустой журнал не даёт семян для нити', () => {
    expect(journalToUiMessages([], 'ru')).toEqual([])
    expect(uiMessagesToRepository([])).toEqual({ messages: [], headId: null })
  })

  it('строит дерево нити из журнала с parentId', () => {
    const restored = journalToUiMessages(
      [
        row({
          id: 'msg-u',
          role: 'user',
          text: { ru: 'лицензия' },
          payload: { clientMessageId: 'u1', parts: [{ type: 'text', text: 'лицензия' }] },
        }),
        row({
          id: 'msg-a',
          role: 'agent',
          text: { ru: 'приложите скан' },
          payload: { clientMessageId: 'a1', parts: [{ type: 'text', text: 'приложите скан' }] },
        }),
      ],
      'ru',
    )
    expect(restored).toHaveLength(2)
    expect(uiMessagesToRepository(restored)).toEqual({
      messages: [
        { parentId: null, message: restored[0] },
        { parentId: 'u1', message: restored[1] },
      ],
      headId: 'a1',
    })
  })

  it('нормализует content нити assistant-ui в UIMessage', () => {
    const [message] = normalizeUiMessages([
      { id: 'u-thread', role: 'user', content: [{ type: 'text', text: 'подпись вложения' }] },
    ])
    expect(message).toEqual({
      id: 'u-thread',
      role: 'user',
      parts: [{ type: 'text', text: 'подпись вложения' }],
    })
    expect(message).toBeTruthy()
    if (!message) return
    expect(unpersistedAppends([message], new Set(), JOURNAL_USER_ROLES, fallback)[0]?.text).toEqual('подпись вложения')
  })

  it('не падает, если у сообщения нет text, и поднимает tool-part', () => {
    const missingText = row({
      id: 'msg-raw',
      role: 'agent',
      text: undefined as unknown as IntakeMessage['text'],
      payload: {
        clientMessageId: 'a-raw',
        parts: [
          {
            type: 'tool',
            toolName: 'show-draft',
            args: { scope: 'company', entityId: 'org-1', fields: 'not-json', canApprove: true },
          },
        ],
      },
    })
    expect(journalText(missingText, 'zh')).toEqual('')
    const restored = journalToUiMessages([missingText], 'zh')
    expect(restored).toHaveLength(1)
    const first = restored[0]
    if (!first) throw new Error('expected a restored message')
    expect(toolInput(first, 'show-draft')).toEqual({
      scope: 'company',
      entityId: 'org-1',
      fields: 'not-json',
      canApprove: true,
    })
  })
})

describe('draft tool detection', () => {
  it('видит show-draft в нити и в журнале', () => {
    expect(
      messagesHaveDraftTool([
        {
          role: 'assistant',
          parts: [{ type: 'tool-showDraft', toolName: 'showDraft' }],
        },
      ]),
    ).toBe(true)
    expect(messagesHaveDraftTool([{ role: 'assistant', parts: [{ type: 'text', text: 'ok' }] }])).toBe(false)
    expect(
      journalHasDraftTool([
        row({
          id: 'msg-draft',
          role: 'agent',
          payload: { clientMessageId: 'c1', parts: [{ type: 'tool', toolName: 'show-draft', args: {} }] },
        }),
      ]),
    ).toBe(true)
  })
})
