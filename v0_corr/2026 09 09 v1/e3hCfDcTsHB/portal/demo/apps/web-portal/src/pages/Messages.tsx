import { Card, Empty, PageHeader } from '../components/Ui'
import { useI18n } from '../i18n'

/** Переписки по кейсу в API кабинета пока нет: маршрута для неё не существует. */
export function MessagesPage() {
  const { t } = useI18n()

  return (
    <>
      <PageHeader title={t('messages.title')} subtitle={t('messages.subtitle')} />
      <Card>
        <Empty>{t('messages.empty')}</Empty>
      </Card>
    </>
  )
}
