import { Card, Empty, PageHeader } from '../components/Ui'
import { useI18n } from '../i18n'

/**
 * Реестровых записей ядро кабинета пока не отдаёт. Показывать здесь выданные
 * удостоверения по условным данным нельзя: продукт не считается одобренным,
 * пока записи нет в государственном реестре.
 */
export function CertificatesPage() {
  const { t } = useI18n()

  return (
    <>
      <PageHeader title={t('certificates.title')} subtitle={t('certificates.subtitle')} />
      <Card>
        <Empty>{t('certificates.empty')}</Empty>
      </Card>
    </>
  )
}
