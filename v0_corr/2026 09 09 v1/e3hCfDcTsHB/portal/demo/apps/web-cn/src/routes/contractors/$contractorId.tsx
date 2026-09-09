import { createFileRoute } from '@tanstack/react-router'
import { ContractorCardPage } from '../../pages/Contractors'

export const Route = createFileRoute('/contractors/$contractorId')({
  component: ContractorCardPage,
})
