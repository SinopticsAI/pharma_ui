import type { ChatMessage, IntakeMessage } from '@demo/domain'
import { describe, expect, it } from 'vitest'
import { caseChatToThread, intakeToThread } from './case-thread'

const intake = (partial: Partial<IntakeMessage> & Pick<IntakeMessage, 'id' | 'role'>): IntakeMessage => ({
  sessionId: 's1',
  text: { ru: 'привет', zh: '你好', en: 'hello' },
  itemId: '',
  at: '2026-09-01T10:00:00Z',
  ...partial,
})

describe('intakeToThread', () => {
  it('прячет system и пустые реплики', () => {
    const items = intakeToThread(
      [
        intake({ id: '1', role: 'system' }),
        intake({ id: '2', role: 'user' }),
        intake({ id: '3', role: 'agent', text: { ru: '', zh: '', en: '' } }),
      ],
      'zh',
      { cn: '中国侧', agent: '代理' },
    )
    expect(items).toEqual([
      { id: '2', side: 'cn', author: '中国侧', body: '你好', at: '2026-09-01T10:00:00Z' },
    ])
  })
})

describe('caseChatToThread', () => {
  it('помечает сторону и отсутствие перевода', () => {
    const message: ChatMessage = {
      id: 'c1',
      caseId: 'case-1',
      side: 'ru',
      author: 'Иванов',
      text: { ru: 'ждём протокол' },
      at: '2026-09-02T08:00:00Z',
    }
    const [item] = caseChatToThread(
      [message],
      () => ({ value: 'ждём протокол', translated: false }),
      (side) => (side === 'cn' ? 'CN' : 'RU'),
    )
    expect(item).toMatchObject({
      id: 'c1',
      side: 'ru',
      author: 'Иванов · RU',
      body: 'ждём протокол',
      untranslated: true,
    })
  })
})
