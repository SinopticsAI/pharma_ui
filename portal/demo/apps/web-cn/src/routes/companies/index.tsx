import { createFileRoute } from '@tanstack/react-router'
import { CompaniesPage } from '../../pages/Companies'

export const Route = createFileRoute('/companies/')({
  component: CompaniesPage,
})
