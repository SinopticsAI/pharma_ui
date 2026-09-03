import { useI18n } from '@demo/i18n'
import { Card, ChatBubble, Empty, PageHeader, StatusBadge, ui } from '@demo/ui'
import { useCaseId } from '../CaseLayout'
import { useChat } from '../queries'

export function ChatPage() {
  const caseId = useCaseId()
  const { t, text, dateTime } = useI18n()
  const chat = useChat(caseId)

  if (chat.isLoading) return <Empty>{t('common.loading')}</Empty>

  return (
    <>
      <PageHeader title={t('chat.title')} lead={t('chat.lead')} />

      <Card>
        <div className={ui.stack}>
          {(chat.data ?? []).map((message) => {
            const resolved = text(message.text)
            return (
              <ChatBubble
                key={message.id}
                side={message.side}
                author={`${message.author} · ${message.side === 'cn' ? t('chat.cn') : t('chat.ru')}`}
                time={dateTime(message.at)}
              >
                {resolved.value}
                {!resolved.translated ? (
                  <>
                    {' '}
                    <StatusBadge tone="warm">{t('inbox.untranslated')}</StatusBadge>
                  </>
                ) : null}
              </ChatBubble>
            )
          })}
        </div>
      </Card>
    </>
  )
}
