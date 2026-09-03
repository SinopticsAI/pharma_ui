import { useI18n } from '@demo/i18n'
import { Callout, Card, Empty, PageHeader } from '@demo/ui'

/**
 * Реестра счетов в API кабинета пока нет. Показать здесь сид означало бы
 * выдать вымысел за состояние кейса, поэтому экран честно пустой.
 */
export function LedgerPage() {
  const { t } = useI18n()

  return (
    <>
      <PageHeader title={t('channel.ledgerTitle')} />
      <Card>
        <Empty>{t('channel.ledgerLead')}</Empty>
      </Card>
      <Callout tone="quiet">{t('ledger.lead')}</Callout>
    </>
  )
}
