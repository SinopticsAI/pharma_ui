import { Link } from '@tanstack/react-router'
import { usePortalStore } from '../data/store'
import { openWorks } from '../data/derive'
import { Card, Empty, PageHeader, WorkStatusBadge } from '../components/Ui'
import { useI18n } from '../i18n'
import styles from '../styles/ui.module.css'

/** Задачи — это открытые работы по всем кейсам, а не отдельный список поручений. */
export function TasksPage() {
  const { applications } = usePortalStore()
  const { t, owner, date, due, work, product, text } = useI18n()

  const rows = applications
    .flatMap((item) => openWorks(item).map((itemWork) => ({ item, work: itemWork })))
    .sort((a, b) => a.item.nextDue.localeCompare(b.item.nextDue))

  return (
    <>
      <PageHeader title={t('tasks.title')} subtitle={t('tasks.subtitle')} />
      <Card>
        {rows.length === 0 ? (
          <Empty>{t('tasks.empty')}</Empty>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>{t('tasks.col.work')}</th>
                  <th>{t('tasks.col.case')}</th>
                  <th>{t('tasks.col.owner')}</th>
                  <th>{t('tasks.col.due')}</th>
                  <th>{t('tasks.col.status')}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ item, work: itemWork }) => (
                  <tr key={`${item.id}-${itemWork.code}`} style={{ cursor: 'default' }}>
                    <td>
                      <Link
                        to="/applications/$applicationId/works/$workCode"
                        params={{ applicationId: item.id, workCode: itemWork.code }}
                      >
                        {itemWork.code}. {work.title(item.kind, itemWork)}
                      </Link>
                      <div className={styles.formHint}>
                        {itemWork.remark ? text(itemWork.remark) : work.summary(item.kind, itemWork)}
                      </div>
                    </td>
                    <td>
                      {item.number}
                      <div className={styles.formHint}>{product(item.product)}</div>
                    </td>
                    <td>{owner(itemWork.owner)}</td>
                    <td>
                      {date(item.nextDue)}
                      <div className={styles.formHint}>{due(item.nextDue)}</div>
                    </td>
                    <td>
                      <WorkStatusBadge status={itemWork.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  )
}
