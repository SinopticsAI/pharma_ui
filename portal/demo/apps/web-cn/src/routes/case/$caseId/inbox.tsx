import { createFileRoute } from '@tanstack/react-router'
import { InboxPage } from '../../../pages/Inbox'

export const Route = createFileRoute('/case/$caseId/inbox')({
  component: InboxPage,
})
