import { createFileRoute } from '@tanstack/react-router'
import { ProductLayout } from '../../../ProductLayout'

export const Route = createFileRoute('/products/$productId')({
  component: ProductLayout,
})
