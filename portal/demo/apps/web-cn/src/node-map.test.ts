import type { NodeMapItem } from '@demo/domain'
import { describe, expect, it } from 'vitest'
import { layoutNodeMap } from './node-map'

const node = (code: string, position: number, blockedBy: string[] = []): NodeMapItem => ({
  code,
  position,
  title: { ru: code },
  status: 'planned',
  owner: 'you',
  blockedBy,
  critical: false,
})

describe('layoutNodeMap', () => {
  it('раскладывает узлы по position и строит рёбра blockedBy', () => {
    const { nodes, edges } = layoutNodeMap([node('M0', 0), node('M1', 1, ['M0']), node('M2', 4)])

    expect(nodes).toHaveLength(3)
    expect(nodes[0]).toMatchObject({ id: 'M0', position: { x: 0, y: 0 } })
    expect(nodes[2]).toMatchObject({ id: 'M2', position: { x: 0, y: 140 } })
    expect(edges).toEqual([expect.objectContaining({ id: 'M0-M1', source: 'M0', target: 'M1' })])
  })

  it('не рисует ребро на отсутствующий узел', () => {
    const { edges } = layoutNodeMap([node('M1', 1, ['M0'])])
    expect(edges).toEqual([])
  })
})
