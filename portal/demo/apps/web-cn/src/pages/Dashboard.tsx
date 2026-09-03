import { Link } from '@tanstack/react-router'
import { STAGE_ORDER, stagePosition } from '@demo/domain'
import { useI18n } from '@demo/i18n'
import {
  Callout,
  Card,
  Empty,
  Estimate,
  KeyValue,
  Metric,
  Money,
  PageHeader,
  StagePills,
  StatusBadge,
  Timeline,
  TimelineItem,
  ui,
} from '@demo/ui'
import { useCaseId } from '../CaseLayout'
import { useCase, useDocuments, useLedger, useStatuses } from '../queries'

export function DashboardPage() {
  const caseId = useCaseId()
  const { t, text, money, dateTime } = useI18n()
  const caseQuery = useCase(caseId)
  const documents = useDocuments(caseId)
  const ledger = useLedger(caseId)
  const statuses = useStatuses(caseId)

  const current = caseQuery.data
  if (!current) return <Empty>{t('common.loading')}</Empty>

  const pending = [
    ...(documents.data ?? [])
      .filter((document) => document.versions.length === 0)
      .map((document) => ({
        id: document.id,
        label: text(document.title).value,
        owner: document.preparedBy,
        note: document.awaitingFrom ? text(document.awaitingFrom).value : undefined,
      })),
    ...(ledger.data ?? [])
      .filter((line) => line.status === 'accepted')
      .map((line) => ({
        id: line.id,
        label: `${text(line.supplier).value} · ${text(line.purpose).value}`,
        owner: 'ru' as const,
        note: line.paymentDeadline ? text(line.paymentDeadline).value : undefined,
      })),
  ]

  const recentLedger = (ledger.data ?? []).slice(-3).reverse()

  return (
    <>
      <PageHeader title={`${current.code} · ${text(current.product).value}`} lead={text(current.manufacturer).value} />

      <Card>
        <StagePills
          stages={STAGE_ORDER.map((stage) => ({
            key: stage,
            label: t(`stage.${stage}`),
            position: stagePosition(stage, current.currentStage),
          }))}
        />
      </Card>

      <div className={ui.split}>
        <div className={ui.stack}>
          <Callout tone="deadline">
            <strong>{t('case.waitingFor')}:</strong> {text(current.waitingFor).value} ·{' '}
            <strong>{t('case.deadline')}:</strong> {current.dueWorkingDays} {t('common.workingDays')} ·{' '}
            <strong>{t('case.nextStep')}:</strong> {t(`actor.${current.nextActor}`)}
          </Callout>

          {!current.mandateComplete ? <Callout tone="deadline">{t('case.mandateOpen')}</Callout> : null}
          {!current.modelsLocked ? <Callout tone="quiet">{t('case.modelsOpen')}</Callout> : null}

          <Card title={t('case.checklist')}>
            {pending.length === 0 ? (
              <Empty>{t('common.none')}</Empty>
            ) : (
              <ul className={ui.stack} style={{ margin: 0, paddingLeft: 18 }}>
                {pending.map((item) => (
                  <li key={item.id}>
                    <div className={ui.row}>
                      <span>{item.label}</span>
                      <StatusBadge tone="quiet">{t(`actor.${item.owner}`)}</StatusBadge>
                    </div>
                    {item.note ? <span className={ui.muted}>{item.note}</span> : null}
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title={t('case.digest')}>
            {(statuses.data ?? []).length === 0 ? (
              <Empty>{t('inbox.empty')}</Empty>
            ) : (
              <Timeline>
                {(statuses.data ?? []).slice(0, 3).map((entry) => {
                  const resolved = text(entry.text)
                  return (
                    <TimelineItem key={entry.id} date={dateTime(entry.enteredAt)}>
                      <span>{resolved.value}</span>
                      <div className={ui.row}>
                        <StatusBadge tone="quiet">{t(`stage.${entry.stage}`)}</StatusBadge>
                        <StatusBadge>{entry.artifact}</StatusBadge>
                        {!resolved.translated ? <StatusBadge tone="warm">{t('inbox.untranslated')}</StatusBadge> : null}
                      </div>
                    </TimelineItem>
                  )
                })}
              </Timeline>
            )}
          </Card>
        </div>

        <div className={ui.stack}>
          <Card>
            <Metric value={`${current.dueWorkingDays} ${t('common.workingDays')}`} label={t('case.deadline')} />
            <KeyValue
              items={[
                { key: t('case.track'), value: t(`track.${current.track}`) },
                { key: t('case.class'), value: current.riskClass },
                {
                  key: t('case.cycle'),
                  value: `${current.cycleMonths[0]}–${current.cycleMonths[1]} ${t('common.months')}`,
                },
              ]}
            />
          </Card>

          <Card title={t('case.miniLedger')}>
            <div className={ui.stack}>
              {recentLedger.map((line) => (
                <div key={line.id} className={ui.stack} style={{ gap: 4 }}>
                  <div className={ui.cardHeader}>
                    <span>{text(line.supplier).value}</span>
                    <Money value={money(line.amount, line.currency)} />
                  </div>
                  <StatusBadge tone={line.type === 'commission' ? 'accent' : 'quiet'}>
                    {line.type === 'commission' ? t('ledger.commission') : t('ledger.passThrough')}
                  </StatusBadge>
                </div>
              ))}
              <Link to="/case/$caseId/ledger" params={{ caseId }}>
                {t('case.openLedger')} →
              </Link>
            </div>
          </Card>
        </div>
      </div>

      <Estimate>{t('common.estimate')}</Estimate>
    </>
  )
}
