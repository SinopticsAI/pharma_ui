import { Alert, AlertDescription } from '@demo/ui/components/alert'
import { Badge } from '@demo/ui/components/badge'
import { Button as UiButton } from '@demo/ui/components/button'
import { CardContent, CardHeader, CardTitle, Card as UiCard } from '@demo/ui/components/card'
import { TableBody, TableHead, TableHeader, TableRow, Table as UiTable } from '@demo/ui/components/table'
import { cn } from '@demo/ui/lib/utils'
import type { ButtonHTMLAttributes, ReactNode } from 'react'

export const navItem =
  'block border-l-[3px] border-transparent px-4 py-2 text-sm text-muted-foreground no-underline transition-colors hover:bg-background hover:text-foreground'
export const navItemActive = 'border-l-primary bg-primary/[0.06] font-semibold text-primary'

export function PlaneToggle({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean
  onChange: (next: boolean) => void
  label: string
  hint: string
}) {
  return (
    <label className="flex max-w-xs cursor-pointer items-start gap-2 text-left text-sm">
      <input type="checkbox" className="mt-1" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <span>
        <span className="font-medium">{label}</span>
        <span className="mt-0.5 block text-xs font-normal text-muted-foreground">{hint}</span>
      </span>
    </label>
  )
}

export function PageHeader({
  title,
  lead,
  actions,
  eyebrow,
}: {
  title: string
  lead?: string
  actions?: ReactNode
  eyebrow?: string
}) {
  return (
    <div className="mb-5 space-y-2">
      {eyebrow ? <p className="text-xs font-semibold tracking-[0.18em] text-primary uppercase">{eyebrow}</p> : null}
      <div className="flex items-start justify-between gap-3">
        <h1 className="font-serif text-[1.75rem] leading-tight font-bold tracking-tight text-balance md:text-4xl">
          {title}
        </h1>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>
      {lead ? <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground text-pretty">{lead}</p> : null}
    </div>
  )
}

export function Card({
  title,
  meta,
  tone = 'default',
  children,
}: {
  title?: string
  meta?: ReactNode
  tone?: 'default' | 'muted' | 'goal'
  children: ReactNode
}) {
  return (
    <UiCard
      className={cn(
        'mb-4',
        tone === 'muted' && 'border-transparent bg-muted/60 shadow-none',
        tone === 'goal' && 'border-success/30 bg-success/[0.06]',
      )}
    >
      {title || meta ? (
        <CardHeader>
          {title ? <CardTitle className="text-base">{title}</CardTitle> : <span />}
          {meta ? <span className="text-sm text-muted-foreground">{meta}</span> : null}
        </CardHeader>
      ) : null}
      <CardContent className="space-y-3">{children}</CardContent>
    </UiCard>
  )
}

export function Callout({
  tone = 'info',
  title,
  children,
}: {
  tone?: 'info' | 'deadline' | 'quiet' | 'ok'
  title?: string
  children: ReactNode
}) {
  return (
    <Alert
      variant={tone === 'deadline' ? 'destructive' : 'default'}
      className={cn(
        'mb-4',
        tone === 'quiet' && 'text-muted-foreground',
        tone === 'ok' && 'border-success/35 bg-success/10 text-success-foreground [&>svg]:text-success',
        tone === 'deadline' && 'border-primary/35 bg-primary/[0.06]',
      )}
    >
      <AlertDescription className="block">
        {title ? <span className="mb-0.5 block font-semibold">{title}</span> : null}
        {children}
      </AlertDescription>
    </Alert>
  )
}

export function fill(template: string, vars: Record<string, string | number>): string {
  return Object.entries(vars).reduce((acc, [key, value]) => acc.replaceAll(`{${key}}`, String(value)), template)
}

export function DemoMark({ children }: { children?: ReactNode }) {
  return (
    <p className="text-xs text-muted-foreground" data-demo="illustrative">
      {children}
    </p>
  )
}

export function NextAction({ label, children, action }: { label: string; children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-4 flex flex-col gap-3 rounded-lg border border-primary/40 bg-primary/[0.05] px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        <span
          className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground"
          aria-hidden="true"
        >
          !
        </span>
        <div className="min-w-0">
          <p className="text-xs font-semibold tracking-[0.14em] text-primary uppercase">{label}</p>
          <p className="text-sm leading-relaxed">{children}</p>
        </div>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  )
}

export function Empty({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
      {children}
    </div>
  )
}

export function StatusBadge({
  tone = 'neutral',
  children,
}: {
  tone?: 'neutral' | 'accent' | 'warm' | 'quiet' | 'ok' | 'risk'
  children: ReactNode
}) {
  const base = 'rounded-full px-2.5 py-0.5 text-xs font-medium'
  if (tone === 'ok') {
    return <Badge className={cn(base, 'border-transparent bg-success/15 text-success-foreground')}>{children}</Badge>
  }
  if (tone === 'risk') {
    return <Badge className={cn(base, 'border-transparent bg-primary/12 text-primary')}>{children}</Badge>
  }
  if (tone === 'warm') {
    return <Badge className={cn(base, 'border-transparent bg-warning/20 text-warning-foreground')}>{children}</Badge>
  }
  if (tone === 'accent') {
    return <Badge className={cn(base, 'border-transparent bg-primary text-primary-foreground')}>{children}</Badge>
  }
  return (
    <Badge variant="outline" className={cn(base, tone === 'quiet' && 'text-muted-foreground')}>
      {children}
    </Badge>
  )
}

/**
 * Кто действует на шаге: ВЫ / МЫ / АГЕНТ / ПОДРЯДЧИК / СИСТЕМА.
 * Цвета берутся из легенды деки МедМост.
 */
export function ActorBadge({
  actor,
  children,
}: {
  actor: 'you' | 'us' | 'agent' | 'contractor' | 'system'
  children: ReactNode
}) {
  const map: Record<string, string> = {
    you: 'bg-actor-you text-actor-you-foreground',
    us: 'bg-actor-us text-actor-us-foreground',
    agent: 'bg-actor-agent text-actor-agent-foreground',
    contractor: 'bg-actor-contractor text-actor-contractor-foreground',
    system: 'bg-secondary text-secondary-foreground',
  }
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide uppercase',
        map[actor],
      )}
    >
      {children}
    </span>
  )
}

