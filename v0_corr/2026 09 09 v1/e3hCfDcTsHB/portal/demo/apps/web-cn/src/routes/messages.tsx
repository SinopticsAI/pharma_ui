import { createFileRoute } from '@tanstack/react-router'
import { MessagesPage } from '../pages/Messages'

export const Route = createFileRoute('/messages')({
  component: MessagesPage,
})
