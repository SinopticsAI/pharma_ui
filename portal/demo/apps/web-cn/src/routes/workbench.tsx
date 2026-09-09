import { createFileRoute } from '@tanstack/react-router'
import { WorkbenchRedirectPage } from '../pages/Workbench'

export const Route = createFileRoute('/workbench')({
  component: WorkbenchRedirectPage,
})
