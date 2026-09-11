import type { ProgressSection } from '@demo/domain'
import { type MessageKey, useI18n } from '@demo/i18n'
import { Badge } from '@demo/ui/components/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@demo/ui/components/card'
import { Progress } from '@demo/ui/components/progress'
import { Separator } from '@demo/ui/components/separator'
import { productFieldKey } from './product-fields'
import { sectionProgressKind, sortCompanySections } from './progress'

const SECTION_KEY: Record<ProgressSection['key'], MessageKey> = {
  identity: 'intake.section.identity',
  documents: 'intake.section.documents',
  authority: 'intake.section.authority',
  banking: 'intake.section.banking',
  risk: 'intake.section.risk',
}

const SECTION_BADGE = {
  done: 'default',
  partial: 'secondary',
  left: 'outline',
  auto: 'outline',
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
  const listed = Array.isArray(sections) ? sections : []
  const needed = Array.isArray(missing) ? missing : []
  const company = listed.length > 0
  const ordered = company ? sortCompanySections(listed) : listed
  const clamped = Math.min(100, Math.max(0, Number(percent) || 0))

  return (
    <Card>
      <CardHeader>
        <div className="space-y-1">
          <CardTitle>{title}</CardTitle>
          {company ? <CardDescription>{t('intake.chat.progressMarkedByAgent')}</CardDescription> : null}
        </div>
        {company ? (
          <Badge>{t('intake.chat.progressBadge').replace('{percent}', String(percent))}</Badge>
        ) : (
          <strong className="text-sm">{percent}%</strong>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {company ? <Progress value={clamped} /> : null}
        <ul className="space-y-2 text-sm">
          {ordered.map((section) => {
            const kind = sectionProgressKind(section)
            return (
              <li key={section.key} className="flex items-center justify-between gap-2">
                <span>{SECTION_KEY[section.key] ? t(SECTION_KEY[section.key]) : section.key}</span>
                <Badge variant={SECTION_BADGE[kind]}>{sectionStatusLabel(section, t)}</Badge>
              </li>
            )
          })}
          {company
            ? null
            : needed.map((field) => {
                const label = productFieldKey(field)
                return (
                  <li key={field} className="flex items-center justify-between gap-2">
                    <span>{label ? t(label) : field}</span>
                    <span className="text-muted-foreground">{t('intake.chat.progressNeeded')}</span>
                  </li>
                )
              })}
        </ul>
        {company ? (
          <div className="space-y-2">
            <Separator />
            <div className="space-y-1">
              <p className="text-sm font-medium">{t('intake.chat.progressWhyTitle')}</p>
              <p className="text-xs text-muted-foreground">{t('intake.chat.progressWhy')}</p>
            </div>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">{t('intake.chat.progressHint')}</p>
        )}
      </CardContent>
    </Card>
  )
}
