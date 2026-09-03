import { CERTIFICATES } from '../data/seed'
import { Card, PageHeader } from '../components/Ui'
import { useI18n } from '../i18n'
import styles from '../styles/ui.module.css'

export function CertificatesPage() {
  const { t, date, product, certStatus } = useI18n()

  return (
    <>
      <PageHeader title={t('certificates.title')} subtitle={t('certificates.subtitle')} />
      <Card>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>{t('certificates.col.number')}</th>
                <th>{t('certificates.col.product')}</th>
                <th>{t('certificates.col.registry')}</th>
                <th>{t('certificates.col.issued')}</th>
                <th>{t('certificates.col.valid')}</th>
                <th>{t('certificates.col.status')}</th>
              </tr>
            </thead>
            <tbody>
              {CERTIFICATES.map((item) => (
                <tr key={item.id} style={{ cursor: 'default' }}>
                  <td className={styles.number}>{item.number === 'ожидает записи' ? t('certStatus.ожидает записи') : item.number}</td>
                  <td>{product(item.product)}</td>
                  <td>{item.registry}</td>
                  <td>{date(item.issuedOn)}</td>
                  <td>{date(item.validUntil)}</td>
                  <td>{certStatus(item.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  )
}
