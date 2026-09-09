import { useI18n } from '@demo/i18n'
import { demoContractor } from '../demo/catalog'
import {
  ActorBadge,
  Benefit,
  Callout,
  Card,
  DemoMark,
  KeyValue,
  Metric,
  NextAction,
  PageHeader,
  StatusBadge,
  Timeline,
  TimelineItem,
} from '../kit'
import { Shell } from '../Shell'

export function ContractorsPage() {
  const { t, text } = useI18n()
  const contractor = demoContractor()

  return (
    <Shell>
      <PageHeader eyebrow={t('eyebrow.contractor')} title={t('nav.contractors')} lead={t('contractor.why')} />
      <DemoMark>{t('shell.demoMark')}</DemoMark>
      <Card title={text(contractor.name).value} meta={text(contractor.role).value}>
        <StatusBadge tone="ok">{t('contractor.admitted')}</StatusBadge>
        <a
          href={`${import.meta.env.BASE_URL.replace(/\/$/, '')}/contractors/${contractor.id}`}
          className="ml-3 text-sm underline"
        >
          {t('contractor.open')} →
        </a>
      </Card>
    </Shell>
  )
}

export function ContractorCardPage() {
  const { t, text } = useI18n()
  const contractor = demoContractor()

  return (
    <Shell>
      <PageHeader
        eyebrow={t('eyebrow.contractor')}
        title={text(contractor.name).value}
        lead={text(contractor.role).value}
      />
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <ActorBadge actor="us">{t('nodeOwner.us')}</ActorBadge>
        <ActorBadge actor="contractor">{t('nodeOwner.contractor')}</ActorBadge>
      </div>
      <DemoMark>{t('shell.demoMark')}</DemoMark>
      <div className="mb-3 flex flex-wrap gap-2">
        <StatusBadge tone="ok">{t('contractor.admitted')}</StatusBadge>
        <StatusBadge tone="ok">{t('contractor.cost')}</StatusBadge>
      </div>
      <NextAction label={t('shell.nextAction')}>
        {contractor.timeline[2] ? text(contractor.timeline[2].text).value : ''}
      </NextAction>
      <Callout>{t('contractor.why')}</Callout>

      <h2 className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        {t('contractor.metrics')}
      </h2>
      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <Metric value={contractor.orders} label={t('contractor.orders')} />
        </Card>
        <Card>
          <Metric value={text(contractor.median).value} label={t('contractor.median')} />
        </Card>
        <Card>
          <Metric value={contractor.accepted} label={t('contractor.accepted')} />
        </Card>
        <Card>
          <Metric value={contractor.remarks} label={t('contractor.remarks')} />
        </Card>
        <Card>
          <Metric value={text(contractor.slips).value} label={t('contractor.slips')} />
        </Card>
        <Card>
          <Metric value={contractor.incidents} label={t('contractor.incidents')} />
        </Card>
      </div>

      <Card title={t('contractor.kyc')}>
        <KeyValue
          items={contractor.checks.map((row) => ({ key: text(row.source).value, value: text(row.result).value }))}
        />
      </Card>

      <Card title={t('contractor.caseHistory')}>
        <Timeline>
          {contractor.timeline.map((item) => (
            <TimelineItem key={text(item.at).value} date={text(item.at).value}>
              {text(item.text).value}
            </TimelineItem>
          ))}
        </Timeline>
      </Card>
    </Shell>
  )
}
