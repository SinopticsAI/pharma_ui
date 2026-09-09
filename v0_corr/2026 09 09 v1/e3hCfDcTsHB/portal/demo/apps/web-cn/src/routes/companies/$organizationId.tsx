import { createFileRoute } from '@tanstack/react-router'
import { CompanyRiskPage } from '../../pages/Companies'

export const Route = createFileRoute('/companies/$organizationId')({
  component: CompanyRiskRoute,
})

function CompanyRiskRoute() {
  const { organizationId } = Route.useParams()
  return <CompanyRiskPage organizationId={organizationId} />
}
