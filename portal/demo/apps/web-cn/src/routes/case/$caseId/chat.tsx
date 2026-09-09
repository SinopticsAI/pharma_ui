import { createFileRoute } from '@tanstack/react-router'
import { ChatPage } from '../../../pages/Chat'

export const Route = createFileRoute('/case/$caseId/chat')({
  component: ChatPage,
})
