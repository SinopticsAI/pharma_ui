const DATE = new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })
const DATE_TIME = new Intl.DateTimeFormat('ru-RU', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

export function formatDate(iso: string): string {
  if (!iso || iso === '—') return '—'
  return DATE.format(new Date(iso.length === 10 ? `${iso}T00:00:00` : iso))
}

export function formatDateTime(iso: string): string {
  return DATE_TIME.format(new Date(iso))
}

export function daysUntil(iso: string): number {
  const target = new Date(`${iso.slice(0, 10)}T00:00:00`)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.round((target.getTime() - today.getTime()) / 86400000)
}

export function dueLabel(iso: string): string {
  const days = daysUntil(iso)
  if (days < 0) return `просрочено на ${Math.abs(days)} дн.`
  if (days === 0) return 'сегодня'
  if (days === 1) return 'завтра'
  return `через ${days} дн.`
}
