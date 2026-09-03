import { useSearch } from '@tanstack/react-router'
import { describeError } from '@demo/api-client'
import { Callout, Empty, PageHeader } from '../components/Ui'
import { ApplicationsTable } from '../components/ApplicationsTable'
import { useCases } from '../data/portal'
import { useI18n } from '../i18n'

export function ApplicationsPage() {
  const cases = useCases()
  const { q } = useSearch({ from: '/applications' })
  const { t } = useI18n()

  return (
    <>
      <PageHeader title={t('applications.title')} subtitle={t('applications.subtitle')} />
      {cases.isError ? <Callout tone="warn">{describeError(cases.error)}</Callout> : null}
      {cases.isLoading ? <Empty>{t('session.loading')}</Empty> : null}
      {!cases.isLoading && (cases.data ?? []).length === 0 ? <Empty>{t('cases.empty')}</Empty> : null}
      <ApplicationsTable applications={cases.data ?? []} initialQuery={q ?? ''} />
    </>
  )
}
