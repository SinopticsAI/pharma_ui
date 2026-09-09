import type { Organization, Product } from '@demo/domain'
import { describe, expect, it } from 'vitest'
import { attachLiveCase, liveCompanyCard, liveProductCard, liveSaleProgress, mergeCaseProducts } from './live-cards'

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

  it('подставляет caseId из списка кейсов и добавляет пропавший продукт', () => {
    const cases = [
      {
        id: 'case-mh-200',
        code: 'RU-0417',
        product: { zh: 'MH-200', en: 'MH-200', ru: 'MH-200' },
        manufacturer: { zh: 'Minghu', en: 'Minghu', ru: 'Минху' },
        kind: 'device' as const,
        track: 'pp1684' as const,
        riskClass: '2b' as const,
        currentStage: 'samples' as const,
        nextActor: 'hq' as const,
        waitingFor: { zh: '—', en: '—', ru: '—' },
        dueWorkingDays: 8,
        startedOn: '2025-07-01',
        cycleMonths: [12, 16] as [number, number],
        mandateComplete: true,
        modelsLocked: true,
        productId: 'prd-mh-200',
        organizationId: 'org-cn-demo',
      },
    ]
    const linked = attachLiveCase(product('prd-mh-200', 'org-cn-demo', 78), cases)
    expect(linked.caseId).toBe('case-mh-200')
    const merged = mergeCaseProducts([product('prd-rk-30', 'org-cn-ruikang', 100)], cases)
    expect(merged[0]?.id).toBe('prd-mh-200')
    expect(merged[0]?.caseId).toBe('case-mh-200')
    expect(liveProductCard(merged[0], org('org-cn-demo', 'profile_approved'), cases).caseStatus.ru).toContain('RU-0417')
  })
})
