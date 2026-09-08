import { useI18n } from '@demo/i18n'
import { Link } from '@tanstack/react-router'
import { demoChat } from '../demo/catalog'
import { DEMO_CASE_RU0417, DEMO_ORG_MINGHU, DEMO_PRODUCT_MH200 } from '../demo/ids'
import { Card, ChatBubble, DemoMark, Empty, PageHeader } from '../kit'
import { Shell } from '../Shell'

export function MessagesPage() {
  const { t, text, dateTime } = useI18n()
  const items = demoChat()

  return (
    <Shell>
      <PageHeader title={t('msg.title')} lead={t('msg.lead')} />
      <DemoMark>{t('shell.demoMark')}</DemoMark>
      <Card>
        {items.length === 0 ? (
          <Empty>{t('msg.empty')}</Empty>
        ) : (
          <div className="space-y-3">
            {items.map((message) => (
              <ChatBubble key={message.id} side={message.side} author={message.author} time={dateTime(message.at)}>
                {text(message.text).value}
              </ChatBubble>
            ))}
          </div>
        )}
      </Card>
      <div className="flex flex-wrap gap-3 text-sm">
        <Link to="/intake/company/$organizationId" params={{ organizationId: DEMO_ORG_MINGHU }}>
          {t('intake.company.title')} →
        </Link>
        <Link to="/intake/product/$productId" params={{ productId: DEMO_PRODUCT_MH200 }}>
          {t('intake.product.title')} →
        </Link>
        <Link to="/case/$caseId/chat" params={{ caseId: DEMO_CASE_RU0417 }}>
          {t('chat.title')} →
        </Link>
      </div>
    </Shell>
  )
}
