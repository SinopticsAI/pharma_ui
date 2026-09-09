import { sessionSearchSchema } from '@demo/contracts'
import { createFileRoute } from '@tanstack/react-router'
import { IntakeCompanyPage } from '../../../pages/Intake'

export const Route = createFileRoute('/intake/company/$organizationId')({
  validateSearch: sessionSearchSchema,
  component: IntakeCompanyPage,
})
