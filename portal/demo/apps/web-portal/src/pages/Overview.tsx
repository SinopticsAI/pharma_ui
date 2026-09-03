import { Plus } from 'lucide-react'
import { CERTIFICATES } from '../data/seed'
import { ORGANIZATION } from '../data/types'
import { FEATURED_ID, usePortalStore } from '../data/store'
import { caseStatus } from '../data/derive'
import { AttentionList } from '../components/AttentionList'
import { ApplicationsTable } from '../components/ApplicationsTable'
import { CurrentProgress, FeaturedApplication } from '../components/FeaturedApplication'
import { Button, Card, Kpi, PageHeader } from '../components/Ui'
import { useShellUi } from '../components/shell-ui'
import { useI18n } from '../i18n'
import styles from '../styles/ui.module.css'

export function OverviewPage() {
  const { applications } = usePortalStore()
  const { openCreate } = useShellUi()
  const { t } = useI18n()
  const featured = applications.find((item) => item.id === FEATURED_ID) ?? applications[0]

  const statuses = applications.map((item) => caseStatus(item))
  const active = statuses.filter((status) => status !== 'approved' && status !== 'draft').length
  const waiting = applications.filter((item) => item.works.some((work) => work.status === 'waiting_client')).length
  const review = applications.filter((item) =>
    item.works.some((work) => work.status === 'with_agent' || work.status === 'in_review'),
  ).length
  const certificates = CERTIFICATES.filter((item) => item.status === 'действует').length

  return (
    <>
      <PageHeader
        title={t('overview.hello')}
        subtitle={t('overview.subtitle', { org: ORGANIZATION.name })}
        action={
          <Button type="button" onClick={openCreate}>
            <Plus size={16} strokeWidth={1.75} aria-hidden="true" />
            {t('overview.create')}
          </Button>
        }
      />

      <section className={styles.kpis} aria-label={t('overview.kpis')}>
        <Kpi value={active} label={t('overview.kpi.active')} hint={t('overview.kpi.activeHint')} />
        <Kpi value={waiting} label={t('overview.kpi.action')} hint={t('overview.kpi.actionHint')} />
        <Kpi value={review} label={t('overview.kpi.review')} hint={t('overview.kpi.reviewHint')} />
        <Kpi value={certificates} label={t('overview.kpi.certs')} hint={t('overview.kpi.certsHint')} />
      </section>

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
