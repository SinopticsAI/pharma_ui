import { useI18n } from '@demo/i18n'
import { Callout, Card, Empty, KeyValue, PageHeader, StatusBadge, Table } from '@demo/ui'
import { useCaseId } from '../CaseLayout'
import { useMandateSteps } from '../queries'

export function MandatePage() {
  const caseId = useCaseId()
  const { t, text, date } = useI18n()
  const mandate = useMandateSteps(caseId)

  if (mandate.isLoading || !mandate.data) return <Empty>{t('common.loading')}</Empty>

  return (
    <>
      <PageHeader title={t('mandate.title')} lead={t('mandate.lead')} />

      <Card>
        <KeyValue
          items={[
            { key: t('mandate.operator'), value: mandate.data.operator },
            { key: t('case.track'), value: t(`mandate.role.${mandate.data.role}`) },
          ]}
        />
        <Table head={['', t('ledger.status'), t('dossier.date'), '']}>
          {mandate.data.steps.map((step) => (
            <tr key={step.key}>
              <td>{t(`mandate.step.${step.key}`)}</td>
              <td>
                <StatusBadge tone={step.status === 'done' ? 'accent' : step.status === 'in-progress' ? 'warm' : 'quiet'}>
                  {t(`mandateStatus.${step.status}`)}
                </StatusBadge>
              </td>
              <td>{step.date ? date(step.date) : '—'}</td>
              <td>{step.note ? text(step.note).value : ''}</td>
            </tr>
          ))}
        </Table>
      </Card>

      <Callout>{t('mandate.noCrypto')}</Callout>
    </>
  )
}
