import type {
  AuditEvent,
  ChatMessage,
  DossierDocument,
  LedgerLine,
  LedgerStatus,
  Mandate,
  MandateWithCredentials,
  RegistrationCase,
  RoadmapItem,
  StageKey,
  StatusEntry,
} from '@demo/domain'
import { STAGE_ORDER } from '@demo/domain'
import { getState, mutate } from './store'

/** Искусственная задержка, чтобы состояния загрузки выглядели как настоящие. */
function delay(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 180 + Math.random() * 160))
}

function nowIso(): string {
  return new Date().toISOString().slice(0, 19)
}

function randomId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`
}

export async function listCases(): Promise<RegistrationCase[]> {
  await delay()
  return getState().cases
}

export async function getCase(caseId: string): Promise<RegistrationCase> {
  await delay()
  const found = getState().cases.find((item) => item.id === caseId)
  if (!found) throw new Error(`Кейс ${caseId} не найден`)
  return found
}

export async function listRoadmap(caseId: string): Promise<RoadmapItem[]> {
  await delay()
  return getState().roadmap.filter((item) => item.caseId === caseId)
}

export async function listDocuments(caseId: string): Promise<DossierDocument[]> {
  await delay()
  return getState().documents.filter((item) => item.caseId === caseId)
}

export async function listLedger(caseId: string): Promise<LedgerLine[]> {
  await delay()
  return getState().ledger.filter((item) => item.caseId === caseId)
}

function findMandate(caseId: string): Mandate {
  const mandate = getState().mandates.find((item) => item.caseId === caseId)
  if (!mandate) throw new Error(`Мандат по кейсу ${caseId} не найден`)
  return mandate
}

/** Кабинет производителя получает только шаги мандата. */
export async function getMandateSteps(caseId: string): Promise<Mandate> {
  await delay()
  return findMandate(caseId)
}

/**
 * Полный мандат с криптосущностями доступен только консоли оператора РФ.
 * Реквизиты лежат в отдельном модуле, поэтому сборка кабинета КНР их не содержит.
 */
export async function getMandateFull(caseId: string): Promise<MandateWithCredentials> {
  await delay()
  const { OPERATOR_CREDENTIALS } = await import('./credentials')
  return { ...findMandate(caseId), credentials: OPERATOR_CREDENTIALS }
}

export async function listStatuses(caseId: string): Promise<StatusEntry[]> {
  await delay()
  return getState()
    .statuses.filter((item) => item.caseId === caseId)
    .sort((a, b) => b.enteredAt.localeCompare(a.enteredAt))
}

export async function listChat(caseId: string): Promise<ChatMessage[]> {
  await delay()
  return getState()
    .chat.filter((item) => item.caseId === caseId)
    .sort((a, b) => a.at.localeCompare(b.at))
}

export async function listAudit(caseId: string): Promise<AuditEvent[]> {
  await delay()
  return getState()
    .audit.filter((item) => item.caseId === caseId)
    .sort((a, b) => b.at.localeCompare(a.at))
}

export interface AddStatusInput {
  caseId: string
  stage: StageKey
  text: string
  artifact: string
  enteredBy: string
}

/**
 * Статус вносит человек и прикладывает артефакт. Коннекторы к госкабинетам
 * появятся позже и подменят источник данных, а не экран.
 */
export async function addStatus(input: AddStatusInput): Promise<void> {
  await delay()
  mutate((draft) => {
    const at = nowIso()
    draft.statuses.push({
      id: randomId('st'),
      caseId: input.caseId,
      stage: input.stage,
      text: { ru: input.text },
      artifact: input.artifact,
      enteredBy: input.enteredBy,
      enteredAt: at,
    })

    const target = draft.cases.find((item) => item.id === input.caseId)
    if (target && STAGE_ORDER.indexOf(input.stage) > STAGE_ORDER.indexOf(target.currentStage)) {
      target.currentStage = input.stage
      target.nextActor = input.stage === 'expertise' ? 'gov' : 'ru'
      target.waitingFor = { ru: input.text, en: input.text, zh: input.text }
    }

    draft.audit.push({
      id: randomId('au'),
      caseId: input.caseId,
      at,
      actor: input.enteredBy,
      action: { ru: `Внесён статус с артефактом: ${input.artifact}` },
    })
  })
}

const LEDGER_ACTION_LABEL: Record<LedgerStatus, string> = {
  received: 'Счёт получен',
  accepted: 'Счёт акцептован',
  funded: 'Фондирование получено',
  paid: 'Оплачено по оригиналу счёта',
  closed: 'Закрыто актом',
}

export async function setLedgerStatus(lineId: string, status: LedgerStatus, actor: string): Promise<void> {
  await delay()
  mutate((draft) => {
    const line = draft.ledger.find((item) => item.id === lineId)
    if (!line) return
    line.status = status
    draft.audit.push({
      id: randomId('au'),
      caseId: line.caseId,
      at: nowIso(),
      actor,
      action: { ru: `${LEDGER_ACTION_LABEL[status]}: ${line.supplier.ru}, ${line.original.ru}` },
    })
  })
}
