/**
 * Единица работы кабинета. Кейс — это не «заявка со статусом», а порядок работ
 * по одному будущему регистрационному удостоверению: в каждую работу можно
 * войти, увидеть статус, приложить документы и подтвердить исполнение.
 */

export type ProductKind = 'drug' | 'prosthesis' | 'equipment'

export const KIND_LABEL: Record<ProductKind, string> = {
  drug: 'Лекарственный препарат',
  prosthesis: 'Протез, комплектующее, расходник',
  equipment: 'Медицинское оборудование',
}

export const KIND_SHORT: Record<ProductKind, string> = {
  drug: 'Лекарство',
  prosthesis: 'Протез',
  equipment: 'Оборудование',
}

export type WorkStatus =
  | 'not_started'
  | 'waiting_client'
  | 'with_agent'
  | 'in_review'
  | 'remarks'
  | 'done'
  | 'not_required'

export const WORK_STATUS_LABEL: Record<WorkStatus, string> = {
  not_started: 'Не начата',
  waiting_client: 'Ждём вас',
  with_agent: 'У агента',
  in_review: 'На проверке',
  remarks: 'Есть замечания',
  done: 'Закрыта',
  not_required: 'Не требуется',
}

/** Тон бейджа переиспользует семантику статусов заявок. */
export const WORK_STATUS_TONE: Record<WorkStatus, 'approved' | 'action_required' | 'in_review' | 'remarks' | 'draft'> = {
  not_started: 'draft',
  waiting_client: 'action_required',
  with_agent: 'in_review',
  in_review: 'in_review',
  remarks: 'remarks',
  done: 'approved',
  not_required: 'draft',
}

export type WorkOwner = 'hq' | 'ru' | 'lab' | 'broker' | 'gov' | 'translator' | 'notary'

export const OWNER_LABEL: Record<WorkOwner, string> = {
  hq: 'производитель, КНР',
  ru: 'российская компания',
  lab: 'испытательная лаборатория',
  broker: 'таможенный представитель',
  gov: 'регулятор',
  translator: 'бюро переводов и редактор',
  notary: 'нотариус и апостиль',
}

export interface SlotFile {
  name: string
  uploadedBy: string
  at: string
}

/** Слот чеклиста: конкретный документ с требованием легализации. */
export interface DocumentSlot {
  id: string
  title: string
  /** Норма или пункт правил, из-за которого документ нужен. */
  requirement?: string
  preparedBy: WorkOwner
  needsNotary?: boolean
  needsApostille?: boolean
  needsTranslation?: boolean
  optional?: boolean
  files: SlotFile[]
}

export interface WorkField {
  id: string
  label: string
  value: string
  hint?: string
  options?: string[]
}

/** Ссылка на государственный кабинет: портал не подменяет его, а ведёт к нему. */
export interface PortalRef {
  name: string
  url: string
  when?: string
  fee?: string
  /** Чем эта услуга не является: снимает типовую путаницу 610095 и 630782. */
  notThis?: string[]
}

export interface WorkItem {
  id: string
  code: string
  title: string
  summary: string
  status: WorkStatus
  owner: WorkOwner
  blockedBy: string[]
  parallelWith?: string[]
  needsAgentConfirmation: boolean
  agentConfirmedBy?: string
  agentConfirmedAt?: string
  portals?: PortalRef[]
  slots: DocumentSlot[]
  fields: WorkField[]
  note?: string
  remark?: string
}

export interface JournalEntry {
  id: string
  at: string
  actor: string
  action: string
  workCode?: string
}

export type RegistryStatus = 'pending' | 'found' | 'not_found'

export interface RegistryCheck {
  status: RegistryStatus
  sources: string[]
  number?: string
  holder?: string
  models?: string
  checkedAt?: string
  checkedBy?: string
}

export const DONE_STATUSES: WorkStatus[] = ['done', 'not_required']

export function isClosed(work: WorkItem): boolean {
  return DONE_STATUSES.includes(work.status)
}

/** Работа открывается, только когда закрыты все её блокеры. */
export function isUnlocked(work: WorkItem, works: WorkItem[]): boolean {
  return work.blockedBy.every((code) => {
    const blocker = works.find((item) => item.code === code)
    return blocker ? isClosed(blocker) : true
  })
}

export function blockingWorks(work: WorkItem, works: WorkItem[]): WorkItem[] {
  return work.blockedBy
    .map((code) => works.find((item) => item.code === code))
    .filter((item): item is WorkItem => Boolean(item) && !isClosed(item as WorkItem))
}

/** Текущая работа — первая открытая и незакрытая по порядку. */
export function currentWork(works: WorkItem[]): WorkItem | undefined {
  return works.find((work) => !isClosed(work) && isUnlocked(work, works))
}

export function workProgress(works: WorkItem[]): { done: number; total: number } {
  const total = works.filter((work) => work.status !== 'not_required').length
  const done = works.filter((work) => work.status === 'done').length
  return { done, total }
}

export function slotsFilled(work: WorkItem): { filled: number; total: number } {
  const required = work.slots.filter((slot) => !slot.optional)
  return {
    filled: required.filter((slot) => slot.files.length > 0).length,
    total: required.length,
  }
}
