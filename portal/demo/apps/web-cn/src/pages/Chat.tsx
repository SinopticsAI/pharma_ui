import { useI18n } from '@demo/i18n'
import { Card, Empty, PageHeader } from '../kit'

/** Переписки по кейсу ядро пока не отдаёт: диалог интейка живёт отдельно. */
export function ChatPage() {
  const { t } = useI18n()

  return (
    <>
      <PageHeader title={t('channel.chatTitle')} />
      <Card>
        <Empty>{t('channel.chatLead')}</Empty>
      </Card>
    </>
  )
}
