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

export function NodeMapView({ items, className }: { items: NodeMapItem[]; className?: string }) {
  const { nodes, edges } = useMemo(() => layoutNodeMap(items), [items])

  if (items.length === 0) return null

  return (
    <div className={cn('h-[420px] w-full rounded-md border', className)}>
      <ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} fitView proOptions={{ hideAttribution: true }}>
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  )
}
