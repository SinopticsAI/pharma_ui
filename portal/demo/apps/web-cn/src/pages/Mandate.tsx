import { hasCredentials, l10n } from '@demo/domain'
import { useI18n } from '@demo/i18n'
import { Callout, Card, Empty, KeyValue, PageHeader, StatusBadge, Table } from '../kit'
import { useCase } from '../queries'
import { useCaseId } from '../workspace'

/**
 * Кабинет производителя получает только шаги мандата. Реквизиты ЕСИА, УКЭП и
 * МЧД ядро не присылает в контуре `cn` — не скрывает их здесь, а не отдаёт.
 */
export function MandatePage() {
  const caseId = useCaseId()
  const { t, text, date } = useI18n()
  const caseQuery = useCase(caseId)

  const mandate = caseQuery.data?.mandate
  if (caseQuery.isLoading) return <Empty>{t('common.loading')}</Empty>
  if (!mandate) return <Empty>{t('common.none')}</Empty>

  return (
    <>
      <PageHeader title={t('mandate.title')} lead={t('mandate.lead')} />

      <Card>
        <KeyValue
          items={[
            { key: t('mandate.operator'), value: mandate.operator || '—' },
            { key: t('case.track'), value: t(`mandate.role.${mandate.role}`) },
          ]}
        />
        <Table head={['', t('ledger.status'), t('dossier.date'), '']}>
          {mandate.steps.map((step) => (
            <tr key={step.key}>
              <td>{t(`mandate.step.${step.key}`)}</td>
              <td>
                <StatusBadge
                  tone={step.status === 'done' ? 'accent' : step.status === 'in-progress' ? 'warm' : 'quiet'}
                >
                  {t(`mandateStatus.${step.status}`)}
                </StatusBadge>
              </td>
              <td>{step.date ? date(step.date) : '—'}</td>
              <td>{step.note ? text(l10n(step.note)).value : ''}</td>
            </tr>
          ))}
        </Table>
      </Card>

      {hasCredentials(mandate) ? null : <Callout>{t('mandate.noCrypto')}</Callout>}
    </>
  )
}
