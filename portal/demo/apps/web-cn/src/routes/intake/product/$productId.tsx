import { sessionSearchSchema } from '@demo/contracts'
import { createFileRoute } from '@tanstack/react-router'
import { IntakeProductPage, IntakeRouteError } from '../../../pages/Intake'

export const Route = createFileRoute('/intake/product/$productId')({
  validateSearch: sessionSearchSchema,
  component: IntakeProductPage,
  errorComponent: IntakeRouteError,
})
