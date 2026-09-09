import { createFileRoute } from '@tanstack/react-router'
import { ProductHubPage } from '../../../pages/Workbench'

export const Route = createFileRoute('/products/$productId/')({
  component: ProductHubRoute,
})

function ProductHubRoute() {
  const { productId } = Route.useParams()
  return <ProductHubPage productId={productId} />
}