/** Розовый блок «Ваша выгода» из правой колонки деки. */
export function Benefit({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="mt-6 rounded-xl bg-benefit px-4 py-4 text-benefit-foreground">
      <p className="mb-1 text-xs font-semibold tracking-[0.16em] uppercase">{label}</p>
      <p className="text-sm leading-relaxed">{children}</p>
    </div>
  )
}

/** Оценка риска документа: низкий / средний / высокий с точкой-индикатором. */
export function RiskTag({ level, children }: { level: 'low' | 'medium' | 'high'; children?: ReactNode }) {
  const map = {
    low: { dot: 'bg-success', text: 'text-success-foreground' },
    medium: { dot: 'bg-warning', text: 'text-warning-foreground' },
    high: { dot: 'bg-primary', text: 'text-primary' },
  }[level]
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-xs font-medium', map.text)}>
      <span className={cn('size-2 rounded-full', map.dot)} aria-hidden="true" />
      {children}
    </span>
  )
}

/** Линейный прогресс профиля/комплектности с подписью в процентах. */
export function ProgressBar({ percent, tone = 'primary' }: { percent: number; tone?: 'primary' | 'success' }) {
  const clamped = Math.max(0, Math.min(100, percent))
  return (
    <div
      className="h-1.5 w-full overflow-hidden rounded-full bg-secondary"
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={cn('h-full rounded-full', tone === 'success' ? 'bg-success' : 'bg-primary')}
        style={{ width: `${clamped}%` }}
      />
    </div>
  )
}

