/**
 * Same allowlist as Edge `ITEM_TYPES`. ask-document sometimes sends a draft
 * field name (`expectedUse`) or an l10n object; upload-url rejects those.
 */

export const ITEM_TYPES = new Set([
  'business-license',
  'company-registry',
  'iso-13485',
  'poa-upp',
  'signatory',
  'bank-account',
  'site-docs',
  'gmp-cn',
  'trademark',
  'nmpa-certificate',
  'instruction-cn',
  'instruction-ru',
  'tech-spec',
  'lab-protocol',
  'regulator-letter',
  'other',
])

function unwrapItemType(value: unknown): string {
  if (typeof value === 'string') return value
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const rec = value as Record<string, unknown>
    for (const key of ['value', 'zh', 'en', 'ru'] as const) {
      if (typeof rec[key] === 'string' && rec[key].trim()) return rec[key]
    }
  }
  return ''
}

export function itemTypeOf(value: unknown): string {
  const key = unwrapItemType(value).trim().toLowerCase()
  return ITEM_TYPES.has(key) ? key : 'other'
}
