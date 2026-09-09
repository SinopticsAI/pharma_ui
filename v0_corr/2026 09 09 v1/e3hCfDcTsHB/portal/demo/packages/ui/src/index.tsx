import type { ButtonHTMLAttributes, ReactNode } from 'react'
import styles from './components.module.css'

export { styles as ui }

export function AppShell({
  banner,
  brandTitle,
  brandMeta,
  contour,
  actions,
  nav,
  sidebarNote,
  children,
}: {
  banner?: ReactNode
  brandTitle: string
  brandMeta?: string
  contour: string
  actions?: ReactNode
  nav: ReactNode
  sidebarNote?: ReactNode
  children: ReactNode
}) {
  return (
    <div className={styles.shell}>
      {banner}
      <header className={styles.topbar}>
        <div className={styles.brand}>
          <span className={styles.monogram} aria-hidden="true">
            S
          </span>
          <span className={styles.brandText}>
            <span className={styles.brandTitle}>{brandTitle}</span>
            {brandMeta ? <span className={styles.brandMeta}>{brandMeta}</span> : null}
          </span>
          <span className={styles.contourTag}>{contour}</span>
        </div>
        <div className={styles.row}>{actions}</div>
      </header>
      <nav className={styles.sidebar}>
        {nav}
        {sidebarNote ? <div className={styles.sidebarNote}>{sidebarNote}</div> : null}
      </nav>
      <main className={styles.content}>
        <div className={styles.contentInner}>{children}</div>
      </main>
    </div>
  )
}

export function DemoBanner({ text, resetLabel, onReset }: { text: string; resetLabel: string; onReset: () => void }) {
  return (
    <div className={styles.banner}>
      <span>{text}</span>
      <button type="button" className={styles.bannerReset} onClick={onReset}>
        {resetLabel}
      </button>
    </div>
  )
}

export function PageHeader({ title, lead, actions }: { title: string; lead?: string; actions?: ReactNode }) {
  return (
    <div className={styles.pageHeader}>
      <div className={styles.cardHeader}>
        <h1>{title}</h1>
        {actions ? <div className={styles.row}>{actions}</div> : null}
      </div>
      {lead ? <p className={styles.pageLead}>{lead}</p> : null}
    </div>
  )
}

export function Card({
  title,
  meta,
  soft,
  children,
}: {
  title?: string
  meta?: ReactNode
  soft?: boolean
  children: ReactNode
}) {
  return (
    <section className={soft ? `${styles.card} ${styles.cardSoft}` : styles.card}>
      {title || meta ? (
        <div className={styles.cardHeader}>
          {title ? <h2>{title}</h2> : <span />}
          {meta ? <span className={styles.cardMeta}>{meta}</span> : null}
        </div>
      ) : null}
      {children}
    </section>
  )
}

export type StagePosition = 'done' | 'current' | 'future'

export function StagePills({ stages }: { stages: { key: string; label: string; position: StagePosition }[] }) {
  return (
    <ol className={styles.pills} style={{ listStyle: 'none', margin: 0, padding: 0 }}>
      {stages.map((stage) => {
        const className =
          stage.position === 'current'
            ? `${styles.pill} ${styles.pillCurrent}`
            : stage.position === 'done'
              ? `${styles.pill} ${styles.pillDone}`
              : styles.pill
        return (
          <li key={stage.key} className={className} aria-current={stage.position === 'current' ? 'step' : undefined}>
            {stage.label}
          </li>
        )
      })}
    </ol>
  )
}

/** Статус кодируется формой и подписью. Цветовых светофоров нет намеренно. */
export function StatusBadge({
  tone = 'neutral',
  children,
}: {
  tone?: 'neutral' | 'accent' | 'warm' | 'quiet'
  children: ReactNode
}) {
  const toneClass =
    tone === 'accent'
      ? styles.badgeAccent
      : tone === 'warm'
        ? styles.badgeWarm
        : tone === 'quiet'
          ? styles.badgeQuiet
          : ''
  return <span className={`${styles.badge} ${toneClass}`}>{children}</span>
}

export function Callout({
  tone = 'info',
  children,
}: {
  tone?: 'info' | 'deadline' | 'quiet'
  children: ReactNode
}) {
  const toneClass = tone === 'deadline' ? styles.calloutDeadline : tone === 'quiet' ? styles.calloutQuiet : ''
  return <div className={`${styles.callout} ${toneClass}`}>{children}</div>
}

export function Table({ head, children }: { head: ReactNode[]; children: ReactNode }) {
  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            {head.map((cell, index) => (
              <th key={index} scope="col">
                {cell}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  )
}

export function Money({ value, note }: { value: string; note?: string }) {
  return (
    <span className={styles.money}>
      {value}
      {note ? <span className={styles.unit}>{note}</span> : null}
    </span>
  )
}

export function Estimate({ children }: { children: ReactNode }) {
  return <p className={styles.estimate}>{children}</p>
}

export function Muted({ children }: { children: ReactNode }) {
  return <p className={styles.muted}>{children}</p>
}

export function KeyValue({ items }: { items: { key: string; value: ReactNode }[] }) {
  return (
    <dl className={styles.kv} style={{ margin: 0 }}>
      {items.map((item) => (
        <div key={item.key} style={{ display: 'contents' }}>
          <dt className={styles.kvKey}>{item.key}</dt>
          <dd className={styles.kvValue} style={{ margin: 0 }}>
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  )
}

export function Metric({ value, label }: { value: ReactNode; label: string }) {
  return (
    <div className={styles.metric}>
      <span className={styles.metricValue}>{value}</span>
      <span className={styles.metricLabel}>{label}</span>
    </div>
  )
}

export function Button({
  variant = 'primary',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' }) {
  const className = variant === 'secondary' ? `${styles.button} ${styles.buttonSecondary}` : styles.button
  return <button {...props} className={className} />
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className={styles.field}>
      <span className={styles.fieldLabel}>{label}</span>
      {children}
      {hint ? <span className={styles.fieldHint}>{hint}</span> : null}
    </label>
  )
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className={styles.empty}>{children}</div>
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
    <div className={styles.localeSwitch} role="group">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={
            option.value === value ? `${styles.localeButton} ${styles.localeButtonActive}` : styles.localeButton
          }
          aria-pressed={option.value === value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

export function Timeline({ children }: { children: ReactNode }) {
  return <div className={styles.timeline}>{children}</div>
}

export function TimelineItem({ date, children }: { date: string; children: ReactNode }) {
  return (
    <div className={styles.timelineItem}>
      <span className={styles.timelineDate}>{date}</span>
      <div className={styles.stack}>{children}</div>
    </div>
  )
}

export function ChatBubble({
  side,
  author,
  time,
  children,
}: {
  side: 'cn' | 'ru'
  author: string
  time: string
  children: ReactNode
}) {
  return (
    <div className={`${styles.message} ${side === 'cn' ? styles.messageCn : styles.messageRu}`}>
      <span className={styles.messageMeta}>
        {author} · {time}
      </span>
      <span>{children}</span>
    </div>
  )
}
