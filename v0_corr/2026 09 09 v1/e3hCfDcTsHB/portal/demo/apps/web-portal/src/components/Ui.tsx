import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import type { AppStatus } from '../data/types'
import { WORK_STATUS_TONE, type WorkStatus } from '../data/work'
import { useI18n } from '../i18n'
import styles from '../styles/ui.module.css'

export function Button({
  variant = 'primary',
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' }) {
  return <button {...props} className={`${styles.button} ${styles[variant]} ${className ?? ''}`} />
}

export function StatusBadge({ status }: { status: AppStatus }) {
  const { status: label } = useI18n()
  return <span className={`${styles.badge} ${styles[status]}`}>{label(status)}</span>
}

/** Статус работы использует ту же семантику цвета, что и статус кейса. */
export function WorkStatusBadge({ status }: { status: WorkStatus }) {
  const { workStatus } = useI18n()
  return <span className={`${styles.badge} ${styles[WORK_STATUS_TONE[status]]}`}>{workStatus(status)}</span>
}

export function Card({
  title,
  meta,
  children,
  className,
}: {
  title?: string
  meta?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section className={`${styles.card} ${className ?? ''}`}>
      {title || meta ? (
        <div className={styles.cardHeader} style={{ marginBottom: 12 }}>
          {title ? <h2 className={styles.cardTitle} style={{ marginBottom: 0 }}>{title}</h2> : <span />}
          {meta ? <span className={styles.cardMeta}>{meta}</span> : null}
        </div>
      ) : null}
      {children}
    </section>
  )
}

export function KeyValue({ items }: { items: { key: string; value: ReactNode }[] }) {
  return (
    <dl className={styles.meta} style={{ margin: 0 }}>
      {items.map((item) => (
        <div key={item.key}>
          <dt>{item.key}</dt>
          <dd>{item.value}</dd>
        </div>
      ))}
    </dl>
  )
}

export function Kpi({ value, label, hint }: { value: number | string; label: string; hint?: string }) {
  return (
    <article className={styles.kpi}>
      <span className={styles.kpiValue}>{value}</span>
      <span className={styles.kpiLabel}>{label}</span>
      {hint ? <span className={styles.kpiHint}>{hint}</span> : null}
    </article>
  )
}

export function Progress({ current, total, label }: { current: number; total: number; label?: string }) {
  const { t } = useI18n()
  return (
    <div className={styles.progress}>
      <div className={styles.track} role="img" aria-label={t('progress.aria', { current, total })}>
        {Array.from({ length: total }, (_, index) => {
          const step = index + 1
          const className =
            step < current ? `${styles.step} ${styles.stepDone}` : step === current ? `${styles.step} ${styles.stepCurrent}` : styles.step
          return <span key={step} className={className} />
        })}
      </div>
      <span className={styles.progressLabel}>{label ?? t('progress.label', { current, total })}</span>
    </div>
  )
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string
  subtitle?: string
  action?: ReactNode
}) {
  return (
    <header className={styles.pageHead}>
      <div>
        <h1 className={styles.hello}>{title}</h1>
        {subtitle ? <p className={styles.sub}>{subtitle}</p> : null}
      </div>
      {action}
    </header>
  )
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className={styles.empty}>{children}</div>
}

export function Callout({
  tone = 'info',
  children,
}: {
  tone?: 'info' | 'warn' | 'bad' | 'quiet'
  children: ReactNode
}) {
  const toneClass =
    tone === 'warn' ? styles.calloutWarn : tone === 'bad' ? styles.calloutBad : tone === 'quiet' ? styles.calloutQuiet : ''
  return <div className={`${styles.callout} ${toneClass}`}>{children}</div>
}

export function TextLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link to={to} className={`${styles.button} ${styles.ghost}`}>
      {children}
    </Link>
  )
}
