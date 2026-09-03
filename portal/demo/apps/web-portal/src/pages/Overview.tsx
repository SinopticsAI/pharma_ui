import { describeError, useIdentity } from '@demo/api-client'
import { l10n } from '@demo/domain'
import { useCases } from '../data/portal'
import { caseStatus } from '../data/derive'
import { AttentionList } from '../components/AttentionList'
import { ApplicationsTable } from '../components/ApplicationsTable'
import { CurrentProgress, FeaturedApplication } from '../components/FeaturedApplication'
import { Callout, Card, Empty, Kpi, PageHeader } from '../components/Ui'
import { useI18n } from '../i18n'
import styles from '../styles/ui.module.css'

export function OverviewPage() {
  const cases = useCases()
  const identity = useIdentity()
  const { t, text } = useI18n()

  const applications = cases.data ?? []
  const featured = applications[0]

  const statuses = applications.map((item) => caseStatus(item))
  const active = statuses.filter((status) => status !== 'approved' && status !== 'draft').length
  const waiting = applications.filter((item) => item.works.some((work) => work.status === 'waiting_client')).length
  const review = applications.filter((item) =>
    item.works.some((work) => work.status === 'with_agent' || work.status === 'in_review'),
  ).length
  // Счётчика сертификатов здесь нет: реестровых записей ядро не отдаёт, а
  // считать их по кейсам значило бы выдать заявку за выданное удостоверение.

  return (
    <>
      <PageHeader
        title={t('overview.hello')}
        subtitle={t('overview.subtitle', { org: text(l10n(identity.account.name, identity.accountId).ru) })}
      />

      {cases.isError ? <Callout tone="warn">{describeError(cases.error)}</Callout> : null}

      <section className={styles.kpis} aria-label={t('overview.kpis')}>
        <Kpi value={active} label={t('overview.kpi.active')} hint={t('overview.kpi.activeHint')} />
        <Kpi value={waiting} label={t('overview.kpi.action')} hint={t('overview.kpi.actionHint')} />
        <Kpi value={review} label={t('overview.kpi.review')} hint={t('overview.kpi.reviewHint')} />
        <Kpi value={applications.length} label={t('overview.kpi.total')} hint={t('overview.kpi.totalHint')} />
      </section>

      {cases.isLoading ? <Empty>{t('session.loading')}</Empty> : null}
      {!cases.isLoading && applications.length === 0 ? <Empty>{t('cases.empty')}</Empty> : null}

      <div className={styles.split}>
        <Card title={t('overview.attention')}>
          <AttentionList applications={applications} />
        </Card>
        {featured ? <FeaturedApplication application={featured} /> : null}
      </div>

      {featured ? <CurrentProgress application={featured} /> : null}

      <section className={styles.section}>
        <Card title={t('overview.recent')}>
          <ApplicationsTable applications={applications} />
        </Card>
      </section>
    </>
  )
}
