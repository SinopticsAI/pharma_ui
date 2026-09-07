import { ledgerTotals } from '@demo/domain'
import { useI18n } from '@demo/i18n'
import { useCaseId } from '../CaseLayout'
import { Callout, Card, Empty, Estimate, Metric, Money, PageHeader, StatusBadge, Table } from '../kit'
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

      <div className="mb-4 grid gap-4 md:grid-cols-3">
        <Card>
          <Metric value={<Money value={money(totals.passThrough, 'RUB')} />} label={t('ledger.totalThird')} />
        </Card>
        <Card>
          <Metric value={<Money value={money(totals.commission, 'RUB')} />} label={t('ledger.totalCommission')} />
        </Card>
        <Card>
          <p className="text-sm text-muted-foreground">{t('ledger.legend')}</p>
          <div className="flex flex-wrap gap-2">
            <StatusBadge tone="quiet">{t('ledger.passThrough')}</StatusBadge>
            <StatusBadge tone="accent">{t('ledger.commission')}</StatusBadge>
          </div>
        </Card>
      </div>

      {lines.length === 0 ? (
        <Empty>{t('ledger.empty')}</Empty>
      ) : (
        <Card>
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
              <tr key={line.id} className={line.type === 'commission' ? 'bg-accent/15' : undefined}>
                <td>{date(line.date)}</td>
                <td>{text(line.supplier).value}</td>
                <td>
                  {text(line.purpose).value}
                  {line.paymentDeadline ? (
                    <div className="text-xs text-muted-foreground">
                      {t('ledger.deadline')}: {text(line.paymentDeadline).value}
                    </div>
                  ) : null}
                </td>
                <td>{text(line.original).value}</td>
                <td className="text-right">
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
        </Card>
      )}

      <Callout tone="quiet">{t('ledger.fx')}</Callout>
      <Estimate>{t('common.estimate')}</Estimate>
    </>
  )
}
