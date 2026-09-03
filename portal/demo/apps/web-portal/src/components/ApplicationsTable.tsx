import { useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import type { AppStatus, Application } from '../data/types'
import { caseStatus } from '../data/derive'
import { currentWork } from '../data/work'
import { Empty, StatusBadge } from './Ui'
import { useI18n } from '../i18n'
import styles from '../styles/ui.module.css'

export function ApplicationsTable({
  applications,
  initialQuery = '',
}: {
  applications: Application[]
  initialQuery?: string
}) {
  const navigate = useNavigate()
  const { t, procedure, kindShort, product, form, work, dateTime } = useI18n()
  const [status, setStatus] = useState<'all' | AppStatus>('all')
  const [query, setQuery] = useState(initialQuery)

  const filters: { id: 'all' | AppStatus; label: string }[] = [
    { id: 'all', label: t('applications.filterAll') },
    { id: 'action_required', label: t('status.action_required') },
    { id: 'in_review', label: t('status.in_review') },
    { id: 'remarks', label: t('status.remarks') },
    { id: 'approved', label: t('status.approved') },
    { id: 'draft', label: t('status.draft') },
  ]

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return applications
      .map((item) => {
        const current = currentWork(item.works)
        const nextStep = current ? `${current.code}. ${work.title(item.kind, current)}` : t('featured.allClosed')
        return { item, status: caseStatus(item), nextStep }
      })
      .filter(({ item, status: itemStatus, nextStep }) => {
        if (status !== 'all' && itemStatus !== status) return false
        if (!q) return true
        return [item.number, product(item.product), item.product, procedure(item.procedure), item.manufacturer, nextStep]
          .join(' ')
          .toLowerCase()
          .includes(q)
      })
  }, [applications, status, query, procedure, product, work, t])

  const open = (id: string) => void navigate({ to: '/applications/$applicationId', params: { applicationId: id } })

  return (
    <div>
      <div className={styles.toolbar} role="toolbar" aria-label={t('applications.filters')}>
        {filters.map((filter) => (
          <button
            key={filter.id}
            type="button"
            className={`${styles.chip} ${status === filter.id ? styles.chipActive : ''}`}
            aria-pressed={status === filter.id}
            onClick={() => setStatus(filter.id)}
          >
            {filter.label}
          </button>
        ))}
        <input
          className={styles.filterSearch}
          type="search"
          placeholder={t('applications.search')}
          aria-label={t('applications.searchAria')}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>

      <div className={styles.tableWrap}>
        {rows.length === 0 ? (
          <Empty>{t('applications.empty')}</Empty>
        ) : (
          <>
            <table className={`${styles.table} ${styles.tableInteractive}`}>
              <thead>
                <tr>
                  <th>{t('applications.col.number')}</th>
                  <th>{t('applications.col.product')}</th>
                  <th>{t('applications.col.procedure')}</th>
                  <th>{t('applications.col.status')}</th>
                  <th>{t('applications.col.next')}</th>
                  <th>{t('applications.col.updated')}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ item, status: itemStatus, nextStep }) => (
                  <tr
                    key={item.id}
                    tabIndex={0}
                    onClick={() => open(item.id)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        open(item.id)
                      }
                    }}
                  >
                    <td className={styles.number}>{item.number}</td>
                    <td>
                      <span className={styles.productCell}>
                        <span>{product(item.product)}</span>
                        <span className={styles.formHint}>
                          {kindShort(item.kind)} · {item.form ? form(item.form) : t('common.unspecified')}
                        </span>
                      </span>
                    </td>
                    <td>{procedure(item.procedure)}</td>
                    <td>
                      <StatusBadge status={itemStatus} />
                    </td>
                    <td>{nextStep}</td>
                    <td>{dateTime(item.updatedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.map(({ item, status: itemStatus, nextStep }) => (
              <a
                key={`${item.id}-card`}
                className={styles.rowCard}
                href={`/applications/${item.id}`}
                onClick={(event) => {
                  event.preventDefault()
                  open(item.id)
                }}
              >
                <strong>{item.number}</strong>
                <span>{product(item.product)}</span>
                <StatusBadge status={itemStatus} />
                <span className={styles.formHint}>{nextStep}</span>
              </a>
            ))}
          </>
        )}
      </div>
    </div>
  )
}
