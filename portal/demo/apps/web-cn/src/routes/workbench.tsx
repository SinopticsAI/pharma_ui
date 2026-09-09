import { createFileRoute } from '@tanstack/react-router'
import { WorkbenchPage } from '../pages/Workbench'

export const Route = createFileRoute('/workbench')({
  component: WorkbenchPage,
})
