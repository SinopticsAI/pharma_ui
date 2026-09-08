import type { ProgressSection } from '@demo/domain'
import { type MessageKey, useI18n } from '@demo/i18n'
import { StatusBadge } from '../kit'
import { sectionProgressKind, sortCompanySections } from './progress'

const SECTION_KEY: Record<ProgressSection['key'], MessageKey> = {
  identity: 'intake.section.identity',
  documents: 'intake.section.documents',
  authority: 'intake.section.authority',
  banking: 'intake.section.banking',
  risk: 'intake.section.risk',
}

const SECTION_TONE = {
  done: 'accent',
  partial: 'warm',
  left: 'quiet',
  auto: 'neutral',
} as const

function sectionStatusLabel(section: ProgressSection, t: (key: MessageKey) => string): string {
  const kind = sectionProgressKind(section)
  if (kind === 'done') return t('intake.chat.progressDone')
  if (kind === 'left') return t('intake.chat.progressLeft')
  if (kind === 'auto') return t('intake.chat.progressAuto')
  return `${section.filled} ${t('intake.chat.progressOf')} ${section.total}`
}

export function ProgressPanel({
  sections,
  missing,
  percent,
  title,
}: {
  sections: ProgressSection[]
  missing: string[]
  percent: number
  title: string
}) {
  const { t } = useI18n()
  const company = sections.length > 0
  const ordered = company ? sortCompanySections(sections) : sections
  const clamped = Math.min(100, Math.max(0, percent))

  return (
    <aside className="space-y-3 rounded-lg border bg-card p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-0.5">
          <div className="text-sm font-medium">{title}</div>
          {company ? <p className="text-xs text-muted-foreground">{t('intake.chat.progressMarkedByAgent')}</p> : null}
        </div>
        {company ? (
          <StatusBadge tone="accent">
            {t('intake.chat.progressBadge').replace('{percent}', String(percent))}
          </StatusBadge>
        ) : (
          <strong className="text-sm">{percent}%</strong>
        )}
      </div>
      {company ? (
        <div
          className="h-1.5 overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuenow={clamped}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div className="h-full rounded-full bg-primary" style={{ width: `${clamped}%` }} />
        </div>
      ) : null}
      <ul className="space-y-2 text-sm">
        {ordered.map((section) => {
          const kind = sectionProgressKind(section)
          return (
            <li key={section.key} className="flex items-center justify-between gap-2">
              <span>{t(SECTION_KEY[section.key])}</span>
              <StatusBadge tone={SECTION_TONE[kind]}>{sectionStatusLabel(section, t)}</StatusBadge>
            </li>
          )
        })}
        {company
          ? null
          : missing.map((field) => (
              <li key={field} className="flex items-center justify-between gap-2">
                <span>{field}</span>
                <span className="text-muted-foreground">{t('intake.chat.progressNeeded')}</span>
              </li>
            ))}
      </ul>
      {company ? (
        <div className="space-y-1 border-t pt-3">
          <p className="text-sm font-medium">{t('intake.chat.progressWhyTitle')}</p>
          <p className="text-xs text-muted-foreground">{t('intake.chat.progressWhy')}</p>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">{t('intake.chat.progressHint')}</p>
      )}
    </aside>
  )
}
