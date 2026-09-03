import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { LedgerStatus } from '@demo/domain'
import { LEDGER_FLOW, ledgerTotals } from '@demo/domain'
import { ruFormat } from '@demo/i18n'
import { setLedgerStatus } from '@demo/mock'
import { Button, Callout, Card, Empty, Estimate, Metric, Money, PageHeader, StatusBadge, Table, ui } from '@demo/ui'
import { useCaseId } from '../CaseLayout'
import { LEDGER_ACTION_LABEL, LEDGER_STATUS_LABEL } from '../labels'
import { useLedger } from '../queries'

const nextLedgerStatus = (status: LedgerStatus): LedgerStatus | undefined => {
  const index = LEDGER_FLOW.indexOf(status)
  return index >= 0 && index < LEDGER_FLOW.length - 1 ? LEDGER_FLOW[index + 1] : undefined
}

export function LedgerPage() {
  const caseId = useCaseId()
  const queryClient = useQueryClient()
  const ledger = useLedger(caseId)

  const mutation = useMutation({
    mutationFn: ({ lineId, status }: { lineId: string; status: LedgerStatus }) =>
      setLedgerStatus(lineId, status, 'Финансы, ООО «Синоптикс РУ»'),
    onSuccess: () => queryClient.invalidateQueries(),
  })

  if (ledger.isLoading) return <Empty>Загружаем реестр счетов</Empty>

  const lines = ledger.data ?? []
  const totals = ledgerTotals(lines)

  return (
    <>
      <PageHeader
        title="Счета и платежи"
        lead="Оплата идёт по оригиналу счёта третьей стороны. Комиссия — отдельная строка: наценить чужой счёт структурно невозможно."
      />

      <div className={ui.grid3}>
        <Card>
          <Metric value={<Money value={ruFormat.money(totals.passThrough, 'RUB')} />} label="Третьим сторонам" />
        </Card>
        <Card soft>
          <Metric value={<Money value={ruFormat.money(totals.commission, 'RUB')} />} label="Комиссия платформы" />
        </Card>
        <Card>
          <span className={ui.muted}>Портал не кредитует клиента: платежи с нормативным дедлайном фондируются заранее.</span>
        </Card>
      </div>

      <Table head={['Дата', 'Получатель', 'Назначение', 'Документ', 'Сумма', 'Статус', 'Действие']}>
        {lines.map((line) => {
          const next = nextLedgerStatus(line.status)
          return (
            <tr key={line.id} className={line.type === 'commission' ? ui.rowCommission : undefined}>
              <td>{ruFormat.date(line.date)}</td>
              <td>{line.supplier.ru}</td>
              <td>
                {line.purpose.ru}
                {line.paymentDeadline ? <div className={ui.muted}>{line.paymentDeadline.ru}</div> : null}
              </td>
              <td>{line.original.ru}</td>
              <td className={ui.alignRight}>
                <Money value={ruFormat.money(line.amount, line.currency)} />
              </td>
              <td>
                <StatusBadge tone={line.type === 'commission' ? 'accent' : 'neutral'}>
                  {LEDGER_STATUS_LABEL[line.status]}
                </StatusBadge>
              </td>
              <td>
                {next ? (
                  <Button
                    variant="secondary"
                    disabled={mutation.isPending}
                    onClick={() => mutation.mutate({ lineId: line.id, status: next })}
                  >
                    {LEDGER_ACTION_LABEL[next]}
                  </Button>
                ) : (
                  <span className={ui.muted}>—</span>
                )}
              </td>
            </tr>
          )
        })}
      </Table>

      <Callout tone="quiet">
        Валюта фондирования и курс пересчёта определены договором. Курсовая разница не входит в комиссию и не является
        доходом платформы.
      </Callout>
      <Estimate>ориентир · 28.08.2026 · не оферта</Estimate>
    </>
  )
}
