import { createFileRoute } from '@tanstack/react-router'
import { PortfolioPage } from '../pages/Portfolio'

export const Route = createFileRoute('/')({
  component: PortfolioPage,
})
