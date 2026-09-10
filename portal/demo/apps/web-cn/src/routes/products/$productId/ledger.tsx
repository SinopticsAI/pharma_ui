import { createFileRoute } from '@tanstack/react-router'
import { LedgerPage } from '../../../pages/Ledger'

export const Route = createFileRoute('/products/$productId/ledger')({
  component: LedgerPage,
})
