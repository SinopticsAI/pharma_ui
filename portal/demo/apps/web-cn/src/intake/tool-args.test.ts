import { describe, expect, it } from 'vitest'
import { coerceToolArgs, draftFieldRows, toolArgsOf } from './tool-args'

/** args show-draft / ask-document из msg-jhgdc31u на prd-ypujohgf. */
const SHOW_DRAFT_FROM_LOG = {
  scope: 'product',
  fields:
    '[{"key": "name", "label": {"ru": "Наименование"}, "value": "Safe-Accu Blood Glucose Meter", "source": "other · 02-ifu-en-safe-accu.pdf"}, {"key": "intendedUse", "label": {"ru": "Назначение"}, "value": "in vitro diagnostic use only", "source": "other · 02-ifu-en-safe-accu.pdf"}, {"key": "manufacturer", "label": {"ru": "Изготовитель"}, "value": "Sinocare", "source": "other · 02-ifu-en-safe-accu.pdf"}]',
  missing: '[]',
  entityId: 'prd-ypujohgf',
  canApprove: 'False',
}

const ASK_DOCUMENT_FROM_LOG = {
  why: '{"ru": "Необходимы для классификации и сбора досье для Росздравнадзора."}',
  itemType: 'tech-spec',
  question: '{"ru": "Пришлите протоколы испытаний (ФТП) и технические спецификации."}',
  acceptsText: 'False',
}

describe('coerceToolArgs', () => {
  it('разбирает fields, missing и False из журнала show-draft', () => {
    const parsed = coerceToolArgs(SHOW_DRAFT_FROM_LOG)
    expect(Array.isArray(parsed.fields)).toBe(true)
    expect(parsed.fields).toHaveLength(3)
    expect(parsed.fields[0]).toMatchObject({
      key: 'name',
      value: 'Safe-Accu Blood Glucose Meter',
    })
    expect(parsed.missing).toEqual([])
    expect(parsed.canApprove).toBe(false)
    expect(parsed.entityId).toBe('prd-ypujohgf')
  })

  it('разбирает question, why и acceptsText из ask-document', () => {
    const parsed = coerceToolArgs(ASK_DOCUMENT_FROM_LOG)
    expect(parsed.question).toEqual({ ru: 'Пришлите протоколы испытаний (ФТП) и технические спецификации.' })
    expect(parsed.why).toEqual({ ru: 'Необходимы для классификации и сбора досье для Росздравнадзора.' })
    expect(parsed.acceptsText).toBe(false)
    expect(parsed.itemType).toBe('tech-spec')
  })

  it('не трогает уже разобранный массив и boolean', () => {
    const fields = [{ key: 'name', label: { ru: 'Название' }, value: 'Acme', source: 'doc' }]
    expect(coerceToolArgs({ fields, canApprove: true })).toEqual({ fields, canApprove: true })
  })

  it('оставляет мусорную строку строкой', () => {
    expect(coerceToolArgs({ fields: 'not-json' })).toEqual({ fields: 'not-json' })
  })
})

describe('toolArgsOf', () => {
  it('не падает на undefined args до первого стрима', () => {
    expect(toolArgsOf(undefined)).toEqual({})
  })
})

describe('draftFieldRows', () => {
  it('пустой список, если fields нет или это не массив', () => {
    expect(draftFieldRows(undefined)).toEqual([])
    expect(draftFieldRows('not-json')).toEqual([])
    expect(draftFieldRows({ legalName: 'Acme' })).toEqual([])
  })

  it('строкой отдаёт value, даже если агент положил объект', () => {
    expect(
      draftFieldRows([
        {
          key: 'legalName',
          label: { zh: '名称' },
          value: { zh: '天津九安医疗电子股份有限公司' },
          source: { ru: '执照' },
        },
      ]),
    ).toEqual([
      {
        key: 'legalName',
        label: { zh: '名称' },
        value: '天津九安医疗电子股份有限公司',
        source: '执照',
      },
    ])
  })
})
