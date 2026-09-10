import { l10n } from '@demo/domain'
import { useI18n } from '@demo/i18n'
import { Card, Empty, PageHeader, StatusBadge, Timeline, TimelineItem } from '../kit'
import { useStatuses } from '../queries'
import { useCaseId } from '../workspace'

/**
 * Статусы вносит оператор российской компании и прикладывает артефакт.
 * Кабинет производителя читает их: писать статус здесь нечем и незачем.
 */
export function InboxPage() {
  const caseId = useCaseId()
  const { t, text, dateTime } = useI18n()
  const statuses = useStatuses(caseId)

  if (statuses.isLoading) return <Empty>{t('common.loading')}</Empty>

  const entries = statuses.data ?? []

  return (
    <>
      <PageHeader title={t('inbox.title')} lead={t('inbox.lead')} />

      <Card>
        {entries.length === 0 ? (
          <Empty>{t('inbox.empty')}</Empty>
        ) : (
          <Timeline>
            {entries.map((entry) => {
              const resolved = text(l10n(entry.text))
              return (
                <TimelineItem key={entry.id} date={dateTime(entry.enteredAt)}>
                  <span>{resolved.value}</span>
                  <div className="flex flex-wrap gap-2">
                    <StatusBadge tone="quiet">{t(`stage.${entry.stage}`)}</StatusBadge>
                    <StatusBadge>
                      {t('inbox.artifact')}: {entry.artifact}
                    </StatusBadge>
                    <StatusBadge tone="quiet">
                      {t('inbox.enteredBy')}: {entry.enteredBy}
                    </StatusBadge>
                    {!resolved.translated ? <StatusBadge tone="warm">{t('inbox.untranslated')}</StatusBadge> : null}
                  </div>
                </TimelineItem>
              )
            })}
          </Timeline>
        )}
      </Card>
    </>
  )
}
