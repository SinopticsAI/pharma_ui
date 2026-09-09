import { DEMO_CASE_RU0417, DEMO_ORG_MINGHU, DEMO_PRODUCT_MH200 } from './ids'

export interface DemoUiState {
  currentCompanyId: string
  currentProductId: string
  currentCaseId: string
  rk30Selected: 'A' | 'B' | null
  rk30SpecialistApproved: boolean
  rk30ClientApproved: boolean
  rk30MapBuilt: boolean
  poaDraftAccepted: boolean
  weDoTranslation: boolean
  logisticsConfirmed: boolean
  labLetterApproved: boolean
  rznDraftReviewed: boolean
  casePaused: boolean
  notificationsRead: boolean
  ruikangLicense: boolean
  ruikangIso: boolean
  ruikangCharter: boolean
  ruikangBankDone: boolean
  mh200Electro: boolean
  mh200Accuracy: boolean
  mh200Market: 'ru' | 'eaeu' | null
}

const STORAGE_KEY = 'medmost-cn-demo-ui'

export const defaultDemoState = (): DemoUiState => ({
  currentCompanyId: DEMO_ORG_MINGHU,
  currentProductId: DEMO_PRODUCT_MH200,
  currentCaseId: DEMO_CASE_RU0417,
  rk30Selected: 'A',
  rk30SpecialistApproved: true,
  rk30ClientApproved: false,
  rk30MapBuilt: false,
  poaDraftAccepted: false,
  weDoTranslation: false,
  logisticsConfirmed: false,
  labLetterApproved: false,
  rznDraftReviewed: false,
  casePaused: false,
  notificationsRead: false,
  ruikangLicense: true,
  ruikangIso: true,
  ruikangCharter: false,
  ruikangBankDone: false,
  mh200Electro: false,
  mh200Accuracy: false,
  mh200Market: null,
})

export function readDemoState(): DemoUiState {
  if (typeof window === 'undefined') return defaultDemoState()
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultDemoState()
    return { ...defaultDemoState(), ...(JSON.parse(raw) as Partial<DemoUiState>) }
  } catch {
    return defaultDemoState()
  }
}

export function writeDemoState(next: DemoUiState): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
}

export function resetDemoState(): DemoUiState {
  const next = defaultDemoState()
  writeDemoState(next)
  return next
}

export function countPendingActions(state: DemoUiState): number {
  let n = 0
  if (state.rk30SpecialistApproved && !state.rk30ClientApproved) n += 1
  if (!state.poaDraftAccepted) n += 1
  if (!state.logisticsConfirmed) n += 1
  if (!state.mh200Electro) n += 1
  return n
}
