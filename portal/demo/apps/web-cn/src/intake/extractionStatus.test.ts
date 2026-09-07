import type { ItemStatus } from '@demo/domain'
import { describe, expect, it } from 'vitest'
import {
  EXTRACTION_SLOW_MS,
  extractionBanner,
  extractionReadyIdsFromTexts,
  formatExtractionReady,
  isExtractionReadyText,
  itemsNeedingExtract,
  nextAutoTurnItem,
  nextPendingSeen,
  parseExtractionReady,
  pendingItemIds,
  scopeExtractionItems,
  shouldAutoTurn,
  textsFromUnknownMessages,
  userMessagePresentation,
} from './extractionStatus'

function item(partial: {
  id: string
  status: ItemStatus
  fileName?: string
  updatedAt?: string
  level?: 'company' | 'product'
  productId?: string
}) {
  return {
    fileName: 'licence.jpg',
    updatedAt: '2026-09-07T03:36:00Z',
    level: 'company' as const,
    productId: '',
    ...partial,
  }
}

describe('extraction-ready marker', () => {
  it('собирает и разбирает служебный ход', () => {
    const text = formatExtractionReady({
      itemId: 'it-qdiv55v9',
      status: 'parsed',
      organizationId: 'org-z5eynpwj',
    })
    expect(text).toBe(
      '[extraction-ready] itemId=it-qdiv55v9 status=parsed organizationId=org-z5eynpwj',
    )
    expect(parseExtractionReady(text)).toEqual({
      itemId: 'it-qdiv55v9',
      status: 'parsed',
      organizationId: 'org-z5eynpwj',
    })
    expect(userMessagePresentation(text)).toBe('extraction-ready')
    expect(userMessagePresentation('Проверьте карточку')).toBe('user')
    expect(isExtractionReadyText('  [extraction-ready] leftover')).toBe(true)
  })

  it('не принимает обычное сообщение за маркер', () => {
    expect(parseExtractionReady('готово?')).toBeNull()
    expect(parseExtractionReady('[extraction-ready] itemId=it-1')).toBeNull()
    expect(extractionReadyIdsFromTexts(['привет', formatExtractionReady({
      itemId: 'it-1',
      status: 'rejected',
      organizationId: 'org-1',
    })])).toEqual(new Set(['it-1']))
  })
})

describe('auto-turn once per item', () => {
  it('стреляет только на переход pending → settled и один раз', () => {
    const uploaded = item({ id: 'it-1', status: 'uploaded' })
    const parsed = item({ id: 'it-1', status: 'parsed' })
    const seen = pendingItemIds([uploaded])
    expect(nextAutoTurnItem(seen, [parsed], new Set())).toEqual(parsed)
    expect(nextAutoTurnItem(seen, [parsed], new Set(['it-1']))).toBeNull()
  })

  it('не стреляет по уже разобранным при открытии экрана', () => {
    const parsed = item({ id: 'it-old', status: 'parsed' })
    expect(nextAutoTurnItem(new Set(), [parsed], new Set())).toBeNull()
  })

  it('не стреляет, пока документ ещё в полёте', () => {
    const uploaded = item({ id: 'it-1', status: 'uploaded' })
    expect(nextAutoTurnItem(pendingItemIds([uploaded]), [uploaded], new Set())).toBeNull()
  })

  it('не стреляет, пока нить running', () => {
    const parsed = item({ id: 'it-1', status: 'parsed' })
    expect(shouldAutoTurn(true, parsed)).toBe(false)
    expect(shouldAutoTurn(false, parsed)).toBe(true)
    expect(shouldAutoTurn(false, null)).toBe(false)
  })

  it('забывает settled в pendingSeen, чтобы повторный аплоад того же id не завис', () => {
    const uploaded = item({ id: 'it-1', status: 'uploaded' })
    const parsed = item({ id: 'it-1', status: 'parsed' })
    const afterUpload = nextPendingSeen(new Set(), [uploaded])
    expect(afterUpload.has('it-1')).toBe(true)
    expect(nextPendingSeen(afterUpload, [parsed], new Set()).has('it-1')).toBe(true)
    expect(nextPendingSeen(afterUpload, [parsed], new Set(['it-1'])).has('it-1')).toBe(false)
  })
})

describe('scope and banner', () => {
  it('на компании берёт только её документы, на продукте — только его', () => {
    const company = item({ id: 'it-c', status: 'uploaded', level: 'company', productId: '' })
    const product = item({
      id: 'it-p',
      status: 'uploaded',
      level: 'product',
      productId: 'pr-1',
    })
    expect(scopeExtractionItems([company, product]).map((row) => row.id)).toEqual(['it-c'])
    expect(scopeExtractionItems([company, product], 'pr-1').map((row) => row.id)).toEqual(['it-p'])
  })

  it('баннер: чтение, затем дольше обычного, затем заполнение карточки', () => {
    const start = Date.parse('2026-09-07T03:36:00Z')
    const flying = [item({ id: 'it-1', status: 'uploaded', fileName: 'licence.jpg', updatedAt: '2026-09-07T03:36:00Z' })]
    expect(extractionBanner(flying, start + 1_000, false)).toEqual({
      kind: 'reading',
      fileName: 'licence.jpg',
    })
    expect(extractionBanner(flying, start + EXTRACTION_SLOW_MS, false)).toEqual({
      kind: 'slow',
      fileName: 'licence.jpg',
    })
    expect(extractionBanner(flying, start, true, 'licence.jpg')).toEqual({
      kind: 'filling',
      fileName: 'licence.jpg',
    })
    expect(extractionBanner([item({ id: 'it-1', status: 'parsed' })], start, false)).toBeNull()
  })

  it('extract только для uploaded/confirmed и только один раз на item', () => {
    const rows = [
      item({ id: 'it-1', status: 'uploaded' }),
      item({ id: 'it-2', status: 'confirmed' }),
      item({ id: 'it-3', status: 'parsed' }),
    ]
    expect(itemsNeedingExtract(rows, new Set()).map((row) => row.id)).toEqual(['it-1', 'it-2'])
    expect(itemsNeedingExtract(rows, new Set(['it-1'])).map((row) => row.id)).toEqual(['it-2'])
  })
})

describe('textsFromUnknownMessages', () => {
  it('читает text parts из нити', () => {
    expect(
      textsFromUnknownMessages([
        { parts: [{ type: 'text', text: '[extraction-ready] itemId=it-1 status=parsed organizationId=org-1' }] },
        { content: [{ type: 'text', text: 'готово?' }] },
      ]),
    ).toEqual([
      '[extraction-ready] itemId=it-1 status=parsed organizationId=org-1',
      'готово?',
    ])
  })
})
