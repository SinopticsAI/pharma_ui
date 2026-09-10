import { createFileRoute } from '@tanstack/react-router'
import { ChatPage } from '../../../pages/Chat'

export const Route = createFileRoute('/products/$productId/chat')({
  component: ChatPage,
})
