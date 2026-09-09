import { createFileRoute } from '@tanstack/react-router'
import { PaymentsPage } from '../pages/Payments'

export const Route = createFileRoute('/payments')({
  component: PaymentsPage,
})
