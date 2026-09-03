import { Link } from '@tanstack/react-router'
import { STAGE_ORDER, l10n, stagePosition } from '@demo/domain'
import { useI18n } from '@demo/i18n'
import {
  Callout,
  Card,
  Empty,
  Estimate,
  KeyValue,
  Metric,
  PageHeader,
  StagePills,
  StatusBadge,
  Timeline,
  TimelineItem,
  ui,
} from '@demo/ui'
import { useCaseId } from '../CaseLayout'
import { useCase, useStatuses } from '../queries'

export function DashboardPage() {
  const caseId = useCaseId()
  const { t, text, dateTime } = useI18n()
  const caseQuery = useCase(caseId)
  const statuses = useStatuses(caseId)

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

      <div className={ui.split}>
        <div className={ui.stack}>
          {/* Одно следующее действие. Карта и список задач не должны расходиться. */}
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

          <Card title={t('map.title')}>
            <div className={ui.stack}>
              {detail.nodeMap.slice(0, 5).map((node) => (
                <div key={node.code} className={ui.cardHeader}>
                  <span>
                    {node.code} · {text(l10n(node.title)).value}
                  </span>
                  <StatusBadge tone={node.status === 'done' ? 'accent' : 'quiet'}>
                    {t(`nodeStatus.${node.status}`)}
                  </StatusBadge>
                </div>
              ))}
              <Link to="/case/$caseId/roadmap" params={{ caseId }}>
                {t('map.title')} →
              </Link>
            </div>
          </Card>
        </div>
      </div>

      <Estimate>{t('common.estimate')}</Estimate>
    </>
  )
}
