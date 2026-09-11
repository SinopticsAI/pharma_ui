/**
 * Qwen отдаёт вложенные аргументы тулов строками: массив как `"[{...}]"`,
 * объект как `"{...}"`, boolean как `"False"`. Кабинет рисует сырой стрим,
 * и `(args.fields ?? []).map` падает. Разбираем JSON и "true"/"false" до
 * рендера и до записи в журнал.
 */

export function coerceToolArgs<T = unknown>(value: T): T {
  return walk(value) as T
}

/** assistant-ui sometimes renders a tool card before `args` exists. */
export function toolArgsOf<T>(value: T | undefined): T {
  return coerceToolArgs((value ?? {}) as T)
}

export function asList<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : []
}

function plainText(value: unknown, fallback = ''): string {
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  if (value && typeof value === 'object') {
    const rec = value as Record<string, unknown>
    for (const key of ['value', 'zh', 'en', 'ru'] as const) {
      if (typeof rec[key] === 'string' && rec[key]) return rec[key]
    }
    try {
      return JSON.stringify(value)
    } catch {
      return fallback
    }
  }
  return fallback
}

/**
 * Qwen кладёт `fields` строкой, объектом или недописанным JSON.
 * `(args.fields ?? []).map` на этом падает и белит весь интейк.
 */
export function draftFieldRows(value: unknown): { key: string; label: unknown; value: string; source: string }[] {
  if (!Array.isArray(value)) return []
  return value.flatMap((item, index) => {
    if (!item || typeof item !== 'object') return []
    const rec = item as Record<string, unknown>
    return [
      {
        key: typeof rec.key === 'string' && rec.key ? rec.key : `field-${index}`,
        label: rec.label,
        value: plainText(rec.value),
        source: plainText(rec.source),
      },
    ]
  })
}

function walk(value: unknown): unknown {
  if (typeof value === 'string') return fromString(value)
  if (Array.isArray(value)) return value.map(walk)
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, inner]) => [key, walk(inner)]))
  }
  return value
}

function fromString(value: string): unknown {
  const trimmed = value.trim()
  const folded = trimmed.toLowerCase()
  if (folded === 'true') return true
  if (folded === 'false') return false
  if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
    try {
      return walk(JSON.parse(trimmed))
    } catch {
      return value
    }
  }
  return value
}
