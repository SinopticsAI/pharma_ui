import type { Organization, Product, RegistrationCase } from '@demo/domain'
import { describe, expect, it } from 'vitest'
import { cabinetNavProductId, resolveShellFocus } from './shell-focus'

const product = (id: string, caseId = '', organizationId = 'org-a'): Product => ({
  id,
  accountId: 'acc',
  organizationId,
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

const card = (id: string, productId: string, code = 'RU-0417'): RegistrationCase => ({
  id,
  code,
  product: { zh: 'Глюкометр MH-200 + полоски', en: 'MH-200', ru: 'Глюкометр MH-200 + полоски' },
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

const org = (id: string): Organization => ({
  id,
  accountId: 'acc',
  kind: 'cn',
  name: { zh: id, en: id, ru: id },
  status: 'profile_approved',
  draft: {},
  profile: {},
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
})

const mh200 = product('prd-mh-200', 'case-mh-200', 'org-minghu')
const fresh = product('prd-jzrhuwxe', '', 'org-fresh')
const ru0417 = card('case-mh-200', 'prd-mh-200')
const orgs = [org('org-minghu'), org('org-fresh')]

describe('resolveShellFocus', () => {
  it('не берёт чужой RU-0417, когда в URL другой продукт', () => {
    const focus = resolveShellFocus({
      productId: fresh.id,
      products: [mh200, fresh],
      cases: [ru0417],
      organizations: orgs,
    })
    expect(focus.product?.id).toBe(fresh.id)
    expect(focus.case).toBeUndefined()
    expect(focus.organization?.id).toBe('org-fresh')
  })

  it('показывает кейс только своего продукта', () => {
    const focus = resolveShellFocus({
      productId: mh200.id,
      products: [mh200, fresh],
      cases: [ru0417],
      organizations: orgs,
    })
    expect(focus.product?.id).toBe(mh200.id)
    expect(focus.case?.code).toBe('RU-0417')
  })

  it('без productId в URL не подставляет первый кейс аккаунта', () => {
    const focus = resolveShellFocus({
      products: [mh200, fresh],
      cases: [ru0417],
      organizations: orgs,
    })
    expect(focus.product).toBeUndefined()
    expect(focus.case).toBeUndefined()
  })
})

describe('cabinetNavProductId', () => {
  it('держит меню на продукте из маршрута', () => {
    expect(cabinetNavProductId('prd-jzrhuwxe', 'prd-mh-200')).toBe('prd-jzrhuwxe')
    expect(cabinetNavProductId(undefined, 'prd-mh-200')).toBe('prd-mh-200')
  })
})
