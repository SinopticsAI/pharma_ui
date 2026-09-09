import { createFileRoute } from '@tanstack/react-router'
import { DossierPage } from '../../../pages/Dossier'

export const Route = createFileRoute('/case/$caseId/dossier')({
  component: DossierPage,
})
