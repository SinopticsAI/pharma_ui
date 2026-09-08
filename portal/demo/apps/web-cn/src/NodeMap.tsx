import { l10n, type NodeMapItem } from '@demo/domain'
import { useI18n } from '@demo/i18n'
import { BaseNode } from '@demo/ui/components/base-node'
import { cn } from '@demo/ui/lib/utils'
import { Background, Controls, type Node, type NodeProps, ReactFlow } from '@xyflow/react'
import { useMemo } from 'react'
import { layoutNodeMap } from './node-map'

function MapNode({ data, selected }: NodeProps<Node<{ item: NodeMapItem }>>) {
  const { t, text } = useI18n()
  const item = data.item
  return (
    <BaseNode selected={selected} className={cn('w-[200px]', item.critical && 'border-destructive')}>
      <div className="text-xs font-medium">
        {item.code}
        {item.critical ? ` · ${t('map.critical')}` : ''}
      </div>
      <div className="text-sm">{text(l10n(item.title)).value}</div>
      <div className="mt-1 text-xs text-muted-foreground">
        {t(`nodeStatus.${item.status}`)} · {t(`nodeOwner.${item.owner}`)}
      </div>
    </BaseNode>
  )
}

const nodeTypes = { mapNode: MapNode }

export function NodeMapView({
  items,
  className,
  onOpen,
}: {
  items: NodeMapItem[]
  className?: string
  onOpen?: (code: string) => void
}) {
  const { nodes, edges } = useMemo(() => {
    const laid = layoutNodeMap(items)
    return {
      nodes: laid.nodes.map((node) => ({ ...node, style: { cursor: onOpen ? 'pointer' : undefined } })),
      edges: laid.edges.map((edge) => {
        const target = items.find((item) => item.code === edge.target)
        return {
          ...edge,
          style: target?.critical
            ? { stroke: 'var(--warning)', strokeWidth: 2 }
            : { stroke: 'var(--primary)', strokeWidth: 1.25 },
        }
      }),
    }
  }, [items, onOpen])

  if (items.length === 0) return null

  return (
    <div className={cn('h-[420px] w-full rounded-md border', className)}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        proOptions={{ hideAttribution: true }}
        onNodeClick={onOpen ? (_event, node) => onOpen(node.id) : undefined}
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  )
}
