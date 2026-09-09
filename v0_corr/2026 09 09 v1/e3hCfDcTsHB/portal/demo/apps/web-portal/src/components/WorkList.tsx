import { Link } from '@tanstack/react-router'
import { Lock, Paperclip, ShieldCheck } from 'lucide-react'
import type { Application } from '../data/types'
import { blockingWorks, isUnlocked, slotsFilled, type WorkItem } from '../data/work'
import { currentWork } from '../data/work'
import { WorkStatusBadge } from './Ui'
import { useI18n } from '../i18n'
import styles from '../styles/work.module.css'

function WorkRow({ application, workItem, active }: { application: Application; workItem: WorkItem; active: boolean }) {
  const { t, owner, work } = useI18n()
  const unlocked = isUnlocked(workItem, application.works)
  const blockers = blockingWorks(workItem, application.works)
  const slots = slotsFilled(workItem)

  const className = [
    styles.row,
    active ? styles.rowCurrent : '',
    !unlocked ? styles.rowLocked : '',
    workItem.status === 'done' ? styles.rowDone : '',
  ]
    .filter(Boolean)
    .join(' ')

  const body = (
    <>
      <span className={styles.code}>{workItem.code}</span>
      <span className={styles.main}>
        <span className={styles.title}>{work.title(application.kind, workItem)}</span>
        <span className={styles.summary}>{work.summary(application.kind, workItem)}</span>
        <span className={styles.meta}>
          <span>{t('workList.owner', { owner: owner(workItem.owner) })}</span>
          {slots.total > 0 ? (
            <span>
              <Paperclip size={12} strokeWidth={1.75} aria-hidden="true" />{' '}
              {t('workList.docs', { filled: slots.filled, total: slots.total })}
            </span>
          ) : null}
          {workItem.needsAgentConfirmation ? (
            <span>
              <ShieldCheck size={12} strokeWidth={1.75} aria-hidden="true" /> {t('workList.confirmNeeded')}
            </span>
          ) : null}
          {!unlocked && blockers.length > 0 ? (
            <span>
              <Lock size={12} strokeWidth={1.75} aria-hidden="true" /> {t('workList.waiting', { codes: blockers.map((item) => item.code).join(', ') })}
            </span>
          ) : null}
        </span>
      </span>
      <span className={styles.aside}>
        <WorkStatusBadge status={workItem.status} />
      </span>
    </>
  )

  if (!unlocked) {
    return (
      <div className={className} aria-disabled="true">
        {body}
      </div>
    )
  }

  return (
    <Link
      to="/applications/$applicationId/works/$workCode"
      params={{ applicationId: application.id, workCode: workItem.code }}
      className={className}
      aria-current={active ? 'step' : undefined}
    >
      {body}
    </Link>
  )
}

export function WorkList({ application }: { application: Application }) {
  const { t } = useI18n()
  const active = currentWork(application.works)
  const groups = [
    { title: t('workList.prep'), test: (code: string) => code.startsWith('0.') },
    { title: t('workList.gov'), test: (code: string) => !code.startsWith('0.') },
  ]

  return (
    <div>
      {groups.map((group) => {
        const works = application.works.filter((item) => group.test(item.code))
        if (works.length === 0) return null
        return (
          <section key={group.title}>
            <h3 className={styles.groupTitle}>{group.title}</h3>
            <div className={styles.list}>
              {works.map((item) => (
                <WorkRow key={item.code} application={application} workItem={item} active={active?.code === item.code} />
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}
