import { l10n, STAGE_ORDER, stagePosition } from '@demo/domain'
import { useI18n } from '@demo/i18n'
import { Link } from '@tanstack/react-router'
import { useCaseId } from '../CaseLayout'
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
} from '../kit'
import { NodeMapView } from '../NodeMap'
import { useCase, useLedger, useStatuses } from '../queries'

export function DashboardPage() {
  const caseId = useCaseId()
  const { t, text, money, dateTime } = useI18n()
  const caseQuery = useCase(caseId)
  const statuses = useStatuses(caseId)
  const ledger = useLedger(caseId)

  const detail = caseQuery.data
  if (!detail) return <Empty>{t('common.loading')}</Empty>

  const current = detail.case
  const critical = detail.criticalNode
  const entries = statuses.data ?? []

  return (
    <>
      <PageHeader
        title={`${current.code} · ${text(l10n(current.product)).value}`}
        lead={text(l10n(current.manufacturer)).value}
      />

      <Card>
        <StagePills
          stages={STAGE_ORDER.map((stage) => ({
            key: stage,
            label: t(`stage.${stage}`),
            position: stagePosition(stage, current.currentStage),
          }))}
        />
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-4">
          {critical ? (
            <Callout tone="deadline">
              <strong>{t('map.critical')}:</strong> {critical.code} · {text(l10n(critical.title)).value} ·{' '}
              <strong>{t('map.owner')}:</strong> {t(`nodeOwner.${critical.owner}`)}
              {critical.dueHint ? ` · ${text(l10n(critical.dueHint)).value}` : ''}
            </Callout>
          ) : null}

          <Callout tone="quiet">
            <strong>{t('case.waitingFor')}:</strong> {text(l10n(current.waitingFor)).value} ·{' '}
            <strong>{t('case.deadline')}:</strong> {current.dueWorkingDays} {t('common.workingDays')} ·{' '}
            <strong>{t('case.nextStep')}:</strong> {t(`actor.${current.nextActor}`)}
          </Callout>

          {!current.mandateComplete ? <Callout tone="deadline">{t('case.mandateOpen')}</Callout> : null}
          {!current.modelsLocked ? <Callout tone="quiet">{t('case.modelsOpen')}</Callout> : null}

          <Card title={t('case.digest')}>
            {entries.length === 0 ? (
              <Empty>{t('inbox.empty')}</Empty>
            ) : (
              <Timeline>
                {entries.slice(0, 3).map((entry) => {
                  const resolved = text(l10n(entry.text))
                  return (
                    <TimelineItem key={entry.id} date={dateTime(entry.enteredAt)}>
                      <span>{resolved.value}</span>
                      <div className="flex flex-wrap gap-2">
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

        <div className="space-y-4">
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
            {(ledger.data ?? []).length === 0 ? (
              <Empty>{t('ledger.empty')}</Empty>
            ) : (
              <div className="space-y-3">
                {(ledger.data ?? [])
                  .slice(-3)
                  .reverse()
                  .map((line) => (
                    <div key={line.id} className="space-y-1">
                      <div className="flex items-center justify-between gap-2 text-sm">
                        <span>{text(line.supplier).value}</span>
                        <Money value={money(line.amount, line.currency)} />
                      </div>
                      <StatusBadge tone={line.type === 'commission' ? 'accent' : 'quiet'}>
                        {line.type === 'commission' ? t('ledger.commission') : t('ledger.passThrough')}
                      </StatusBadge>
                    </div>
                  ))}
              </div>
            )}
            <Link to="/case/$caseId/ledger" params={{ caseId }}>
              {t('case.openLedger')} →
            </Link>
          </Card>

          <Card title={t('map.title')}>
            <NodeMapView items={detail.nodeMap.slice(0, 5)} className="h-[280px]" />
            <Link to="/case/$caseId/roadmap" params={{ caseId }}>
              {t('map.title')} →
            </Link>
          </Card>
        </div>
      </div>

      <Estimate>{t('common.estimate')}</Estimate>
    </>
  )
}
