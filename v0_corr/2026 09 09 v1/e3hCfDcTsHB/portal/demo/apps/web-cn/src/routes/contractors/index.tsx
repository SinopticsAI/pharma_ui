import { createFileRoute } from '@tanstack/react-router'
import { ContractorsPage } from '../../pages/Contractors'

export const Route = createFileRoute('/contractors/')({
  component: ContractorsPage,
})
