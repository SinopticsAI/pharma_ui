import type { NodeMapItem } from '@demo/domain'
import { type Edge, type Node, Position } from '@xyflow/react'

export const COLUMN_WIDTH = 280
export const ROW_HEIGHT = 188

export function nodeMapProgress(items: NodeMapItem[]): { done: number; total: number; percent: number } {
  const done = items.filter((item) => item.status === 'done').length
  const total = items.length
  return { done, total, percent: total === 0 ? 0 : Math.round((done / total) * 100) }
}

function rankByLongestPath(items: NodeMapItem[]): Map<string, number> {
  const byCode = new Map(items.map((item) => [item.code, item]))
  const known = new Set(byCode.keys())
  const memo = new Map<string, number>()
  const visiting = new Set<string>()

  const rankOf = (code: string): number => {
    const cached = memo.get(code)
    if (cached !== undefined) return cached
    if (visiting.has(code)) return 0
    const item = byCode.get(code)
    if (!item) return 0
    visiting.add(code)
    const preds = item.blockedBy.filter((source) => known.has(source))
    const rank = preds.length === 0 ? 0 : Math.max(...preds.map(rankOf)) + 1
    visiting.delete(code)
    memo.set(code, rank)
    return rank
  }

  for (const item of items) rankOf(item.code)
  return memo
}

function sortInColumn(left: NodeMapItem, right: NodeMapItem): number {
  const leftPos = Number.isFinite(left.position) ? left.position : 0
  const rightPos = Number.isFinite(right.position) ? right.position : 0
  return leftPos - rightPos || left.code.localeCompare(right.code)
}

export function layoutNodeMap(items: NodeMapItem[]): { nodes: Node[]; edges: Edge[] } {
  const ranks = rankByLongestPath(items)
  const known = new Set(items.map((item) => item.code))
  const columns = new Map<number, NodeMapItem[]>()

  for (const item of items) {
    const rank = ranks.get(item.code) ?? 0
    const column = columns.get(rank) ?? []
    column.push(item)
    columns.set(rank, column)
  }
  for (const column of columns.values()) column.sort(sortInColumn)

  const nodes: Node[] = items.map((item) => {
    const rank = ranks.get(item.code) ?? 0
    const row = (columns.get(rank) ?? []).findIndex((entry) => entry.code === item.code)
    return {
      id: item.code,
      type: 'mapNode',
      position: {
        x: rank * COLUMN_WIDTH,
        y: Math.max(row, 0) * ROW_HEIGHT,
      },
      data: { item },
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
    }
  })

  const edges: Edge[] = items.flatMap((item) =>
    item.blockedBy
      .filter((source) => known.has(source))
      .map((source) => ({
        id: `${source}-${item.code}`,
        source,
        target: item.code,
        type: 'default',
      })),
  )

  return { nodes, edges }
}
