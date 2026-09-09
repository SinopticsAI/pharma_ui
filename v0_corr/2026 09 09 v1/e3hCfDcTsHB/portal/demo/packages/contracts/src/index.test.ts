import { describe, expect, it } from 'vitest'
import { identitySchema, sessionSearchSchema } from './index'

describe('sessionSearchSchema', () => {
  it('принимает необязательную сессию', () => {
    expect(sessionSearchSchema.parse({})).toEqual({})
    expect(sessionSearchSchema.parse({ session: 'abc' })).toEqual({ session: 'abc' })
  })
})

describe('identitySchema', () => {
  it('разбирает ответ /accounts/me', () => {
    const parsed = identitySchema.safeParse({
      accountId: 'acc-1',
      subject: 'user-1',
      role: 'client',
      displayName: '李',
      account: { id: 'acc-1', name: { zh: '公司' }, status: 'active' },
      can: { approveAsSpecialist: false, operate: false },
    })
    expect(parsed.success).toBe(true)
  })

  it('не принимает выдуманную роль', () => {
    const parsed = identitySchema.safeParse({
      accountId: 'acc-1',
      subject: 'user-1',
      role: 'superuser',
      displayName: '李',
      account: { id: 'acc-1', name: {}, status: 'active' },
      can: { approveAsSpecialist: false, operate: false },
    })
    expect(parsed.success).toBe(false)
  })
})
