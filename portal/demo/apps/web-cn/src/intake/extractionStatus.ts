import type { ItemStatus } from '@demo/domain'

/**
 * Кабинет, не агент, следит за разбором: один HTTP-ход чата не может ждать OCR.
 * Когда документ uploaded, кабинет зовёт POST /extract. Когда статус становится
 * parsed/rejected, нить сама пишет маркер — агент отвечает карточкой.
 */

export const EXTRACTION_READY_PREFIX = '[extraction-ready]'
export const EXTRACTION_SLOW_MS = 90_000
/** Тишина при uploaded + пустой draft: это не «ещё в ядре», а завис. */
export const EXTRACTION_HANG_MS = 180_000
/** Дальше не поллим и шлём rejected-маркер, даже если item всё ещё uploaded. */
export const EXTRACTION_GIVE_UP_MS = 480_000

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

export type ProcessKind = 'accepted' | 'reading' | 'gateway' | 'hung' | 'empty-card' | 'filling'

export type ProcessLine = {
  kind: ProcessKind
  fileName: string
  elapsedSec?: number
}

/** @deprecated use ProcessLine — leftover name for the old grey banner */
export type ExtractionBanner = ProcessLine

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
    .match(/^\[extraction-ready\]\s+itemId=(\S+)\s+status=(parsed|rejected)\s+organizationId=(\S+)$/)
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

export function scopeExtractionItems(items: ExtractionItem[], productId?: string): ExtractionItem[] {
  if (productId) return items.filter((item) => item.productId === productId)
  return items.filter((item) => item.level === 'company')
}

export function inFlightItems(items: ExtractionItem[]): ExtractionItem[] {
  return items.filter((item) => isInFlightStatus(item.status))
}

/** Ещё не разобранные файлы, по которым кабинет ещё не звал POST /extract. */
export function itemsNeedingExtract(items: ExtractionItem[], alreadyStarted: ReadonlySet<string>): ExtractionItem[] {
  return inFlightItems(items).filter((item) => !alreadyStarted.has(item.id))
}

/** При включённом Plane кабинет не зовёт Mastra /extract — разбор идёт из Edge. */
export function shouldKickMastraExtract(usePlane: boolean): boolean {
  return !usePlane
}

export function pendingItemIds(items: ExtractionItem[]): Set<string> {
  return new Set(inFlightItems(items).map((item) => item.id))
}

export function itemAgeMs(item: { updatedAt: string }, nowMs: number): number {
  const ts = Date.parse(item.updatedAt)
  return Number.isFinite(ts) ? nowMs - ts : 0
}

/** Poll только uploaded/confirmed и только до потолка. Сироты pending_upload не крутят экран. */
export function isExtractionPending(
  items: { status: ItemStatus; updatedAt?: string }[] | undefined,
  nowMs = Date.now(),
): boolean {
  if (!Array.isArray(items)) return false
  return items.some((item) => {
    if (!isInFlightStatus(item.status)) return false
    if (!item.updatedAt) return true
    return itemAgeMs(item, nowMs) < EXTRACTION_GIVE_UP_MS
  })
}

export function isDraftEmpty(draft: Record<string, unknown> | undefined): boolean {
  if (!draft) return true
  return !Object.values(draft).some((entry) => {
    if (!entry) return false
    if (typeof entry === 'string') return entry.trim().length > 0
    if (typeof entry === 'object' && 'value' in entry) {
      return String((entry as { value?: unknown }).value ?? '').trim().length > 0
    }
    return true
  })
}

/**
 * Автоход: переход in-flight → settled, или уже parsed/rejected без маркера в журнале.
 */
export function nextAutoTurnItem(
  pendingSeen: ReadonlySet<string>,
  items: ExtractionItem[],
  alreadyFired: ReadonlySet<string>,
): ExtractionItem | null {
  const fromTransition = items.find(
    (item) => isSettledStatus(item.status) && pendingSeen.has(item.id) && !alreadyFired.has(item.id),
  )
  if (fromTransition) return fromTransition
  return items.find((item) => isSettledStatus(item.status) && !alreadyFired.has(item.id)) ?? null
}

export function nextGiveUpItem(
  items: ExtractionItem[],
  nowMs: number,
  alreadyFired: ReadonlySet<string>,
): ExtractionItem | null {
  return (
    items.find(
      (item) =>
        isInFlightStatus(item.status) &&
        itemAgeMs(item, nowMs) >= EXTRACTION_GIVE_UP_MS &&
        !alreadyFired.has(item.id),
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

export function processLine(input: {
  items: ExtractionItem[]
  nowMs: number
  filling: boolean
  fillingFileName?: string
  liveExtractIds: ReadonlySet<string>
  extractFailed: { itemId: string; fileName: string } | null
  draftEmpty: boolean
}): ProcessLine | null {
  if (input.filling) {
    return { kind: 'filling', fileName: input.fillingFileName ?? '' }
  }
  const flying = inFlightItems(input.items)
  const live = flying.find((item) => input.liveExtractIds.has(item.id))
  if (live) {
    return {
      kind: 'reading',
      fileName: live.fileName,
      elapsedSec: Math.max(0, Math.round(itemAgeMs(live, input.nowMs) / 1000)),
    }
  }
  if (input.extractFailed) {
    return { kind: 'gateway', fileName: input.extractFailed.fileName }
  }
  const oldest = flying[0]
  if (oldest) {
    const age = itemAgeMs(oldest, input.nowMs)
    if (age >= EXTRACTION_HANG_MS && input.draftEmpty) {
      return { kind: 'hung', fileName: oldest.fileName, elapsedSec: Math.round(age / 1000) }
    }
    if (input.draftEmpty) {
      return { kind: 'empty-card', fileName: oldest.fileName }
    }
    if (age < EXTRACTION_SLOW_MS) {
      return { kind: 'accepted', fileName: oldest.fileName }
    }
    return { kind: 'hung', fileName: oldest.fileName, elapsedSec: Math.round(age / 1000) }
  }
  const documented = input.items[0]
  if (documented && input.draftEmpty) {
    return { kind: 'empty-card', fileName: documented.fileName }
  }
  return null
}

export function extractionBanner(
  items: ExtractionItem[],
  nowMs: number,
  filling: boolean,
  fillingFileName = '',
): ExtractionBanner | null {
  return processLine({
    items,
    nowMs,
    filling,
    fillingFileName,
    liveExtractIds: new Set(),
    extractFailed: null,
    draftEmpty: false,
  })
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
