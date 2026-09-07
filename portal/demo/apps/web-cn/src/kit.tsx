import { Alert, AlertDescription } from '@demo/ui/components/alert'
import { Badge } from '@demo/ui/components/badge'
import { Button as UiButton } from '@demo/ui/components/button'
import { CardContent, CardHeader, CardTitle, Card as UiCard } from '@demo/ui/components/card'
import { TableBody, TableHead, TableHeader, TableRow, Table as UiTable } from '@demo/ui/components/table'
import { cn } from '@demo/ui/lib/utils'
import type { ButtonHTMLAttributes, ReactNode } from 'react'

export const navItem =
  'block border-l-[3px] border-transparent px-4 py-2 text-sm text-foreground no-underline hover:bg-background'
export const navItemActive = 'border-l-primary bg-background font-medium'

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

export function PageHeader({ title, lead, actions }: { title: string; lead?: string; actions?: ReactNode }) {
  return (
    <div className="mb-4 space-y-2">
      <div className="flex items-start justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>
      {lead ? <p className="text-sm text-muted-foreground">{lead}</p> : null}
    </div>
  )
}

export function Card({ title, meta, children }: { title?: string; meta?: ReactNode; children: ReactNode }) {
  return (
    <UiCard className="mb-4">
      {title || meta ? (
        <CardHeader>
          {title ? <CardTitle>{title}</CardTitle> : <span />}
          {meta ? <span className="text-sm text-muted-foreground">{meta}</span> : null}
        </CardHeader>
      ) : null}
      <CardContent className="space-y-3">{children}</CardContent>
    </UiCard>
  )
}

export function Callout({ tone = 'info', children }: { tone?: 'info' | 'deadline' | 'quiet'; children: ReactNode }) {
  return (
    <Alert
      variant={tone === 'deadline' ? 'destructive' : 'default'}
      className={cn('mb-4', tone === 'quiet' && 'text-muted-foreground')}
    >
      <AlertDescription>{children}</AlertDescription>
    </Alert>
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
  tone?: 'neutral' | 'accent' | 'warm' | 'quiet'
  children: ReactNode
}) {
  const variant = tone === 'accent' ? 'default' : tone === 'warm' ? 'secondary' : 'outline'
  return <Badge variant={variant}>{children}</Badge>
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

export function Metric({ value, label }: { value: ReactNode; label: string }) {
  return (
    <div className="space-y-1">
      <div className="text-2xl font-semibold">{value}</div>
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
