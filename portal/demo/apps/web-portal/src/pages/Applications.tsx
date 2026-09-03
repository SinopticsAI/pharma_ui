import { useSearch } from '@tanstack/react-router'
import { Plus } from 'lucide-react'
import { Button, PageHeader } from '../components/Ui'
import { ApplicationsTable } from '../components/ApplicationsTable'
import { useShellUi } from '../components/shell-ui'
import { usePortalStore } from '../data/store'
import { useI18n } from '../i18n'

export function ApplicationsPage() {
  const { applications } = usePortalStore()
  const { openCreate } = useShellUi()
  const { q } = useSearch({ from: '/applications' })
  const { t } = useI18n()

  return (
    <>
      <PageHeader
        title={t('applications.title')}
        subtitle={t('applications.subtitle')}
        action={
          <Button type="button" onClick={openCreate}>
            <Plus size={16} strokeWidth={1.75} aria-hidden="true" />
            {t('overview.create')}
          </Button>
        }
      />
      <ApplicationsTable applications={applications} initialQuery={q ?? ''} />
    </>
  )
}
