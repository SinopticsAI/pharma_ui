import { useI18n } from '@demo/i18n'
import { automationRows } from '../demo/catalog'
import { useDemo } from '../demo/context'
import {
  ActorBadge,
  Benefit,
  Button,
  Callout,
  Card,
  DemoMark,
  fill,
  NextAction,
  PageHeader,
  StatusBadge,
  Table,
} from '../kit'
import { Shell } from '../Shell'

export function AutomationPage() {
  const { t, text, dateTime } = useI18n()
  const { state, patch } = useDemo()
  const rows = automationRows()
  const waiting = rows.filter((row) => row.status === 'draft' || row.status === 'waiting').length

  const confirmed = (key: 'logistics' | 'lab' | 'rzn' | undefined) => {
    if (key === 'logistics') return state.logisticsConfirmed
    if (key === 'lab') return state.labLetterApproved
    if (key === 'rzn') return state.rznDraftReviewed
    return false
  }

  return (
    <Shell wide>
      <PageHeader
        eyebrow={t('eyebrow.auto')}
        title={t('auto.title')}
        lead={fill(t('auto.lead'), { code: '#RU-0417' })}
      />
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <ActorBadge actor="us">{t('nodeOwner.us')}</ActorBadge>
        <ActorBadge actor="agent">{t('classify.draft')}</ActorBadge>
        <StatusBadge tone="warm">{fill(t('auto.waiting'), { n: waiting })}</StatusBadge>
      </div>
      <DemoMark>{t('shell.demoMark')}</DemoMark>
      <NextAction label={t('shell.nextAction')}>{text(rows[0].result).value}</NextAction>

      <Callout tone="deadline">
        <strong>{t('auto.limits')}</strong>
        <ul className="mt-2 list-disc pl-4">
          <li>{t('auto.noGov')}</li>
          <li>{t('auto.noSign')}</li>
          <li>{t('auto.noSpend')}</li>
          <li>{t('auto.noClass')}</li>
          <li>{t('auto.auditAll')}</li>
        </ul>
      </Callout>

      <Card>
        <Table
          head={[
            t('auto.action'),
            t('auto.result'),
            t('auto.status'),
            t('auto.time'),
            t('auto.confirmBy'),
            t('auto.audit'),
            t('auto.model'),
            '',
          ]}
        >
          {rows.map((row) => {
            const done = confirmed(row.confirmKey)
            return (
              <tr key={row.id}>
                <td>
                  {text(row.action).value}
                  <div className="text-xs text-muted-foreground">{t('auto.draft')}</div>
                </td>
                <td className="text-sm">{text(row.result).value}</td>
                <td>
                  <StatusBadge
                    tone={done || row.status === 'done' ? 'ok' : row.status === 'active' ? 'accent' : 'warm'}
                  >
                    {done ? t('auto.confirmed') : row.status}
                  </StatusBadge>
                </td>
                <td className="whitespace-nowrap text-xs">{dateTime(row.at)}</td>
                <td className="text-sm">{text(row.confirmBy).value}</td>
                <td className="font-mono text-xs">{row.audit}</td>
                <td className="font-mono text-xs">{row.model}</td>
                <td>
                  {row.confirmKey ? (
                    <Button
                      type="button"
                      disabled={done}
                      onClick={() => {
                        if (row.confirmKey === 'logistics') patch({ logisticsConfirmed: true })
                        if (row.confirmKey === 'lab') patch({ labLetterApproved: true })
                        if (row.confirmKey === 'rzn') patch({ rznDraftReviewed: true })
                      }}
                    >
                      {done ? t('auto.confirmed') : t('auto.confirm')}
                    </Button>
                  ) : null}
                </td>
              </tr>
            )
          })}
        </Table>
      </Card>
      <Benefit label={t('benefit.label')}>{t('benefit.auto')}</Benefit>
    </Shell>
  )
}
