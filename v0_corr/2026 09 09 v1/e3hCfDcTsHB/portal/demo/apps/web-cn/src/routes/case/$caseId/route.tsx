import { createFileRoute } from '@tanstack/react-router'
import { CaseLayout } from '../../../CaseLayout'

export const Route = createFileRoute('/case/$caseId')({
  component: CaseLayout,
})
