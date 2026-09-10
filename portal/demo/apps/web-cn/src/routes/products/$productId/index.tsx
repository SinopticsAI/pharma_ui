import { createFileRoute } from '@tanstack/react-router'
import { ProductOverviewPage } from '../../../pages/Workbench'

export const Route = createFileRoute('/products/$productId/')({
  component: ProductOverviewPage,
})
