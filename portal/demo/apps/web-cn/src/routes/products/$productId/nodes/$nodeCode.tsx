import { createFileRoute } from '@tanstack/react-router'
import { NodeWorkPage } from '../../../../pages/NodeWork'

export const Route = createFileRoute('/products/$productId/nodes/$nodeCode')({
  component: NodeRoute,
})

function NodeRoute() {
  const { nodeCode } = Route.useParams()
  return <NodeWorkPage nodeCode={nodeCode} />
}
