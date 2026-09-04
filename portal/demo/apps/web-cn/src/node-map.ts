import type { NodeMapItem } from '@demo/domain'
import type { Edge, Node } from '@xyflow/react'

const COLUMN_WIDTH = 220
const ROW_HEIGHT = 140
const COLUMNS = 4

export function layoutNodeMap(items: NodeMapItem[]): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = items.map((item, index) => {
    const position = Number.isFinite(item.position) ? item.position : index
    return {
      id: item.code,
      type: 'mapNode',
      position: {
        x: (position % COLUMNS) * COLUMN_WIDTH,
        y: Math.floor(position / COLUMNS) * ROW_HEIGHT,
      },
      data: { item },
    }
  })

  const known = new Set(items.map((item) => item.code))
  const edges: Edge[] = items.flatMap((item) =>
    item.blockedBy
      .filter((source) => known.has(source))
      .map((source) => ({
        id: `${source}-${item.code}`,
        source,
        target: item.code,
      })),
  )

  return { nodes, edges }
}
