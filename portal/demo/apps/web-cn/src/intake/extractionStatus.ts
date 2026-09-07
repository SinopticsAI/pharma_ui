import type { ItemStatus } from '@demo/domain'

/**
 * Кабинет, не агент, следит за разбором: один HTTP-ход чата не может ждать OCR.
 * Когда документ uploaded, кабинет зовёт POST /extract. Когда статус становится
 * parsed/rejected, нить сама пишет маркер — агент отвечает карточкой.
 */

export const EXTRACTION_READY_PREFIX = '[extraction-ready]'
export const EXTRACTION_SLOW_MS = 90_000

const IN_FLIGHT: ReadonlySet<ItemStatus> = new Set(['uploaded', 'confirmed'])
const SETTLED: ReadonlySet<ItemStatus> = new Set(['parsed', 'rejected'])

export type ExtractionReadyNotice = {
  itemId: string
  status: 'parsed' | 'rejected'
  organizationId: string
}

export type ExtractionItem = {
  id: string
  fileName: string
  status: ItemStatus
  updatedAt: string
  level: 'company' | 'product'
  productId: string
}

export type ExtractionBanner = {
  kind: 'reading' | 'slow' | 'filling'
  fileName: string
}

export function isInFlightStatus(status: ItemStatus): boolean {
  return IN_FLIGHT.has(status)
}

export function isSettledStatus(status: ItemStatus): boolean {
  return SETTLED.has(status)
}

export function formatExtractionReady(notice: ExtractionReadyNotice): string {
  return `${EXTRACTION_READY_PREFIX} itemId=${notice.itemId} status=${notice.status} organizationId=${notice.organizationId}`
}

export function parseExtractionReady(text: string): ExtractionReadyNotice | null {
  const match = text
    .trim()
    .match(
      /^\[extraction-ready\]\s+itemId=(\S+)\s+status=(parsed|rejected)\s+organizationId=(\S+)$/,
    )
  if (!match) return null
  return {
    itemId: match[1],
    status: match[2] as 'parsed' | 'rejected',
    organizationId: match[3],
  }
}

export function isExtractionReadyText(text: string): boolean {
  return text.trimStart().startsWith(EXTRACTION_READY_PREFIX)
}

/** Пузырь пользователя не показываем: маркер — служебный ход кабинета. */
export function userMessagePresentation(text: string): 'extraction-ready' | 'user' {
  return isExtractionReadyText(text) ? 'extraction-ready' : 'user'
}

export function extractionReadyIdsFromTexts(texts: string[]): Set<string> {
  const ids = new Set<string>()
  for (const text of texts) {
    const notice = parseExtractionReady(text)
    if (notice) ids.add(notice.itemId)
  }
  return ids
}

export function scopeExtractionItems(
  items: ExtractionItem[],
  productId?: string,
): ExtractionItem[] {
  if (productId) return items.filter((item) => item.productId === productId)
  return items.filter((item) => item.level === 'company')
}

export function inFlightItems(items: ExtractionItem[]): ExtractionItem[] {
  return items.filter((item) => isInFlightStatus(item.status))
}

/** Ещё не разобранные файлы, по которым кабинет ещё не звал POST /extract. */
export function itemsNeedingExtract(
  items: ExtractionItem[],
  alreadyStarted: ReadonlySet<string>,
): ExtractionItem[] {
  return inFlightItems(items).filter((item) => !alreadyStarted.has(item.id))
}

export function pendingItemIds(items: ExtractionItem[]): Set<string> {
  return new Set(inFlightItems(items).map((item) => item.id))
}

/**
 * Автоход только на переход pending → settled в этой сессии.
 * Уже разобранные документы при открытии экрана не стреляют снова.
 */
export function nextAutoTurnItem(
  pendingSeen: ReadonlySet<string>,
  items: ExtractionItem[],
  alreadyFired: ReadonlySet<string>,
): ExtractionItem | null {
  return (
    items.find(
      (item) =>
        isSettledStatus(item.status) && pendingSeen.has(item.id) && !alreadyFired.has(item.id),
    ) ?? null
  )
}

/** Пока идёт HTTP-ход, не наслаиваем второй append. */
export function shouldAutoTurn(running: boolean, item: ExtractionItem | null): boolean {
  return Boolean(item) && !running
}

export function nextPendingSeen(
  pendingSeen: ReadonlySet<string>,
  items: ExtractionItem[],
  alreadyFired: ReadonlySet<string> = new Set(),
): Set<string> {
  const next = new Set(pendingSeen)
  for (const item of items) {
    if (isInFlightStatus(item.status)) next.add(item.id)
    else if (isSettledStatus(item.status) && alreadyFired.has(item.id)) next.delete(item.id)
  }
  return next
}

export function extractionBanner(
  items: ExtractionItem[],
  nowMs: number,
  filling: boolean,
  fillingFileName = '',
): ExtractionBanner | null {
  if (filling) {
    return { kind: 'filling', fileName: fillingFileName }
  }
  const flying = inFlightItems(items)
  if (flying.length === 0) return null
  const oldest = flying.reduce((min, item) => {
    const ts = Date.parse(item.updatedAt)
    return Number.isFinite(ts) && ts < min ? ts : min
  }, Number.POSITIVE_INFINITY)
  const started = Number.isFinite(oldest) ? oldest : nowMs
  const fileName = flying[0]?.fileName ?? ''
  if (nowMs - started >= EXTRACTION_SLOW_MS) {
    return { kind: 'slow', fileName }
  }
  return { kind: 'reading', fileName }
}

export function autoturnStorageKey(sessionId: string, itemId: string): string {
  return `intake-autoturn:${sessionId}:${itemId}`
}

export function readAutoturnFired(sessionId: string, itemId: string): boolean {
  try {
    return sessionStorage.getItem(autoturnStorageKey(sessionId, itemId)) === '1'
  } catch {
    return false
  }
}

export function writeAutoturnFired(sessionId: string, itemId: string): void {
  try {
    sessionStorage.setItem(autoturnStorageKey(sessionId, itemId), '1')
  } catch {
    // private mode / quota: in-memory alreadyFired still holds this tab
  }
}

export function textsFromUnknownMessages(messages: unknown): string[] {
  if (!Array.isArray(messages)) return []
  return messages.map((message) => {
    if (!message || typeof message !== 'object') return ''
    const rec = message as { parts?: unknown; content?: unknown }
    const parts = Array.isArray(rec.parts) ? rec.parts : Array.isArray(rec.content) ? rec.content : []
    return parts
      .map((part) => {
        if (!part || typeof part !== 'object') return ''
        const item = part as { type?: string; text?: string }
        return item.type === 'text' ? (item.text ?? '') : ''
      })
      .join('\n')
  })
}
