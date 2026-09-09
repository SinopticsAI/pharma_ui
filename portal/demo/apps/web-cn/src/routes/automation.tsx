import { createFileRoute } from '@tanstack/react-router'
import { AutomationPage } from '../pages/Automation'

export const Route = createFileRoute('/automation')({
  component: AutomationPage,
})
