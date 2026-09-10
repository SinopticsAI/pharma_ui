import { createFileRoute } from '@tanstack/react-router'
import { InboxPage } from '../../../pages/Inbox'

export const Route = createFileRoute('/products/$productId/inbox')({
  component: InboxPage,
})
