import { useI18n } from '@demo/i18n'
import { demoLedger, paymentMeta, uppStages } from '../demo/catalog'
import { useDemo } from '../demo/context'
import {
  Button,
  Callout,
  Card,
  DemoMark,
  fill,
  KeyValue,
  Metric,
  Money,
  NextAction,
  PageHeader,
  StatusBadge,
  Table,
} from '../kit'
import { Shell } from '../Shell'

export function PaymentsPage() {
  const { t, text, date } = useI18n()
  const { state, patch } = useDemo()
  const lines = demoLedger()
  const meta = paymentMeta()
  const stages = uppStages()

  return (
    <Shell wide>
      <PageHeader title={t('pay.title')} lead={t('pay.lead')} />
      <DemoMark>{t('shell.demoMark')}</DemoMark>
      <div className="mb-3 flex flex-wrap gap-2">
        <StatusBadge tone="ok">{t('pay.reconciled')}</StatusBadge>
        <StatusBadge tone="ok">{t('pay.markup')}</StatusBadge>
        <StatusBadge tone={state.casePaused ? 'warm' : 'accent'}>
          {state.casePaused ? t('pay.pause') : t('pay.active')}
        </StatusBadge>
      </div>
      <NextAction label={t('shell.nextAction')}>{state.casePaused ? t('pay.resume') : t('pay.uppStages')}</NextAction>

      <div className="mb-4 grid gap-3 md:grid-cols-3">
        <Card>
          <Metric
            value={<Money value={`¥ ${meta.totalRmb.toLocaleString('zh-CN')}`} />}
            label={`${t('pay.invoice')} ${meta.invoice}`}
          />
        </Card>
        <Card>
          <KeyValue
            items={[
              { key: t('pay.fx'), value: meta.fx },
              { key: t('pay.fxSource'), value: text(meta.fxSource).value },
              { key: t('pay.fxDate'), value: date(`${meta.fxDate}T00:00:00`) },
            ]}
          />
        </Card>
        <Card>
          <p className="text-sm">{fill(t('pay.split'), { ours: meta.oursPercent, transit: meta.transitPercent })}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <StatusBadge tone="accent">{t('pay.ourServices')}</StatusBadge>
            <StatusBadge tone="quiet">{t('pay.thirdParty')}</StatusBadge>
          </div>
        </Card>
      </div>

      <Card>
        <Table
          head={[
            t('pay.invoice'),
            t('ledger.supplier'),
            t('ledger.purpose'),
            t('pay.rmb'),
            t('pay.receipt'),
            t('ledger.status'),
          ]}
        >
          {lines.map((line) => {
            const kind = line.id === 'pay-a' ? t('pay.typeA') : line.id === 'pay-b' ? t('pay.typeB') : t('pay.typeC')
            return (
              <tr key={line.id} className={line.type === 'commission' ? 'bg-primary/5' : undefined}>
                <td>
                  <StatusBadge tone={line.type === 'commission' ? 'accent' : 'quiet'}>{kind}</StatusBadge>
                </td>
                <td>{text(line.supplier).value}</td>
                <td className="text-sm">{text(line.purpose).value}</td>
                <td className="text-right tabular-nums">¥ {line.amount.toLocaleString('zh-CN')}</td>
                <td className="text-xs">{text(line.original).value}</td>
                <td>
                  <StatusBadge tone={line.status === 'paid' || line.status === 'closed' ? 'ok' : 'warm'}>
                    {t(`ledgerStatus.${line.status}`)}
                  </StatusBadge>
                </td>
              </tr>
            )
          })}
        </Table>
      </Card>

      <Card title={t('pay.uppStages')}>
        <ul className="space-y-2">
          {stages.map((stage) => (
            <li
              key={stage.key}
              className="flex flex-wrap items-start justify-between gap-2 rounded-md border px-3 py-2"
            >
              <div>
                <p className="text-sm font-medium">{text(stage.title).value}</p>
                <p className="text-xs text-muted-foreground">{text(stage.condition).value}</p>
              </div>
              <StatusBadge tone={stage.status === 'paid' ? 'ok' : 'warm'}>
                {stage.status === 'paid' ? t('ledgerStatus.paid') : t('ledgerStatus.accepted')}
              </StatusBadge>
            </li>
          ))}
        </ul>
      </Card>

      <Button type="button" variant="secondary" onClick={() => patch({ casePaused: !state.casePaused })}>
        {state.casePaused ? t('pay.resume') : t('pay.togglePause')}
      </Button>
      {state.casePaused ? <Callout tone="quiet">{t('pay.pause')}</Callout> : null}
    </Shell>
  )
}
