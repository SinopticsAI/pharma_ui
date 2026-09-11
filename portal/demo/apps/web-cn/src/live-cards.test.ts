import type { Organization, OrganizationSlot, Product } from '@demo/domain'
import { describe, expect, it } from 'vitest'
import {
  apostilleProgress,
  attachLiveCase,
  companyDocumentProgress,
  liveCompanyCard,
  liveProductCard,
  liveSaleProgress,
  mergeCaseProducts,
  productDisplayName,
} from './live-cards'

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

describe('productDisplayName', () => {
  it('берёт наименование из draft, когда name пустой', () => {
    const item = product('prd-sml9v3yp', 'org')
    item.name = {}
    item.draft = { name: { value: '血糖仪 X1', source: 'IFU' } }
    expect(productDisplayName(item, 'Новый продукт').ru).toBe('血糖仪 X1')
  })

  it('не показывает id без имени и черновика', () => {
    const item = product('prd-sml9v3yp', 'org')
    item.name = {}
    expect(productDisplayName(item, 'Новый продукт').ru).toBe('Новый продукт')
    expect(productDisplayName(item, 'Новый продукт').ru).not.toContain('prd-')
  })
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

const slot = (
  key: string,
  section: OrganizationSlot['section'],
  extras: Partial<OrganizationSlot> = {},
): OrganizationSlot => ({
  key,
  section,
  title: {},
  needsNotary: false,
  needsApostille: false,
  needsTranslation: false,
  optional: false,
  status: 'pending',
  documentId: '',
  ...extras,
})

/** Чек-лист Cofoe: 7 обязательных документов, 5 с апостилем, risk и trademark не в счётчиках. */
function cofoeSlots(): OrganizationSlot[] {
  return [
    slot('bank-account', 'banking', { status: 'filled', documentId: 'it-bank' }),
    slot('business-license', 'identity', { status: 'filled', needsApostille: true, documentId: 'it-lic' }),
    slot('company-registry', 'identity', { status: 'filled', documentId: 'it-reg' }),
    slot('iso-13485', 'documents', { status: 'filled', needsApostille: true, documentId: 'it-iso' }),
    slot('poa-upp', 'authority', { status: 'filled', needsApostille: true, documentId: 'it-poa' }),
    slot('risk-check', 'risk', { status: 'pending' }),
    slot('signatory', 'authority', { status: 'filled', needsApostille: true, documentId: 'it-sig' }),
    slot('site-docs', 'documents', { status: 'filled', needsApostille: true, documentId: 'it-site' }),
    slot('trademark', 'documents', { optional: true, needsApostille: true, status: 'pending' }),
  ]
}

describe('company document counters', () => {
  it('считает обязательные слоты кроме risk и апостиль без optional', () => {
    const cofoe = org('org-pmswh3yn', 'profile_approved')
    cofoe.slots = cofoeSlots()
    cofoe.completeness = {
      filled: 7,
      total: 8,
      percent: 88,
      ready: false,
      sections: [
        { key: 'banking', filled: 1, total: 1 },
        { key: 'identity', filled: 2, total: 2 },
        { key: 'documents', filled: 2, total: 2 },
        { key: 'authority', filled: 2, total: 2 },
        { key: 'risk', filled: 0, total: 1 },
      ],
    }
    expect(companyDocumentProgress(cofoe)).toEqual({ done: 7, total: 7 })
    expect(apostilleProgress(cofoe)).toEqual({ done: 5, total: 5 })
    const card = liveCompanyCard(cofoe, [])
    expect(card.docsDone).toBe(7)
    expect(card.docsTotal).toBe(7)
    expect(card.apostilleDone).toBe(5)
    expect(card.apostilleTotal).toBe(5)
    expect(card.organization.completeness?.percent).toBe(88)
  })

  it('без слотов оставляет 0/0', () => {
    const empty = org('org-cn-demo', 'profile_approved')
    empty.slots = []
    expect(companyDocumentProgress(empty)).toEqual({ done: 0, total: 0 })
    expect(apostilleProgress(empty)).toEqual({ done: 0, total: 0 })
    const card = liveCompanyCard(empty, [])
    expect(card.docsDone).toBe(0)
    expect(card.docsTotal).toBe(0)
    expect(card.apostilleDone).toBe(0)
    expect(card.apostilleTotal).toBe(0)
  })
})
