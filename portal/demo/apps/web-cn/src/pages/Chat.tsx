import { useI18n } from '@demo/i18n'
import { Link } from '@tanstack/react-router'
import { Card, ChatBubble, Empty, PageHeader, StatusBadge } from '../kit'
import { useCase, useChat, useIntakeMessages } from '../queries'
import { useCaseId } from '../workspace'
import { caseChatToThread, intakeToThread } from './case-thread'

export function ChatPage() {
  const caseId = useCaseId()
  const { t, text, dateTime, locale } = useI18n()
  const caseQuery = useCase(caseId)
  const chat = useChat(caseId)
  const card = caseQuery.data?.case
  const intake = useIntakeMessages(card?.intakeSessionId ?? '')

  if (
    chat.isLoading ||
    caseQuery.isLoading ||
    (Boolean(card?.intakeSessionId) && intake.isLoading && !(chat.data ?? []).length)
  ) {
    return <Empty>{t('common.loading')}</Empty>
  }

  const caseItems = caseChatToThread(chat.data ?? [], text, (side) => t(side === 'cn' ? 'chat.cn' : 'chat.ru'))
  const items =
    caseItems.length > 0
      ? caseItems
      : intakeToThread(intake.data ?? [], locale, { cn: t('chat.cn'), agent: t('chat.agent') })

  const intakeHref =
    card?.intakeSessionId && card.productId
      ? {
          to: '/intake/product/$productId' as const,
          params: { productId: card.productId },
          search: { session: card.intakeSessionId },
        }
      : card?.intakeSessionId && card.organizationId
        ? {
            to: '/intake/company/$organizationId' as const,
            params: { organizationId: card.organizationId },
            search: { session: card.intakeSessionId },
          }
        : null

  return (
    <>
      <PageHeader title={t('chat.title')} lead={t('chat.lead')} />

      {caseItems.length === 0 && items.length > 0 ? (
        <p className="mb-3 text-sm text-muted-foreground">{t('chat.intakeNote')}</p>
      ) : null}

      <Card>
        {items.length === 0 ? (
          <Empty>{t('chat.empty')}</Empty>
        ) : (
          <div className="space-y-3">
            {items.map((message) => (
              <ChatBubble key={message.id} side={message.side} author={message.author} time={dateTime(message.at)}>
                {message.body}
                {message.untranslated ? (
                  <>
                    {' '}
                    <StatusBadge tone="warm">{t('inbox.untranslated')}</StatusBadge>
                  </>
                ) : null}
              </ChatBubble>
            ))}
          </div>
        )}
      </Card>

      {intakeHref ? (
        <Link to={intakeHref.to} params={intakeHref.params} search={intakeHref.search}>
          {t('chat.openIntake')} →
        </Link>
      ) : null}
    </>
  )
}
