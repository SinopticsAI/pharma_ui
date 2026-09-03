import { useQueries } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { useApi } from '@demo/api-client'
import type { CaseItem } from '@demo/domain'
import { l10n } from '@demo/domain'
import { useCases } from '../data/portal'
import { Card, Empty, PageHeader } from '../components/Ui'
import { useI18n } from '../i18n'
import styles from '../styles/ui.module.css'

/** Документы кабинета — досье кейсов. Отдельного архива в ядре нет. */
export function DocumentsPage() {
  const api = useApi()
  const cases = useCases()
  const applications = cases.data ?? []
  const { t } = useI18n()

  const itemQueries = useQueries({
    queries: applications.map((item) => ({
      queryKey: ['case-items', item.id],
      queryFn: () => api.listCaseItems(item.id),
    })),
  })

  const rows = applications.flatMap((item, index) => {
    const items: CaseItem[] = itemQueries[index]?.data ?? []
    return items.map((entry) => ({
      id: entry.id,
      applicationId: item.id,
      number: item.number,
      title: l10n(entry.title, entry.fileName).ru,
      itemType: entry.itemType,
      fileName: entry.fileName,
      status: entry.status,
    }))
  })

  const loading = cases.isLoading || itemQueries.some((query) => query.isLoading)

  return (
    <>
      <PageHeader title={t('documents.title')} subtitle={t('documents.subtitle')} />
      <Card>
        {loading ? <Empty>{t('session.loading')}</Empty> : null}
        {!loading && rows.length === 0 ? <Empty>{t('documents.empty')}</Empty> : null}
        {rows.length > 0 ? (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>{t('documents.col.doc')}</th>
                  <th>{t('documents.col.case')}</th>
                  <th>{t('documents.col.type')}</th>
                  <th>{t('documents.col.status')}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} style={{ cursor: 'default' }}>
                    <td>
                      {row.title}
                      <div className={styles.formHint}>{row.fileName}</div>
                    </td>
                    <td>
                      <Link to="/applications/$applicationId" params={{ applicationId: row.applicationId }}>
                        {row.number}
                      </Link>
                    </td>
                    <td>{row.itemType}</td>
                    <td>{t(`documents.itemStatus.${row.status}`)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </Card>
    </>
  )
}
