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

export type ProductKind = 'device' | 'drug'

export interface RegistrationCase {
  id: string
  code: string
  product: L10n
  manufacturer: L10n
  kind: ProductKind
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
  accountId?: string
  organizationId?: string
  productId?: string
  intakeSessionId?: string
  trackConfirmed?: boolean
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
  complete?: boolean
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

// --------------------------------------------------------------- контур Edge --
//
// Типы ниже повторяют мапперы `pharma-edge/scr/_shared/edge_domain.py`. Аккаунт
// не берётся из токена: Keycloak владеет личностью, продукт — арендаторами, и
// `sub` разрешается в аккаунт на стороне ядра.

export type Role = 'client' | 'specialist' | 'operator' | 'admin'

/** Контур запроса. Определяет маску полей, а не язык интерфейса. */
export type Contour = 'cn' | 'ru'

export interface Account {
  id: string
  name: Partial<L10n>
  status: string
}

export interface Identity {
  accountId: string
  subject: string
  role: Role
  displayName: string
  account: Account
  can: {
    approveAsSpecialist: boolean
    operate: boolean
  }
}

/** Что контур вправе показать. Решение принимает сервер, UI его повторяет. */
export interface FieldMask {
  mandateCredentials: boolean
  ledgerPay: boolean
  statusWrite: boolean
  audit: boolean
  chat: boolean
  roadmap: boolean
}

export type OrganizationStatus = 'collecting' | 'draft' | 'profile_approved'

export type SlotSection = 'identity' | 'documents' | 'authority' | 'banking' | 'risk'

export type SlotStatus = 'pending' | 'in_progress' | 'filled' | 'not_required'

/** Разбивка комплектности по разделам: её показывает панель диалога. */
export interface ProgressSection {
  key: SlotSection
  filled: number
  total: number
}

export interface Completeness {
  filled: number
  total: number
  percent: number
  ready: boolean
  sections: ProgressSection[]
}

export interface OrganizationSlot {
  key: string
  section: SlotSection
  title: Partial<L10n>
  requirement?: Partial<L10n> | null
  needsNotary: boolean
  needsApostille: boolean
  needsTranslation: boolean
  optional: boolean
  status: SlotStatus
  documentId: string
}

export interface Organization {
  id: string
  accountId: string
  kind: string
  name: Partial<L10n>
  status: OrganizationStatus
  draft: DraftFields
  profile: DraftFields
  createdAt: string
  updatedAt: string
  slots?: OrganizationSlot[]
  completeness?: Completeness
}

/**
 * Черновик хранит происхождение, а не голое значение: поле без источника
 * нельзя проверить, поэтому его нельзя показывать как факт.
 */
export interface DraftField {
  value: string
  source?: string
  confidence?: number | null
  /**
   * Ядро ставит false, когда значение противоречит себе: например,
   * регистрационный номер не сходится с контрольным разрядом. Заполнено —
   * ещё не значит верно, и одобрить такой профиль ядро не даёт.
   */
  verified?: boolean
}

export type DraftFields = Record<string, DraftField | string | undefined>

export function draftValue(draft: DraftFields | undefined, key: string): string {
  const entry = draft?.[key]
  if (typeof entry === 'string') return entry
  if (!entry || typeof entry !== 'object') return ''
  const value = (entry as DraftField).value as unknown
  if (typeof value === 'string') return value
  if (value && typeof value === 'object') {
    const rec = value as Record<string, unknown>
    for (const locale of ['zh', 'en', 'ru', 'value'] as const) {
      if (typeof rec[locale] === 'string' && rec[locale]) return rec[locale]
    }
  }
  return ''
}

export type RiskLevel = 'low' | 'medium' | 'high' | 'unknown'

export interface RiskReport {
  id: string
  organizationId: string
  level: RiskLevel
  verdict: 'pending' | 'accepted' | 'rejected'
  reasoning: Partial<L10n>
  checks: { key: string; outcome: string; note?: Partial<L10n> }[]
  checkedBy: string
  checkedAt: string
}

/**
 * Документ компании после подтверждения получает `uploaded`, документ досье —
 * `confirmed`: это две разные функции ядра, и статусы у них разные.
 */
export type ItemStatus = 'pending_upload' | 'uploaded' | 'confirmed' | 'parsed' | 'rejected'

/** Документ интейка: уровня компании или продукта, до появления кейса. */
export interface OrganizationItem {
  id: string
  organizationId: string
  productId: string
  level: 'company' | 'product'
  itemType: string
  title: Partial<L10n>
  fileName: string
  objectKey: string
  status: ItemStatus
  parcedData?: Record<string, unknown> | null
  version: number
  promotedFrom: string
  promotedAt: string
  updatedAt: string
}

/** Документ досье кейса. */
export interface CaseItem {
  id: string
  caseId: string
  itemType: string
  title: Partial<L10n>
  fileName: string
  objectKey: string
  status: ItemStatus
  parcedData?: Record<string, unknown> | null
}

export interface UploadTicket {
  uploadUrl: string
  itemId: string
  objectKey: string
  expiresIn: number
}

/** Ссылка на просмотр загруженного скана: подписана ядром и живёт час. */
export interface DownloadTicket {
  url: string
  fileName: string
  expiresIn: number
}

export type ProductStatus =
  | 'collecting'
  | 'draft'
  | 'data_approved'
  | 'variants_pending'
  | 'variant_selected'
  | 'ru_confirmed'

export interface Product {
  id: string
  accountId: string
  organizationId: string
  name: Partial<L10n>
  kind: ProductKind | ''
  status: ProductStatus
  draft: DraftFields
  completeness: number
  selectedVariantId: string
  specialistApprovedBy: string
  specialistApprovedAt: string
  clientApprovedBy: string
  clientApprovedAt: string
  caseId: string
  updatedAt: string
  documents?: OrganizationItem[]
  missing?: string[]
  variants?: ClassificationVariant[]
}

/**
 * Вариант классификации. `forbidden` существует, чтобы его объяснить, а не
 * выбрать: платформа отказывается подавать класс, который знает неверным.
 */
export interface ClassificationVariant {
  id: string
  productId: string
  variantType: 'recommended' | 'alternative' | 'forbidden'
  kind: ProductKind
  track: Track
  riskClass: RiskClass
  title: Partial<L10n>
  summary: Partial<L10n>
  pros: Partial<L10n>[]
  cons: Partial<L10n>[]
  reason?: Partial<L10n> | null
  budget: { currency?: string; baskets?: { key: string; amount: number }[] }
  distribution: Record<string, unknown>
  cycleMonths: [number, number]
  selected: boolean
}

export type NodeStatus = 'done' | 'in_progress' | 'planned' | 'later' | 'goal'

export type NodeOwner = 'you' | 'us' | 'contractor' | 'gov'

/**
 * Узел карты M0–M12. Узлы после подачи приходят со статусом `later`, а не
 * скрываются: горизонт в 12–16 месяцев виден с первого дня и есть смысл карты.
 */
export interface NodeMapItem {
  code: string
  position: number
  title: Partial<L10n>
  note?: Partial<L10n> | null
  status: NodeStatus
  owner: NodeOwner
  dueHint?: Partial<L10n> | null
  blockedBy: string[]
  critical: boolean
}

export interface CaseDetail {
  case: RegistrationCase
  fieldMask: FieldMask
  nodeMap: NodeMapItem[]
  criticalNode: NodeMapItem | null
  mandate?: Mandate | MandateWithCredentials
}

export type IntakeScope = 'organization' | 'product'

export interface IntakeSession {
  id: string
  accountId: string
  scope: IntakeScope
  organizationId: string
  productId: string
  status: string
  locale: Locale
  planeCaseId: string
}

export interface IntakeMessage {
  id: string
  sessionId: string
  role: 'user' | 'agent' | 'system'
  text: Partial<L10n>
  itemId: string
  payload?: Record<string, unknown> | null
  at: string
}

/** Реестр — источник истины по номерам, а этот ответ лишь кэш: `truth` всегда false. */
export interface RegistrySearch {
  hits: { number?: string; holder?: string; title?: string; url?: string }[]
  source: 'elk' | 'grls'
  query: string
  cached: boolean
  truth: boolean
}

export function hasCredentials(mandate: Mandate | MandateWithCredentials | undefined): mandate is MandateWithCredentials {
  return Boolean(mandate && Array.isArray((mandate as MandateWithCredentials).credentials))
}

/**
 * Строка из ядра может прийти пустой или без русского варианта, а `resolveText`
 * опирается на `ru`. Здесь этот разрыв закрывается один раз, а не в каждом экране.
 */
export function l10n(value: Partial<L10n> | undefined, fallback = ''): Translatable {
  return { ...value, ru: value?.ru || value?.en || value?.zh || fallback }
}

export {
  PLANE_TOGGLE_STORAGE_KEY,
  readPlaneEnabled,
  subscribePlaneEnabled,
  writePlaneEnabled,
} from './planeToggle'
