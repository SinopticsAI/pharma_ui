import { useI18n } from '@demo/i18n'
import { Card, Callout, Empty, PageHeader, StatusBadge, Table, ui } from '@demo/ui'
import { useCaseId } from '../CaseLayout'
import { useDocuments } from '../queries'

export function DossierPage() {
  const caseId = useCaseId()
  const { t, text, date } = useI18n()
  const documents = useDocuments(caseId)

  if (documents.isLoading) return <Empty>{t('common.loading')}</Empty>

  return (
    <>
      <PageHeader title={t('dossier.title')} lead={t('dossier.lead')} />

      {(documents.data ?? []).map((document) => {
        const lastVersion = document.versions.at(-1)
        return (
          <Card key={document.id} title={text(document.title).value}>
            <div className={ui.row}>
              <StatusBadge tone="quiet">
                {t('dossier.preparedBy')}: {t(`actor.${document.preparedBy}`)}
              </StatusBadge>
              {document.needsTranslation ? <StatusBadge>{t('dossier.needsTranslation')}</StatusBadge> : null}
              {document.needsApostille ? <StatusBadge>{t('dossier.needsApostille')}</StatusBadge> : null}
            </div>

            {document.versions.length === 0 ? (
              <Callout tone="deadline">
                {t('dossier.awaiting')}
                {document.awaitingFrom ? `: ${text(document.awaitingFrom).value}` : ''}
              </Callout>
            ) : (
              <Table head={[t('dossier.version'), t('dossier.author'), t('dossier.date'), '', '']}>
                {document.versions.map((version) => (
                  <tr key={version.version}>
                    <td>v{version.version}</td>
                    <td>{version.author}</td>
                    <td>{date(version.date)}</td>
                    <td>{version.fileName}</td>
                    <td>
                      {version.submitted ? (
                        <StatusBadge tone="accent">{t('dossier.submitted')}</StatusBadge>
                      ) : version.version === lastVersion?.version ? (
                        <StatusBadge tone="quiet">{t('dossier.current')}</StatusBadge>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </Table>
            )}
          </Card>
        )
      })}
    </>
  )
}
