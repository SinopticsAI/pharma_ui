import { Link, useNavigate } from '@tanstack/react-router'
import type { Application } from '../data/types'
import { caseProgress, caseStatus } from '../data/derive'
import { currentWork } from '../data/work'
import { Button, Progress, StatusBadge } from './Ui'
import { useI18n } from '../i18n'
import styles from '../styles/ui.module.css'

export function FeaturedApplication({ application }: { application: Application }) {
  const navigate = useNavigate()
  const { t, kind, procedure, owner, due, expert, product, work } = useI18n()
  const current = currentWork(application.works)
  const progress = caseProgress(application)

  return (
    <article className={`${styles.card} ${styles.featured}`}>
      <div className={styles.featuredHead}>
        <div>
          <div className={styles.featuredNumber}>{application.number}</div>
          <h2 className={styles.featuredProduct}>{product(application.product)}</h2>
        </div>
        <StatusBadge status={caseStatus(application)} />
      </div>
      <dl className={styles.meta}>
        <div>
          <dt>{t('featured.type')}</dt>
          <dd>
            {kind(application.kind)} · {procedure(application.procedure)}
          </dd>
        </div>
        <div>
          <dt>{t('featured.current')}</dt>
          <dd>{current ? `${current.code}. ${work.title(application.kind, current)}` : t('featured.allClosed')}</dd>
        </div>
        <div>
          <dt>{t('featured.due')}</dt>
          <dd>
            {due(application.nextDue)}
            {current ? t('featured.owner', { owner: owner(current.owner) }) : ''}
          </dd>
        </div>
        <div>
          <dt>{t('featured.expert')}</dt>
          <dd>{application.expert ? expert(application.expert) : t('common.unassigned')}</dd>
        </div>
      </dl>
      <Progress
        current={progress.done}
        total={progress.total}
        label={t('case.closedWorks', { done: progress.done, total: progress.total })}
      />
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <Button
          type="button"
          onClick={() => void navigate({ to: '/applications/$applicationId', params: { applicationId: application.id } })}
        >
          {t('featured.open')}
        </Button>
        {current ? (
          <Link
            to="/applications/$applicationId/works/$workCode"
            params={{ applicationId: application.id, workCode: current.code }}
          >
            <Button type="button" variant="secondary">
              {t('featured.currentBtn')}
            </Button>
          </Link>
        ) : null}
      </div>
    </article>
  )
}

export function CurrentProgress({ application }: { application: Application }) {
  const { t, product, work } = useI18n()
  const progress = caseProgress(application)
  const current = currentWork(application.works)

  return (
    <section className={styles.card}>
      <h2 className={styles.cardTitle}>{t('overview.featuredProgress')}</h2>
      <p style={{ marginBottom: 12 }}>
        {application.number} · {product(application.product)}
      </p>
      <Progress
        current={progress.done}
        total={progress.total}
        label={t('case.closedWorks', { done: progress.done, total: progress.total })}
      />
      <p className={styles.formHint} style={{ marginTop: 10 }}>
        {current
          ? t('overview.nextWork', { code: current.code, title: work.title(application.kind, current) })
          : t('overview.allClosed')}
      </p>
      <Link
        to="/applications/$applicationId"
        params={{ applicationId: application.id }}
        style={{ marginTop: 8, display: 'inline-block' }}
      >
        {t('overview.toPlan')}
      </Link>
    </section>
  )
}
