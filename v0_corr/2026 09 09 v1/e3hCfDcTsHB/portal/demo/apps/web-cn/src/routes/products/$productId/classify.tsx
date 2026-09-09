import { createFileRoute } from '@tanstack/react-router'
import { ClassificationPage } from '../../../pages/Products'

export const Route = createFileRoute('/products/$productId/classify')({
  component: ClassifyRoute,
})

function ClassifyRoute() {
  const { productId } = Route.useParams()
  return <ClassificationPage productId={productId} />
}
