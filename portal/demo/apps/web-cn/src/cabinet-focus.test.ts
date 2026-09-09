import type { Product, RegistrationCase } from '@demo/domain'
import { describe, expect, it } from 'vitest'
import { pickCabinetFocus } from './cabinet-focus'
import { DEMO_CASE_RU0417, DEMO_PRODUCT_MH200 } from './demo/ids'

const product = (id: string, caseId = ''): Product => ({
  id,
  accountId: 'acc',
  organizationId: 'org',
  name: { zh: id, en: id, ru: id },
  kind: 'device',
  status: 'collecting',
  draft: {},
  completeness: 0,
  selectedVariantId: '',
  specialistApprovedBy: '',
  specialistApprovedAt: '',
  clientApprovedBy: '',
  clientApprovedAt: '',
  caseId,
  updatedAt: '2026-01-01T00:00:00Z',
})

const card = (id: string, productId: string): RegistrationCase => ({
  id,
  code: 'RU-0000',
  product: { zh: productId, en: productId, ru: productId },
  manufacturer: { zh: 'org', en: 'org', ru: 'org' },
  kind: 'device',
  track: 'pp1684',
  riskClass: '2b',
  currentStage: 'samples',
  nextActor: 'hq',
  waitingFor: { zh: '—', en: '—', ru: '—' },
  dueWorkingDays: 8,
  startedOn: '2025-07-01',
  cycleMonths: [12, 16],
  mandateComplete: true,
  modelsLocked: true,
  productId,
})

describe('pickCabinetFocus', () => {
  it('в offline оставляет walkthrough MH-200', () => {
    expect(pickCabinetFocus([product('prd-rk-30')], [], true)).toEqual({
      caseId: DEMO_CASE_RU0417,
      productId: DEMO_PRODUCT_MH200,
    })
  })

  it('берёт первый живой продукт с кейсом', () => {
    const focus = pickCabinetFocus(
      [product('prd-rk-30'), product('prd-mh-200', 'case-mh-200')],
      [card('case-mh-200', 'prd-mh-200')],
      false,
    )
    expect(focus).toEqual({ caseId: 'case-mh-200', productId: 'prd-mh-200' })
  })

  it('без кейса ведёт в кабинет первого продукта', () => {
    const focus = pickCabinetFocus([product('prd-rk-30')], [], false)
    expect(focus).toEqual({ caseId: '', productId: 'prd-rk-30' })
  })

  it('если продукт с кейсом не пришёл в список — берёт id из кейса', () => {
    const focus = pickCabinetFocus([product('prd-rk-30')], [card('case-mh-200', 'prd-mh-200')], false)
    expect(focus).toEqual({ caseId: 'case-mh-200', productId: 'prd-mh-200' })
  })
})
