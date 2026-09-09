import { useI18n } from '@demo/i18n'
import { officialEvents } from '../demo/catalog'
import {
  ActorBadge,
  Benefit,
  Callout,
  Card,
  DemoMark,
  Metric,
  NextAction,
  PageHeader,
  StatusBadge,
  Timeline,
  TimelineItem,
} from '../kit'
import { Shell } from '../Shell'

export function WorkbenchPage() {
  const { t, text, date } = useI18n()
  const events = officialEvents()

  return (
    <Shell>
      <PageHeader eyebrow={t('eyebrow.official')} title={t('official.title')} lead={t('official.lead')} />
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <ActorBadge actor="us">{t('nodeOwner.us')}</ActorBadge>
        <ActorBadge actor="system">{t('nodeOwner.gov')}</ActorBadge>
      </div>
      <DemoMark>{t('shell.demoMark')} · M5 → M12</DemoMark>
      <div className="mb-3 flex flex-wrap gap-2">
        <StatusBadge tone="ok">{t('official.onMarket')}</StatusBadge>
        <StatusBadge tone="ok">{t('official.ruIssued')}</StatusBadge>
        <StatusBadge tone="ok">{t('official.importReady')}</StatusBadge>
        <StatusBadge tone="ok">{t('official.firstSale')}</StatusBadge>
      </div>
      <NextAction label={t('official.successMetric')}>{t('official.postreg')}</NextAction>

      <Card title={t('official.metricLead')}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Metric accent value={t('official.metricMonths')} label={t('official.metricMonthsLabel')} />
          <Metric accent value={t('official.metricMarkup')} label={t('official.metricMarkupLabel')} />
          <Metric accent value={t('official.metricRounds')} label={t('official.metricRoundsLabel')} />
        </div>
      </Card>

      <Callout tone="quiet">{t('official.owner')}</Callout>

      <Card title={t('official.title')}>
        <Timeline>
          {events.map((event) => (
            <TimelineItem key={event.number} date={date(event.at)}>
              <p>{text(event.title).value}</p>
              <div className="flex flex-wrap gap-2">
                <StatusBadge>
                  {t('official.number')}: {event.number}
                </StatusBadge>
                <StatusBadge tone="quiet">
                  {t('official.source')}: {text(event.source).value}
                </StatusBadge>
              </div>
            </TimelineItem>
          ))}
        </Timeline>
      </Card>

      <Card title={t('official.postreg')}>
        <ul className="list-disc pl-4 text-sm">
          <li>{t('official.vigilance')}</li>
          <li>{t('official.uppRenew')}</li>
          <li>{t('official.changes')}</li>
        </ul>
      </Card>
      <Benefit label={t('benefit.label')}>{t('benefit.official')}</Benefit>
    </Shell>
  )
}
