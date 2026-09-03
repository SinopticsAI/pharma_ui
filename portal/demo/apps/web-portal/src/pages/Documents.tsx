import { Link } from '@tanstack/react-router'
import { usePortalStore } from '../data/store'
import { Card, Empty, PageHeader } from '../components/Ui'
import { useI18n } from '../i18n'
import styles from '../styles/ui.module.css'

/** Документы кабинета — это слоты чеклистов внутри работ, а не отдельный архив. */
export function DocumentsPage() {
  const { applications } = usePortalStore()
  const { t, owner, date, work } = useI18n()

  const rows = applications.flatMap((item) =>
    item.works.flatMap((itemWork) =>
      itemWork.slots.map((slot) => ({
        id: `${item.id}-${itemWork.code}-${slot.id}`,
        applicationId: item.id,
        number: item.number,
        kind: item.kind,
        workCode: itemWork.code,
        workTitle: work.title(item.kind, itemWork),
        title: work.slotTitle(item.kind, itemWork, slot.id, slot.title),
        preparedBy: slot.preparedBy,
        needs: [
          slot.needsNotary ? t('legal.notary') : null,
          slot.needsApostille ? t('legal.apostille') : null,
          slot.needsTranslation ? t('legal.translation') : null,
          slot.optional ? t('legal.optional') : null,
        ].filter(Boolean) as string[],
        file: slot.files.at(-1),
      })),
    ),
  )

  return (
    <>
      <PageHeader title={t('documents.title')} subtitle={t('documents.subtitle')} />
      <Card>
        {rows.length === 0 ? (
          <Empty>{t('documents.empty')}</Empty>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>{t('documents.col.doc')}</th>
                  <th>{t('documents.col.case')}</th>
                  <th>{t('documents.col.owner')}</th>
                  <th>{t('documents.col.legal')}</th>
                  <th>{t('documents.col.status')}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} style={{ cursor: 'default' }}>
                    <td>{row.title}</td>
                    <td>
                      <Link
                        to="/applications/$applicationId/works/$workCode"
                        params={{ applicationId: row.applicationId, workCode: row.workCode }}
                      >
                        {row.number} · {row.workCode}
                      </Link>
                      <div className={styles.formHint}>{row.workTitle}</div>
                    </td>
                    <td>{owner(row.preparedBy)}</td>
                    <td>{row.needs.length > 0 ? row.needs.join(', ') : t('common.dash')}</td>
                    <td>
                      {row.file ? (
                        <>
                          {row.file.name}
                          <div className={styles.formHint}>{t('documents.uploaded', { date: date(row.file.at) })}</div>
                        </>
                      ) : (
                        t('documents.awaiting')
                      )}
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
