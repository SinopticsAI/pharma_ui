import { describe, expect, it } from 'vitest'
import { itemTypeOf } from './itemType'

describe('itemTypeOf', () => {
  it('keeps a known Edge type', () => {
    expect(itemTypeOf('nmpa-certificate')).toBe('nmpa-certificate')
    expect(itemTypeOf('NMPA-Certificate')).toBe('nmpa-certificate')
  })

  it('folds a draft field name to other', () => {
    expect(itemTypeOf('expectedUse')).toBe('other')
    expect(itemTypeOf('intendedUse')).toBe('other')
    expect(itemTypeOf('intended-use')).toBe('other')
  })

  it('unwraps an l10n object', () => {
    expect(itemTypeOf({ zh: 'instruction-cn' })).toBe('instruction-cn')
    expect(itemTypeOf({ zh: '预期用途' })).toBe('other')
  })

  it('treats empty as other', () => {
    expect(itemTypeOf(undefined)).toBe('other')
    expect(itemTypeOf('')).toBe('other')
  })
})
