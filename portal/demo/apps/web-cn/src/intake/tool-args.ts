/**
 * Qwen отдаёт вложенные аргументы тулов строками: массив как `"[{...}]"`,
 * объект как `"{...}"`, boolean как `"False"`. Кабинет рисует сырой стрим,
 * и `(args.fields ?? []).map` падает. Разбираем JSON и "true"/"false" до
 * рендера и до записи в журнал.
 */

export function coerceToolArgs<T = unknown>(value: T): T {
  return walk(value) as T
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
  if (
    (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
    (trimmed.startsWith('[') && trimmed.endsWith(']'))
  ) {
    try {
      return walk(JSON.parse(trimmed))
    } catch {
      return value
    }
  }
  return value
}
