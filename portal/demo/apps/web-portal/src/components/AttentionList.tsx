import { Link } from '@tanstack/react-router'
import { AlertTriangle, Clock3, FileSearch, Lock } from 'lucide-react'
import type { Application } from '../data/types'
import type { WorkItem } from '../data/work'
import { Empty } from './Ui'
import { useI18n } from '../i18n'
import styles from '../styles/ui.module.css'

interface AttentionRow {
  id: string
  applicationId: string
  workCode: string
  title: string
  detail: string
  due: string
  severity: 'action' | 'remarks' | 'review'
}

const ICONS = {
  action: AlertTriangle,
  remarks: AlertTriangle,
  review: FileSearch,
} as const

function severityOf(work: WorkItem): AttentionRow['severity'] {
  if (work.status === 'remarks') return 'remarks'
  if (work.status === 'waiting_client') return 'action'
  return 'review'
}

/** Блок внимания собирается из работ, а не из отдельного списка предупреждений. */
export function AttentionList({ applications }: { applications: Application[] }) {
  const { t, due, work, text } = useI18n()

  const rows: AttentionRow[] = applications
    .flatMap((item) =>
      item.works
        .filter((itemWork) => itemWork.status === 'remarks' || itemWork.status === 'waiting_client' || itemWork.status === 'with_agent')
        .map((itemWork) => ({
          id: `${item.id}-${itemWork.code}`,
          applicationId: item.id,
          workCode: itemWork.code,
          title: `${item.number} · ${itemWork.code}. ${work.title(item.kind, itemWork)}`,
          detail: itemWork.remark ? text(itemWork.remark) : work.summary(item.kind, itemWork),
          due: item.nextDue,
          severity: severityOf(itemWork),
        })),
    )
    .sort((a, b) => a.due.localeCompare(b.due))
    .slice(0, 4)

  if (rows.length === 0) return <Empty>{t('attention.empty')}</Empty>

  return (
    <ul className={styles.attention}>
      {rows.map((row) => {
        const Icon = row.severity === 'review' ? ICONS.review : ICONS.action
        return (
          <li key={row.id}>
            <Link
              to="/applications/$applicationId/works/$workCode"
              params={{ applicationId: row.applicationId, workCode: row.workCode }}
              className={styles.attentionItem}
            >
              <Icon
                size={16}
                strokeWidth={1.75}
                aria-hidden="true"
                color={row.severity === 'remarks' ? 'var(--bad)' : 'var(--warn)'}
              />
              <span>
                <span className={styles.attentionTitle}>{row.title}</span>
                <span className={styles.attentionDetail}>{row.detail}</span>
              </span>
              <span className={`${styles.due} ${row.severity === 'remarks' ? styles.dueBad : styles.dueWarn}`}>
                <Clock3 size={12} strokeWidth={1.75} aria-hidden="true" style={{ marginRight: 4, verticalAlign: '-1px' }} />
                {due(row.due)}
              </span>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}

/** Ближайшие заблокированные работы: показывает, чего именно ждёт кейс. */
export function BlockedHint({ application }: { application: Application }) {
  const { t, owner, work } = useI18n()
  const blocked = application.works.find((itemWork) => itemWork.blockedBy.length > 0 && itemWork.status === 'not_started')
  if (!blocked) return null
  return (
    <p className={styles.formHint}>
      <Lock size={12} strokeWidth={1.75} aria-hidden="true" />{' '}
      {t('attention.next', {
        code: blocked.code,
        title: work.title(application.kind, blocked),
        owner: owner(blocked.owner),
      })}
    </p>
  )
}
