import { createFileRoute } from '@tanstack/react-router'
import { LedgerPage } from '../../../pages/Ledger'

export const Route = createFileRoute('/case/$caseId/ledger')({
  component: LedgerPage,
})
