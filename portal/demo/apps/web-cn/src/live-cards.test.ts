import type { Organization, Product } from '@demo/domain'
import { describe, expect, it } from 'vitest'
import { liveCompanyCard, liveProductCard, liveSaleProgress } from './live-cards'

const org = (id: string, status: Organization['status'] = 'collecting'): Organization => ({
  id,
  accountId: 'acc',
  kind: 'cn',
  name: { zh: id, en: id, ru: id },
  status,
  draft: { registrationNumber: { value: '91440300MA5G7123X', source: 'seed' } },
  profile: status === 'profile_approved' ? { registrationNumber: '91440300MA5G7123X' } : {},
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
})

const product = (id: string, organizationId: string, completeness = 50, caseId = ''): Product => ({
  id,
  accountId: 'acc',
  organizationId,
  name: { zh: id, en: id, ru: id },
  kind: 'device',
  status: 'collecting',
  draft: {},
  completeness,
  selectedVariantId: '',
  specialistApprovedBy: '',
  specialistApprovedAt: '',
  clientApprovedBy: '',
  clientApprovedAt: '',
  caseId,
  updatedAt: '2026-01-01T00:00:00Z',
  documents: [],
  missing: [],
  variants: [],
})

describe('live cards', () => {
  it('берёт USCC из профиля одобренной компании и считает продукты', () => {
    const minghu = org('org-cn-demo', 'profile_approved')
    const card = liveCompanyCard(minghu, [product('prd-mh-200', 'org-cn-demo'), product('other', 'org-other')])
    expect(card.uscc).toBe('91440300MA5G7123X')
    expect(card.verified).toBe(true)
    expect(card.productCount).toBe(1)
  })

  it('не подставляет чужой кейс и считает средний прогресс', () => {
    const card = liveProductCard(product('prd-rk-30', 'org-cn-ruikang', 100), org('org-cn-ruikang'), [])
    expect(card.progress).toBe(100)
    expect(card.product.caseId).toBe('')
    expect(liveSaleProgress([product('a', 'o', 40), product('b', 'o', 80)])).toBe(60)
    expect(liveSaleProgress([])).toBe(0)
  })
})
