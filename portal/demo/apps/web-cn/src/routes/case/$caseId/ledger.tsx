import { createFileRoute } from '@tanstack/react-router'
import { CaseRedirect } from '../../../CaseRedirect'

export const Route = createFileRoute('/case/$caseId/ledger')({
  component: () => <CaseRedirect section="ledger" />,
})
