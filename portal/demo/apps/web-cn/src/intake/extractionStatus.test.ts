import type { ItemStatus } from '@demo/domain'
import { describe, expect, it } from 'vitest'
import {
  EXTRACTION_GIVE_UP_MS,
  EXTRACTION_HANG_MS,
  extractionBanner,
  extractionReadyIdsFromTexts,
  formatExtractionReady,
  formatProfileApproved,
  isDraftEmpty,
  isExtractionPending,
  isExtractionReadyText,
  isSuperseded,
  itemsNeedingExtract,
  newestByUpdatedAt,
  nextAutoTurnItem,
  nextGiveUpItem,
  nextPendingSeen,
  parseExtractionReady,
  pendingItemIds,
  processLine,
  scopeExtractionItems,
  shouldAutoTurn,
  shouldKickMastraExtract,
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
  itemType?: string
}) {
  return {
    fileName: 'licence.jpg',
    updatedAt: '2026-09-07T03:36:00Z',
    level: 'company' as const,
    productId: '',
    itemType: 'business-license',
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
    expect(text).toBe('[extraction-ready] itemId=it-qdiv55v9 status=parsed organizationId=org-z5eynpwj')
    expect(parseExtractionReady(text)).toEqual({
      itemId: 'it-qdiv55v9',
      status: 'parsed',
      organizationId: 'org-z5eynpwj',
    })
    expect(userMessagePresentation(text)).toBe('extraction-ready')
    expect(userMessagePresentation(formatProfileApproved())).toBe('profile-approved')
    expect(userMessagePresentation('Проверьте карточку')).toBe('user')
    expect(isExtractionReadyText('  [extraction-ready] leftover')).toBe(true)
  })

  it('не принимает обычное сообщение за маркер', () => {
    expect(parseExtractionReady('готово?')).toBeNull()
    expect(parseExtractionReady('[extraction-ready] itemId=it-1')).toBeNull()
    expect(
      extractionReadyIdsFromTexts([
        'привет',
        formatExtractionReady({
          itemId: 'it-1',
          status: 'rejected',
          organizationId: 'org-1',
        }),
      ]),
    ).toEqual(new Set(['it-1']))
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

  it('на открытии стреляет по уже parsed, если маркера ещё не было', () => {
    const parsed = item({ id: 'it-old', status: 'parsed' })
    expect(nextAutoTurnItem(new Set(), [parsed], new Set())).toEqual(parsed)
    expect(nextAutoTurnItem(new Set(), [parsed], new Set(['it-old']))).toBeNull()
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

  it('не стреляет по старому rejected, если уже есть более новый файл того же типа', () => {
    const oldDocx = item({
      id: 'it-docx',
      status: 'rejected',
      fileName: 'business licence.docx',
      updatedAt: '2026-09-07T03:00:00Z',
    })
    const newJpg = item({
      id: 'it-jpg',
      status: 'uploaded',
      fileName: 'bussines_licence.jpg',
      updatedAt: '2026-09-07T03:40:00Z',
    })
    expect(isSuperseded(oldDocx, [oldDocx, newJpg])).toBe(true)
    expect(newestByUpdatedAt([oldDocx, newJpg])?.id).toBe('it-jpg')
    expect(nextAutoTurnItem(new Set(['it-docx']), [oldDocx, newJpg], new Set())).toBeNull()
    expect(nextAutoTurnItem(new Set(['it-jpg']), [oldDocx, item({ ...newJpg, status: 'parsed' })], new Set())?.id).toBe(
      'it-jpg',
    )
  })

  it('пачка other на продукте не схлопывается в один слот', () => {
    const pack = [
      item({
        id: 'it-1',
        status: 'uploaded',
        itemType: 'other',
        fileName: '11-nmpa-certificate.jpg',
        level: 'product',
        productId: 'pr-1',
        updatedAt: '2026-09-11T08:00:00Z',
      }),
      item({
        id: 'it-2',
        status: 'uploaded',
        itemType: 'other',
        fileName: '12-ifu-cn.pdf',
        level: 'product',
        productId: 'pr-1',
        updatedAt: '2026-09-11T08:00:01Z',
      }),
      item({
        id: 'it-3',
        status: 'uploaded',
        itemType: 'other',
        fileName: '13-tech-spec.pdf',
        level: 'product',
        productId: 'pr-1',
        updatedAt: '2026-09-11T08:00:02Z',
      }),
      item({
        id: 'it-4',
        status: 'uploaded',
        itemType: 'other',
        fileName: '14-lab-cn.pdf',
        level: 'product',
        productId: 'pr-1',
        updatedAt: '2026-09-11T08:00:03Z',
      }),
    ]
    expect(pack.every((row) => !isSuperseded(row, pack))).toBe(true)
    expect(itemsNeedingExtract(pack, new Set()).map((row) => row.id)).toEqual(['it-1', 'it-2', 'it-3', 'it-4'])

    const seen = new Set(pack.map((row) => row.id))
    const firstParsed = pack.map((row, index) => (index === 0 ? item({ ...row, status: 'parsed' }) : row))
    expect(nextAutoTurnItem(seen, firstParsed, new Set())?.id).toBe('it-1')
    expect(nextAutoTurnItem(seen, firstParsed, new Set(['it-1']))).toBeNull()

    const twoParsed = pack.map((row, index) => (index < 2 ? item({ ...row, status: 'parsed' }) : row))
    expect(nextAutoTurnItem(seen, twoParsed, new Set(['it-1']))?.id).toBe('it-2')
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

  it('строка процесса отличает живой extract от зависания', () => {
    const start = Date.parse('2026-09-07T03:36:00Z')
    const flying = [
      item({ id: 'it-1', status: 'uploaded', fileName: 'licence.jpg', updatedAt: '2026-09-07T03:36:00Z' }),
    ]
    expect(
      processLine({
        items: flying,
        nowMs: start + 12_000,
        filling: false,
        liveExtractIds: new Set(['it-1']),
        extractFailed: null,
        draftEmpty: true,
      }),
    ).toEqual({ kind: 'reading', fileName: 'licence.jpg', elapsedSec: 12 })
    expect(
      processLine({
        items: flying,
        nowMs: start + EXTRACTION_HANG_MS,
        filling: false,
        liveExtractIds: new Set(),
        extractFailed: null,
        draftEmpty: true,
      }),
    ).toEqual({ kind: 'hung', fileName: 'licence.jpg', elapsedSec: EXTRACTION_HANG_MS / 1000 })
    expect(
      processLine({
        items: flying,
        nowMs: start + 1_000,
        filling: false,
        liveExtractIds: new Set(),
        extractFailed: { itemId: 'it-1', fileName: 'licence.jpg' },
        draftEmpty: true,
      }),
    ).toEqual({ kind: 'gateway', fileName: 'licence.jpg' })
    expect(extractionBanner(flying, start, true, 'licence.jpg')).toEqual({
      kind: 'filling',
      fileName: 'licence.jpg',
    })
    expect(extractionBanner([item({ id: 'it-1', status: 'parsed' })], start, false)).toBeNull()
    const oldDocx = item({
      id: 'it-docx',
      status: 'rejected',
      fileName: 'business licence.docx',
      updatedAt: '2026-09-07T03:00:00Z',
    })
    const newJpg = item({
      id: 'it-jpg',
      status: 'uploaded',
      fileName: 'bussines_licence.jpg',
      updatedAt: '2026-09-07T03:40:00Z',
    })
    expect(
      processLine({
        items: [oldDocx, newJpg],
        nowMs: Date.parse('2026-09-07T03:40:12Z'),
        filling: false,
        liveExtractIds: new Set(['it-jpg']),
        extractFailed: { itemId: 'it-docx', fileName: 'business licence.docx' },
        draftEmpty: true,
      }),
    ).toEqual({ kind: 'reading', fileName: 'bussines_licence.jpg', elapsedSec: 12 })
    expect(
      processLine({
        items: [oldDocx, newJpg],
        nowMs: Date.parse('2026-09-07T03:40:12Z'),
        filling: false,
        liveExtractIds: new Set(),
        extractFailed: { itemId: 'it-docx', fileName: 'business licence.docx' },
        draftEmpty: true,
      }),
    ).toEqual({ kind: 'empty-card', fileName: 'bussines_licence.jpg' })
  })

  it('poll только uploaded/confirmed и только до потолка', () => {
    const start = Date.parse('2026-09-07T03:36:00Z')
    const uploaded = item({ id: 'it-1', status: 'uploaded', updatedAt: '2026-09-07T03:36:00Z' })
    expect(isExtractionPending([uploaded], start + 1_000)).toBe(true)
    expect(isExtractionPending([uploaded], start + EXTRACTION_GIVE_UP_MS)).toBe(false)
    expect(isExtractionPending([item({ id: 'it-2', status: 'pending_upload' })], start)).toBe(false)
    expect(isExtractionPending([item({ id: 'it-3', status: 'parsed' })], start)).toBe(false)
    expect(isDraftEmpty({})).toBe(true)
    expect(isDraftEmpty({ registrationNumber: { value: '9133' } })).toBe(false)
    expect(nextGiveUpItem([uploaded], start + EXTRACTION_GIVE_UP_MS, new Set())?.id).toBe('it-1')
  })

  it('extract только для uploaded/confirmed и только один раз на item', () => {
    const rows = [
      item({ id: 'it-1', status: 'uploaded' }),
      item({ id: 'it-2', status: 'confirmed' }),
      item({ id: 'it-3', status: 'parsed' }),
    ]
    expect(itemsNeedingExtract(rows, new Set()).map((row) => row.id)).toEqual(['it-1', 'it-2'])
    expect(itemsNeedingExtract(rows, new Set(['it-1'])).map((row) => row.id)).toEqual(['it-2'])
    expect(
      itemsNeedingExtract(
        [
          item({
            id: 'it-docx',
            status: 'uploaded',
            fileName: 'business licence.docx',
            updatedAt: '2026-09-07T03:00:00Z',
          }),
          item({
            id: 'it-jpg',
            status: 'uploaded',
            fileName: 'bussines_licence.jpg',
            updatedAt: '2026-09-07T03:40:00Z',
          }),
        ],
        new Set(),
      ).map((row) => row.id),
    ).toEqual(['it-jpg'])
  })

  it('при галочке Plane кабинет не стартует Mastra /extract', () => {
    expect(shouldKickMastraExtract(false)).toBe(true)
    expect(shouldKickMastraExtract(true)).toBe(false)
  })
})

describe('textsFromUnknownMessages', () => {
  it('читает text parts из нити', () => {
    expect(
      textsFromUnknownMessages([
        { parts: [{ type: 'text', text: '[extraction-ready] itemId=it-1 status=parsed organizationId=org-1' }] },
        { content: [{ type: 'text', text: 'готово?' }] },
      ]),
    ).toEqual(['[extraction-ready] itemId=it-1 status=parsed organizationId=org-1', 'готово?'])
  })
})
