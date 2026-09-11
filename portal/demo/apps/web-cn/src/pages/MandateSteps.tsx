import type { MandateStep } from '@demo/domain'
import { l10n } from '@demo/domain'
import { useI18n } from '@demo/i18n'
import { StatusBadge, Table } from '../kit'

export const DEFAULT_MANDATE_STEPS: MandateStep[] = [
  { key: 'service-contract', status: 'pending' },
  { key: 'power-of-attorney', status: 'pending' },
  { key: 'apostille', status: 'pending' },
  { key: 'notarized-translation', status: 'pending' },
  { key: 'representative-registered', status: 'pending' },
]

export function MandateStepsTable({ steps }: { steps?: MandateStep[] }) {
  const { t, text, date } = useI18n()
  const rows = steps && steps.length > 0 ? steps : DEFAULT_MANDATE_STEPS

  return (
    <Table head={['', t('ledger.status'), t('dossier.date'), '']}>
      {rows.map((step) => (
        <tr key={step.key}>
          <td>{t(`mandate.step.${step.key}`)}</td>
          <td>
            <StatusBadge tone={step.status === 'done' ? 'accent' : step.status === 'in-progress' ? 'warm' : 'quiet'}>
              {t(`mandateStatus.${step.status}`)}
            </StatusBadge>
          </td>
          <td>{step.date ? date(step.date) : '—'}</td>
          <td>{step.note ? text(l10n(step.note)).value : ''}</td>
        </tr>
      ))}
    </Table>
  )
}
