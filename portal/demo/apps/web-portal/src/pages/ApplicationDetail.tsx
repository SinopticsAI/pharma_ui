import { Link } from '@tanstack/react-router'
import { useParams } from '@tanstack/react-router'
import { useApplication } from '../data/store'
import { caseProgress, caseStatus } from '../data/derive'
import { currentWork } from '../data/work'
import { Button, Callout, Card, Empty, KeyValue, PageHeader, Progress, StatusBadge } from '../components/Ui'
import { WorkList } from '../components/WorkList'
import { useI18n } from '../i18n'
import styles from '../styles/ui.module.css'

export function ApplicationDetailPage() {
  const { applicationId } = useParams({ from: '/applications/$applicationId' })
  const application = useApplication(applicationId)
  const { t, kind, procedure, product, form, country, sites, expert, date, dateTime, due, work, journal } = useI18n()

  if (!application) {
    return (
      <>
        <PageHeader title={t('case.notFound')} />
        <Empty>
          {t('case.notFoundBody')} <Link to="/applications">{t('case.backList')}</Link>
        </Empty>
      </>
    )
  }

  const current = currentWork(application.works)
  const progress = caseProgress(application)
  const registryFound = application.registry.status === 'found'
  const registryNumber = application.registry.number || t('case.numberMissing')

  return (
    <>
      <PageHeader
        title={`${application.number} · ${product(application.product)}`}
        subtitle={`${kind(application.kind)} · ${procedure(application.procedure)}`}
        action={
          current ? (
            <Link to="/applications/$applicationId/works/$workCode" params={{ applicationId: application.id, workCode: current.code }}>
              <Button type="button">{t('case.goCurrent')}</Button>
            </Link>
          ) : undefined
        }
      />

      {registryFound ? <Callout>{t('case.registryFound', { number: registryNumber })}</Callout> : null}

      <div className={styles.split}>
        <Card title={t('case.currentWork')}>
          {current ? (
            <>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10, flexWrap: 'wrap' }}>
                <StatusBadge status={caseStatus(application)} />
                <span className={styles.formHint}>{t('case.due', { due: due(application.nextDue) })}</span>
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
              { key: t('case.country'), value: country(application.country) },
              { key: t('case.manufacturer'), value: application.manufacturer },
              { key: t('case.sites'), value: application.sites ? sites(application.sites) : t('common.dash') },
              {
                key: t('case.registry'),
                value:
                  application.registry.status === 'pending'
                    ? t('case.registry.pending')
                    : application.registry.status === 'found'
                      ? t('case.registry.found', { number: registryNumber })
                      : t('case.registry.notFound'),
              },
              { key: t('case.expert'), value: application.expert ? expert(application.expert) : t('common.unassigned') },
              { key: t('case.created'), value: date(application.createdAt) },
            ]}
          />
        </Card>
      </div>

      <Card title={t('case.plan')}>
        <p className={styles.formHint} style={{ marginBottom: 12 }}>
          {t('case.planHint')}
        </p>
        <WorkList application={application} />
      </Card>

      <Card title={t('case.journal')} meta={t('case.journalMeta')}>
        <div className={styles.list}>
          {application.journal.slice(0, 8).map((entry) => (
            <div key={entry.id} style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: 12, fontSize: 13 }}>
              <span className={styles.formHint}>{dateTime(entry.at)}</span>
              <span>
                {entry.workCode ? <strong>{entry.workCode}. </strong> : null}
                {journal(entry, application.kind)}
                <span className={styles.formHint} style={{ display: 'block' }}>
                  {expert(entry.actor)}
                </span>
              </span>
            </div>
          ))}
        </div>
      </Card>
    </>
  )
}
