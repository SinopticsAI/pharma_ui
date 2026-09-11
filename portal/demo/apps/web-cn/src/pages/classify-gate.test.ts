import type { ClassificationVariant, Product } from '@demo/domain'
import { describe, expect, it } from 'vitest'
import { countPendingActions, defaultDemoState } from '../demo/state'
import { canSelectLiveVariant, clientCanBuildMap, resolveVariants, variantIsChoosable } from './classify-live'

const product = (partial: Partial<Product> = {}): Product => ({
  id: 'prd-sml9v3yp',
  accountId: 'acc',
  organizationId: 'org',
  name: { zh: 'X1', en: 'X1', ru: 'X1' },
  kind: 'device',
  status: 'variants_pending',
  draft: {},
  completeness: 80,
  selectedVariantId: '',
  specialistApprovedBy: '',
  specialistApprovedAt: '',
  clientApprovedBy: '',
  clientApprovedAt: '',
  caseId: '',
  updatedAt: '2026-01-01T00:00:00Z',
  ...partial,
})

const variant = (id: string): ClassificationVariant => ({
  id,
  productId: 'prd-sml9v3yp',
  variantType: 'recommended',
  kind: 'device',
  track: 'pp1684',
  riskClass: '2b',
  title: { zh: id, en: id, ru: id },
  summary: { zh: id, en: id, ru: id },
  pros: [],
  cons: [],
  reason: null,
  budget: {},
  distribution: {},
  cycleMonths: [12, 16],
  selected: false,
})

describe('classification dual confirmation', () => {
  it('counts the client confirmation as a pending action until both sides signed', () => {
    const open = defaultDemoState()
    expect(open.rk30SpecialistApproved && !open.rk30ClientApproved).toBe(true)
    const closed = {
      ...open,
      rk30ClientApproved: true,
      poaDraftAccepted: true,
      logisticsConfirmed: true,
      mh200Electro: true,
    }
    expect(countPendingActions(closed)).toBe(0)
  })
})

describe('clientCanBuildMap', () => {
  it('строит карту по выбранному варианту без ожидания специалиста', () => {
    expect(clientCanBuildMap(undefined)).toBe(false)
    expect(clientCanBuildMap(product())).toBe(false)
    expect(clientCanBuildMap(product({ selectedVariantId: 'var-a' }))).toBe(true)
    expect(
      clientCanBuildMap(
        product({
          selectedVariantId: 'var-a',
          clientApprovedAt: '2026-09-11T10:00:00Z',
        }),
      ),
    ).toBe(false)
    expect(clientCanBuildMap(product({ selectedVariantId: 'var-a', caseId: 'case-1' }))).toBe(false)
  })
})

describe('canSelectLiveVariant', () => {
  it('даёт выбрать вариант, пока нет кейса и подтверждения специалиста', () => {
    expect(canSelectLiveVariant({ canApproveAsSpecialist: true, product: product() })).toBe(true)
    expect(canSelectLiveVariant({ canApproveAsSpecialist: false, product: product() })).toBe(false)
    expect(
      canSelectLiveVariant({
        canApproveAsSpecialist: true,
        product: product({ specialistApprovedAt: '2026-09-10T10:00:00Z' }),
      }),
    ).toBe(false)
    expect(canSelectLiveVariant({ canApproveAsSpecialist: true, product: product({ caseId: 'case-1' }) })).toBe(false)
  })
})

describe('variantIsChoosable', () => {
  it('запрещает выбрать forbidden', () => {
    expect(variantIsChoosable(variant('var-a'))).toBe(true)
    expect(variantIsChoosable({ ...variant('var-c'), variantType: 'forbidden' })).toBe(false)
  })
})

describe('resolveVariants', () => {
  it('берёт варианты из карточки, иначе из отдельного списка', () => {
    const listed = [variant('from-list')]
    expect(resolveVariants(undefined, listed)).toEqual(listed)
    expect(resolveVariants(product({ variants: [] }), listed)).toEqual(listed)
    const embedded = [variant('from-product')]
    expect(resolveVariants(product({ variants: embedded }), listed)).toEqual(embedded)
  })
})
