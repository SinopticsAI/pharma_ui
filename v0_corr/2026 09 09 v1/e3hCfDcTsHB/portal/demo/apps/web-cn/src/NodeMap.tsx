import { l10n, type NodeMapItem, type NodeOwner, type NodeStatus } from '@demo/domain'
import { useI18n } from '@demo/i18n'
import { BaseNode } from '@demo/ui/components/base-node'
import { cn } from '@demo/ui/lib/utils'
import { Background, Controls, Handle, type Node, type NodeProps, Position, ReactFlow } from '@xyflow/react'
import { useMemo } from 'react'
import { StatusBadge } from './kit'
import { layoutNodeMap } from './node-map'

function statusTone(status: NodeStatus, critical: boolean) {
  if (critical && status === 'in_progress') return 'risk' as const
  if (status === 'done') return 'ok' as const
  if (status === 'in_progress') return 'risk' as const
  if (status === 'planned') return 'warm' as const
  if (status === 'goal') return 'accent' as const
  return 'quiet' as const
}

function nodeBorder(item: NodeMapItem) {
  if (item.critical) return 'border-destructive'
  if (item.status === 'done') return 'border-success'
  if (item.status === 'in_progress') return 'border-destructive'
  if (item.status === 'planned') return 'border-warning'
  if (item.status === 'goal') return 'border-primary'
  return 'border-border'
}

function ownerClass(owner: NodeOwner) {
  if (owner === 'you') return 'bg-primary/10 text-primary'
  if (owner === 'us') return 'bg-secondary text-secondary-foreground'
  if (owner === 'contractor') return 'bg-warning/20 text-warning-foreground'
  return 'bg-muted text-muted-foreground'
}

function edgeAppearance(source: NodeMapItem | undefined, target: NodeMapItem | undefined) {
  if (target?.critical) return { stroke: 'var(--destructive)', strokeWidth: 2 }
  if (source?.status === 'done' && (target?.status === 'done' || target?.status === 'in_progress')) {
    return { stroke: 'var(--success)', strokeWidth: 1.5 }
  }
  return { stroke: 'var(--border)', strokeWidth: 1.25 }
}

function MapNode({ data, selected }: NodeProps<Node<{ item: NodeMapItem }>>) {
  const { t, text } = useI18n()
  const item = data.item
  const note = item.note ? text(l10n(item.note)).value : ''
  const due = item.dueHint ? text(l10n(item.dueHint)).value : ''

  return (
    <BaseNode selected={selected} className={cn('w-[248px] p-2.5', nodeBorder(item))}>
      <Handle type="target" position={Position.Left} className="!size-2 !border-0 !bg-border" />
      <Handle type="source" position={Position.Right} className="!size-2 !border-0 !bg-border" />
      <div className="flex items-start justify-between gap-2">
        <div className="text-xs font-medium">
          {item.code}
          {item.critical ? ` · ${t('map.critical')}` : ''}
        </div>
        <StatusBadge tone={statusTone(item.status, item.critical)}>{t(`nodeStatus.${item.status}`)}</StatusBadge>
      </div>
      <div className="mt-1 text-sm leading-snug">{text(l10n(item.title)).value}</div>
      {note ? <div className="mt-1 line-clamp-2 text-xs text-muted-foreground">{note}</div> : null}
      <div className="mt-2 flex items-center justify-between gap-2">
        <span className={cn('rounded-md px-1.5 py-0.5 text-[11px] leading-none', ownerClass(item.owner))}>
          {t(`nodeOwner.${item.owner}`)}
        </span>
        {due ? <span className="text-[11px] text-muted-foreground">{due}</span> : null}
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
  const byCode = useMemo(() => new Map(items.map((item) => [item.code, item])), [items])
  const { nodes, edges } = useMemo(() => {
    const laid = layoutNodeMap(items)
    return {
      nodes: laid.nodes.map((node) => ({ ...node, style: { cursor: onOpen ? 'pointer' : undefined } })),
      edges: laid.edges.map((edge) => ({
        ...edge,
        style: edgeAppearance(byCode.get(edge.source), byCode.get(edge.target)),
      })),
    }
  }, [byCode, items, onOpen])

  if (items.length === 0) return null

  return (
    <div className={cn('h-[420px] w-full rounded-md border', className)}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={Boolean(onOpen)}
        proOptions={{ hideAttribution: true }}
        onNodeClick={onOpen ? (_event, node) => onOpen(node.id) : undefined}
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  )
}
