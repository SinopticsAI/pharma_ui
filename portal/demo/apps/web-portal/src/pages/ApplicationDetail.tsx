import { Link, useParams } from '@tanstack/react-router'
import { describeError } from '@demo/api-client'
import { l10n } from '@demo/domain'
import { NODES_WITHOUT_WORK, useCase } from '../data/portal'
import { caseProgress, caseStatus } from '../data/derive'
import { currentWork } from '../data/work'
import { Button, Callout, Card, Empty, KeyValue, PageHeader, Progress, StatusBadge } from '../components/Ui'
import { WorkList } from '../components/WorkList'
import { useI18n } from '../i18n'
import styles from '../styles/ui.module.css'

export function ApplicationDetailPage() {
  const { applicationId } = useParams({ from: '/applications/$applicationId' })
  const caseQuery = useCase(applicationId)
  const { t, kind, procedure, product, form, country, sites, date, work } = useI18n()

  if (caseQuery.isLoading) return <Empty>{t('session.loading')}</Empty>

  if (caseQuery.isError || !caseQuery.data) {
    return (
      <>
        <PageHeader title={t('case.notFound')} />
        <Empty>
          {caseQuery.error ? describeError(caseQuery.error) : t('case.notFoundBody')}{' '}
          <Link to="/applications">{t('case.backList')}</Link>
        </Empty>
      </>
    )
  }

  const { application, detail } = caseQuery.data
  const current = currentWork(application.works)
  const progress = caseProgress(application)
  const critical = detail.criticalNode
  // Узлы, которых нет в порядке работ: горизонт кейса не сводится к досье.
  const extraNodes = detail.nodeMap.filter((node) => NODES_WITHOUT_WORK.includes(node.code))

  return (
    <>
      <PageHeader
        title={`${application.number} · ${product(application.product)}`}
        subtitle={`${kind(application.kind)} · ${procedure(application.procedure)}`}
        action={
          current ? (
            <Link
              to="/applications/$applicationId/works/$workCode"
              params={{ applicationId: application.id, workCode: current.code }}
            >
              <Button type="button">{t('case.goCurrent')}</Button>
            </Link>
          ) : undefined
        }
      />

      {critical ? (
        <Callout>
          <strong>{t('map.critical')}:</strong> {critical.code} · {l10n(critical.title).ru} ·{' '}
          {t(`nodeOwner.${critical.owner}`)}
          {critical.dueHint ? ` · ${l10n(critical.dueHint).ru}` : ''}
        </Callout>
      ) : null}

      <div className={styles.split}>
        <Card title={t('case.currentWork')}>
          {current ? (
            <>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10, flexWrap: 'wrap' }}>
                <StatusBadge status={caseStatus(application)} />
                <span className={styles.formHint}>
                  {t('case.due', { due: t('case.dueDays', { n: application.dueWorkingDays }) })}
                </span>
              </div>
              <p style={{ marginBottom: 12 }}>
                {current.code}. {work.title(application.kind, current)}
              </p>
              <p className={styles.formHint} style={{ marginBottom: 14 }}>
                {work.summary(application.kind, current)}
              </p>
              <Progress
                current={progress.done}
                total={progress.total}
                label={t('case.closedWorks', { done: progress.done, total: progress.total })}
              />
            </>
          ) : (
            <Empty>{t('case.allClosed')}</Empty>
          )}
        </Card>

        <Card title={t('case.card')}>
          <KeyValue
            items={[
              { key: t('case.kind'), value: kind(application.kind) },
              { key: t('case.form'), value: application.form ? form(application.form) : t('common.unspecified') },
              { key: t('case.country'), value: application.country ? country(application.country) : t('common.dash') },
              { key: t('case.manufacturer'), value: application.manufacturer || t('common.dash') },
              { key: t('case.sites'), value: application.sites ? sites(application.sites) : t('common.dash') },
              { key: t('case.track'), value: detail.case.track },
              { key: t('case.riskClass'), value: detail.case.riskClass },
              { key: t('case.waiting'), value: application.waitingFor || t('common.dash') },
              { key: t('case.created'), value: application.createdAt ? date(application.createdAt) : t('common.dash') },
            ]}
          />
        </Card>
      </div>

      <Card title={t('case.plan')}>
        <p className={styles.formHint} style={{ marginBottom: 12 }}>
          {t('case.planHint')}
        </p>
        {detail.nodeMap.length === 0 ? <Callout tone="warn">{t('map.empty')}</Callout> : null}
        <WorkList application={application} />
      </Card>

      {extraNodes.length > 0 ? (
        <Card title={t('map.title')} meta={t('map.lead')}>
          <div className={styles.list}>
            {extraNodes.map((node) => (
              <div key={node.code} style={{ display: 'grid', gridTemplateColumns: '60px 1fr auto', gap: 12 }}>
                <span className={styles.formHint}>{node.code}</span>
                <span>
                  {l10n(node.title).ru}
                  {node.note ? (
                    <span className={styles.formHint} style={{ display: 'block' }}>
                      {l10n(node.note).ru}
                    </span>
                  ) : null}
                </span>
                <span className={styles.formHint}>
                  {t(`node.${node.status}`)} · {t(`nodeOwner.${node.owner}`)}
                  {node.dueHint ? ` · ${l10n(node.dueHint).ru}` : ''}
                </span>
              </div>
            ))}
          </div>
        </Card>
      ) : null}
    </>
  )
}
