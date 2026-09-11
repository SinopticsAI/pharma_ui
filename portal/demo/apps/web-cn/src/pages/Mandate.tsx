import { hasCredentials } from '@demo/domain'
import { useI18n } from '@demo/i18n'
import { Callout, Card, Empty, KeyValue, PageHeader } from '../kit'
import { useCase } from '../queries'
import { useCaseId } from '../workspace'
import { MandateStepsTable } from './MandateSteps'

/**
 * Кабинет производителя получает только шаги мандата. Реквизиты ЕСИА, УКЭП и
 * МЧД ядро не присылает в контуре `cn` — не скрывает их здесь, а не отдаёт.
 */
export function MandatePage() {
  const caseId = useCaseId()
  const { t } = useI18n()
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
        <MandateStepsTable steps={mandate.steps} />
      </Card>

      {hasCredentials(mandate) ? null : <Callout>{t('mandate.noCrypto')}</Callout>}
    </>
  )
}
