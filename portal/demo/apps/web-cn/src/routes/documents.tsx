import { createFileRoute } from '@tanstack/react-router'
import { DocumentsHubPage } from '../pages/DocumentsHub'

export const Route = createFileRoute('/documents')({
  component: DocumentsHubPage,
})
