import type { Organization } from '@demo/domain'
import { describe, expect, it } from 'vitest'
import { DEMO_ORG_MINGHU } from './demo/ids'
import { eligibleOrganizations } from './portfolio-create'

const org = (id: string, status: Organization['status']): Organization => ({
  id,
  accountId: 'acc',
  kind: 'cn',
  name: { zh: id, en: id, ru: id },
  status,
  draft: {},
  profile: {},
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
})

describe('eligibleOrganizations', () => {
  it('оставляет только одобренные живые компании', () => {
    const approved = org('org-live', 'profile_approved')
    const ready = eligibleOrganizations([
      org('org-draft', 'draft'),
      org('org-collecting', 'collecting'),
      org(DEMO_ORG_MINGHU, 'profile_approved'),
      approved,
    ])
    expect(ready).toEqual([approved])
  })
})
