import { createFileRoute } from '@tanstack/react-router'
import { MandatePage } from '../../../pages/Mandate'

export const Route = createFileRoute('/products/$productId/mandate')({
  component: MandatePage,
})
