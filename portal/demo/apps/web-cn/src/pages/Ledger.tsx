import { ledgerTotals } from '@demo/domain'
import { useI18n } from '@demo/i18n'
import { Callout, Card, Empty, Estimate, Metric, Money, PageHeader, StatusBadge, Table, ui } from '@demo/ui'
import { useCaseId } from '../CaseLayout'
import { useLedger } from '../queries'

export function LedgerPage() {
  const caseId = useCaseId()
  const { t, text, money, date } = useI18n()
  const ledger = useLedger(caseId)

  if (ledger.isLoading) return <Empty>{t('common.loading')}</Empty>

  const lines = ledger.data ?? []
  const totals = ledgerTotals(lines)

  return (
    <>
      <PageHeader title={t('ledger.title')} lead={t('ledger.lead')} />

      <div className={ui.grid3}>
        <Card>
          <Metric value={<Money value={money(totals.passThrough, 'RUB')} />} label={t('ledger.totalThird')} />
        </Card>
        <Card soft>
          <Metric value={<Money value={money(totals.commission, 'RUB')} />} label={t('ledger.totalCommission')} />
        </Card>
        <Card>
          <span className={ui.muted}>{t('ledger.legend')}</span>
          <div className={ui.row}>
            <StatusBadge tone="quiet">{t('ledger.passThrough')}</StatusBadge>
            <StatusBadge tone="accent">{t('ledger.commission')}</StatusBadge>
          </div>
        </Card>
      </div>

      <Table
        head={[
          t('ledger.date'),
          t('ledger.supplier'),
          t('ledger.purpose'),
          t('ledger.original'),
          t('ledger.amount'),
          t('ledger.status'),
        ]}
      >
        {lines.map((line) => (
          <tr key={line.id} className={line.type === 'commission' ? ui.rowCommission : undefined}>
            <td>{date(line.date)}</td>
            <td>{text(line.supplier).value}</td>
            <td>
              {text(line.purpose).value}
              {line.paymentDeadline ? (
                <div className={ui.muted}>
                  {t('ledger.deadline')}: {text(line.paymentDeadline).value}
                </div>
              ) : null}
            </td>
            <td>{text(line.original).value}</td>
            <td className={ui.alignRight}>
              <Money value={money(line.amount, line.currency)} />
            </td>
            <td>
              <StatusBadge tone={line.type === 'commission' ? 'accent' : 'neutral'}>
                {t(`ledgerStatus.${line.status}`)}
              </StatusBadge>
            </td>
          </tr>
        ))}
      </Table>

      <Callout tone="quiet">{t('ledger.fx')}</Callout>
      <Estimate>{t('common.estimate')}</Estimate>
    </>
  )
}
