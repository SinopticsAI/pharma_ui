import { createFileRoute } from '@tanstack/react-router'
import { DossierPage } from '../../../pages/Dossier'

export const Route = createFileRoute('/products/$productId/dossier')({
  component: DossierPage,
})