/** Номер шага «ШАГ N / 11» из правой колонки деки. */
export function StepBadge({ step, total }: { step: number | string; total: number | string }) {
  return (
    <p className="flex items-baseline gap-1.5 text-sm font-semibold tracking-[0.16em] text-muted-foreground uppercase">
      <span>Шаг</span>
      <span className="font-serif text-3xl font-bold text-primary">{step}</span>
      <span className="text-muted-foreground">/ {total}</span>
    </p>
  )
}

export function Table({ head, children }: { head: ReactNode[]; children: ReactNode }) {
  return (
    <UiTable>
      <TableHeader>
        <TableRow>
          {head.map((cell, index) => (
            <TableHead key={index}>{cell}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>{children}</TableBody>
    </UiTable>
  )
}

export function KeyValue({ items }: { items: { key: string; value: ReactNode }[] }) {
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
      {items.map((item) => (
        <div key={item.key} className="contents">
          <dt className="text-muted-foreground">{item.key}</dt>
          <dd className="m-0">{item.value}</dd>
        </div>
      ))}
    </dl>
  )
}

export function Metric({ value, label, accent = false }: { value: ReactNode; label: string; accent?: boolean }) {
  return (
    <div className="space-y-1">
      <div className={cn('font-serif text-3xl font-bold tabular-nums', accent ? 'text-primary' : 'text-foreground')}>
        {value}
      </div>
      <div className="text-sm text-muted-foreground">{label}</div>
    </div>
  )
}

export function Button({
  variant = 'primary',
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' }) {
  return <UiButton variant={variant === 'secondary' ? 'outline' : 'default'} className={className} {...props} />
}

export function LocaleSwitch<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T
  options: { value: T; label: string }[]
  onChange: (next: T) => void
}) {
  return (
    <div className="inline-flex rounded-md border">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={cn(
            'px-2.5 py-1 text-xs',
            option.value === value ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-accent',
          )}
          aria-pressed={option.value === value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

export function Estimate({ children }: { children: ReactNode }) {
  return <p className="mt-6 text-xs text-muted-foreground">{children}</p>
}

export function Money({ value }: { value: string }) {
  return <span className="tabular-nums">{value}</span>
}

export function ChatBubble({
  side,
  author,
  time,
  children,
}: {
  side: 'cn' | 'ru' | 'agent'
  author: string
  time: string
  children: ReactNode
}) {
  const mine = side === 'cn'
  return (
    <div className={cn('flex flex-col gap-1', mine ? 'items-end' : 'items-start')}>
      <span className="text-xs text-muted-foreground">
        {author} · {time}
      </span>
      <div
        className={cn(
          'max-w-[80%] rounded-lg px-3 py-2 text-sm',
          mine ? 'bg-primary text-primary-foreground' : 'bg-muted',
        )}
      >
        {children}
      </div>
    </div>
  )
}

export function Timeline({ children }: { children: ReactNode }) {
  return <div className="space-y-4">{children}</div>
}

export function TimelineItem({ date, children }: { date: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[auto_1fr] gap-3">
      <span className="text-xs text-muted-foreground whitespace-nowrap">{date}</span>
      <div className="space-y-1">{children}</div>
    </div>
  )
}

export type StagePosition = 'done' | 'current' | 'future'

export function StagePills({ stages }: { stages: { key: string; label: string; position: StagePosition }[] }) {
  return (
    <ol className="m-0 flex list-none flex-wrap gap-2 p-0">
      {stages.map((stage) => (
        <li
          key={stage.key}
          aria-current={stage.position === 'current' ? 'step' : undefined}
          className={cn(
            'rounded-full border px-2.5 py-1 text-xs',
            stage.position === 'current' && 'border-primary bg-primary text-primary-foreground',
            stage.position === 'done' && 'border-transparent bg-secondary',
            stage.position === 'future' && 'text-muted-foreground',
          )}
        >
          {stage.label}
        </li>
      ))}
    </ol>
  )
}
