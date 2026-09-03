export type Locale = 'zh' | 'en' | 'ru'

/** Полностью локализованная строка сида. */
export type L10n = Record<Locale, string>

/** Текст, введённый человеком: русский обязателен, переводы появляются позже. */
export type Translatable = { ru: string } & Partial<L10n>

export type Actor = 'hq' | 'ru' | 'lab' | 'gov'

export type StageKey =
  | 'onboarding'
  | 'qualification'
  | 'case'
  | 'roadmap'
  | 'dossier'
  | 'samples'
  | 'filing'
  | 'expertise'
  | 'registry'
  | 'postreg'

export const STAGE_ORDER: readonly StageKey[] = [
  'onboarding',
  'qualification',
  'case',
  'roadmap',
  'dossier',
  'samples',
  'filing',
  'expertise',
  'registry',
  'postreg',
]

export type StagePosition = 'done' | 'current' | 'future'

export function stagePosition(stage: StageKey, current: StageKey): StagePosition {
  const a = STAGE_ORDER.indexOf(stage)
  const b = STAGE_ORDER.indexOf(current)
  if (a < b) return 'done'
  if (a === b) return 'current'
  return 'future'
}

export function nextStage(current: StageKey): StageKey | null {
  const index = STAGE_ORDER.indexOf(current)
  return index >= 0 && index < STAGE_ORDER.length - 1 ? STAGE_ORDER[index + 1] : null
}

/** Правовой трек кейса. Классификация не подменяется: трек фиксируется квалификацией. */
export type Track = 'pp1684' | 'eaeu46' | 'eaeu78'

export type RiskClass = '1' | '2a' | '2b' | '3'

export interface RegistrationCase {
  id: string
  code: string
  product: L10n
  manufacturer: L10n
  kind: 'device' | 'drug'
  track: Track
  riskClass: RiskClass
  currentStage: StageKey
  nextActor: Actor
  waitingFor: L10n
  dueWorkingDays: number
  startedOn: string
  cycleMonths: [number, number]
  mandateComplete: boolean
  modelsLocked: boolean
}

/**
 * Пункт дорожной карты. Нормативный отрезок регулятора и срок проекта — разные
 * сущности, а не разный цвет одной шкалы.
 */
export interface RoadmapItem {
  id: string
  caseId: string
  stage: StageKey
  title: L10n
  kind: 'normative' | 'project'
  workingDays?: number
  months?: [number, number]
  owner: Actor
  note?: L10n
}

export interface DocumentVersion {
  version: number
  author: string
  date: string
  fileName: string
  /** Версия, ушедшая в подачу: неизменяема навсегда. */
  submitted: boolean
}

export interface DossierDocument {
  id: string
  caseId: string
  title: L10n
  preparedBy: Actor
  needsTranslation: boolean
  needsApostille: boolean
  versions: DocumentVersion[]
  awaitingFrom?: L10n
}

export type LedgerLineType = 'pass-through' | 'commission'

export type LedgerStatus = 'received' | 'accepted' | 'funded' | 'paid' | 'closed'

export const LEDGER_FLOW: readonly LedgerStatus[] = ['received', 'accepted', 'funded', 'paid', 'closed']

export interface LedgerLine {
  id: string
  caseId: string
  date: string
  supplier: L10n
  purpose: L10n
  amount: number
  currency: 'RUB' | 'CNY'
  type: LedgerLineType
  status: LedgerStatus
  /** Ссылка на оригинал документа третьей стороны. */
  original: L10n
  /** Нормативный дедлайн платежа, если он есть. */
  paymentDeadline?: L10n
}

export type MandateStepKey =
  | 'service-contract'
  | 'power-of-attorney'
  | 'apostille'
  | 'notarized-translation'
  | 'representative-registered'

export interface MandateStep {
  key: MandateStepKey
  status: 'done' | 'in-progress' | 'pending'
  date?: string
  note?: L10n
}

/** ЕСИА, УКЭП и МЧД — атрибуты мандата на стороне РФ, а не логин пользователя. */
export interface MandateCredential {
  kind: 'esia' | 'ukep' | 'mchd'
  holder: string
  validUntil: string
  note: string
}

export interface Mandate {
  caseId: string
  operator: string
  role: 'upp' | 'mah-representative'
  steps: MandateStep[]
}

/**
 * Мандат с криптоконтуром существует только на стороне оператора РФ.
 * Отдельный тип нужен, чтобы реквизиты не попадали в сборку кабинета КНР.
 */
export interface MandateWithCredentials extends Mandate {
  credentials: MandateCredential[]
}

export interface StatusEntry {
  id: string
  caseId: string
  stage: StageKey
  text: Translatable
  artifact: string
  enteredBy: string
  enteredAt: string
}

export interface ChatMessage {
  id: string
  caseId: string
  side: 'cn' | 'ru'
  author: string
  text: Translatable
  at: string
}

export interface AuditEvent {
  id: string
  caseId: string
  at: string
  actor: string
  action: Translatable
}

export interface DemoState {
  cases: RegistrationCase[]
  roadmap: RoadmapItem[]
  documents: DossierDocument[]
  ledger: LedgerLine[]
  mandates: Mandate[]
  statuses: StatusEntry[]
  chat: ChatMessage[]
  audit: AuditEvent[]
}

export function resolveText(text: Translatable | L10n, locale: Locale): { value: string; translated: boolean } {
  const candidate = (text as Partial<L10n>)[locale]
  if (candidate) return { value: candidate, translated: true }
  return { value: text.ru, translated: locale === 'ru' }
}

export function ledgerTotals(lines: LedgerLine[]): { passThrough: number; commission: number } {
  return lines.reduce(
    (acc, line) => {
      if (line.type === 'commission') acc.commission += line.amount
      else acc.passThrough += line.amount
      return acc
    },
    { passThrough: 0, commission: 0 },
  )
}
