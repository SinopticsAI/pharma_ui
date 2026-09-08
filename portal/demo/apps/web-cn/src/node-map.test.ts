import type { NodeMapItem } from '@demo/domain'
import { describe, expect, it } from 'vitest'
import { demoNodes } from './demo/catalog'
import { COLUMN_WIDTH, ROW_HEIGHT, layoutNodeMap } from './node-map'

const node = (code: string, position: number, blockedBy: string[] = []): NodeMapItem => ({
  code,
  position,
  title: { ru: code },
  status: 'planned',
  owner: 'you',
  blockedBy,
  critical: false,
})

const byId = (nodes: { id: string; position: { x: number; y: number } }[]) =>
  Object.fromEntries(nodes.map((entry) => [entry.id, entry]))

describe('layoutNodeMap', () => {
  it('раскладывает узлы по рангу DAG, внутри колонки — по position', () => {
    const { nodes, edges } = layoutNodeMap([node('M0', 0), node('M1', 1, ['M0']), node('M2', 4)])
    const laid = byId(nodes)

    expect(nodes).toHaveLength(3)
    expect(laid.M0.position).toEqual({ x: 0, y: 0 })
    expect(laid.M2.position).toEqual({ x: 0, y: ROW_HEIGHT })
    expect(laid.M1.position).toEqual({ x: COLUMN_WIDTH, y: 0 })
    expect(edges).toEqual([expect.objectContaining({ id: 'M0-M1', source: 'M0', target: 'M1' })])
  })

  it('ставит параллельные узлы в одну колонку (fan-out)', () => {
    const { nodes, edges } = layoutNodeMap([
      node('A', 0),
      node('B', 1, ['A']),
      node('C', 2, ['A']),
    ])
    const laid = byId(nodes)

    expect(laid.B.position.x).toBe(COLUMN_WIDTH)
    expect(laid.C.position.x).toBe(COLUMN_WIDTH)
    expect(laid.B.position.y).toBe(0)
    expect(laid.C.position.y).toBe(ROW_HEIGHT)
    expect(edges).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ source: 'A', target: 'B' }),
        expect.objectContaining({ source: 'A', target: 'C' }),
      ]),
    )
  })

  it('ставит слияние правее самого длинного предшественника (fan-in)', () => {
    const { nodes, edges } = layoutNodeMap([
      node('A', 0),
      node('B', 1, ['A']),
      node('C', 2, ['A']),
      node('D', 3, ['B', 'C']),
    ])
    const laid = byId(nodes)

    expect(laid.D.position.x).toBe(COLUMN_WIDTH * 2)
    expect(laid.D.position.x).toBeGreaterThan(laid.B.position.x)
    expect(edges).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'B-D', source: 'B', target: 'D' }),
        expect.objectContaining({ id: 'C-D', source: 'C', target: 'D' }),
      ]),
    )
  })

  it('не рисует ребро на отсутствующий узел', () => {
    const { nodes, edges } = layoutNodeMap([node('M1', 1, ['M0'])])
    expect(nodes[0]?.position).toEqual({ x: 0, y: 0 })
    expect(edges).toEqual([])
  })

  it('первые пять узлов дашборда остаются связным DAG', () => {
    const { nodes, edges } = layoutNodeMap(demoNodes().slice(0, 5))
    const laid = byId(nodes)

    expect(edges.length).toBeGreaterThan(0)
    expect(laid.M3.position.x).toBe(laid.M4.position.x)
    expect(laid.M4.position.x).toBeGreaterThan(laid.M2.position.x)
  })

  it('у демо-карты M3/M4/M7 параллельны, M8 правее слияния', () => {
    const { nodes, edges } = layoutNodeMap(demoNodes())
    const laid = byId(nodes)

    expect(laid.M3.position.x).toBe(laid.M4.position.x)
    expect(laid.M3.position.x).toBe(laid.M7.position.x)
    expect(laid.M8.position.x).toBeGreaterThan(laid.M6.position.x)
    expect(laid.M8.position.x).toBeGreaterThan(laid.M7.position.x)
    expect(edges).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ source: 'M2', target: 'M3' }),
        expect.objectContaining({ source: 'M2', target: 'M4' }),
        expect.objectContaining({ source: 'M2', target: 'M7' }),
        expect.objectContaining({ source: 'M5', target: 'M8' }),
        expect.objectContaining({ source: 'M6', target: 'M8' }),
        expect.objectContaining({ source: 'M7', target: 'M8' }),
      ]),
    )
  })
})
