import { describe, expect, it } from 'vitest'
import { classificationVariants, demoNodes, filingProgressPercent, nodesDoneCount } from './catalog'
import { DEMO_PRODUCT_RK30, isDemoId } from './ids'
import { countPendingActions, defaultDemoState } from './state'

describe('demo walkthrough', () => {
  it('keeps thirteen process nodes with five closed and a critical M5', () => {
    const nodes = demoNodes()
    expect(nodes).toHaveLength(13)
    expect(nodes.map((node) => node.code)).toEqual([
      'M0',
      'M1',
      'M2',
      'M3',
      'M4',
      'M5',
      'M6',
      'M7',
      'M8',
      'M9',
      'M10',
      'M11',
      'M12',
    ])
    expect(nodesDoneCount()).toBe(5)
    expect(filingProgressPercent()).toBe(62)
    expect(nodes.find((node) => node.critical)?.code).toBe('M5')
  })

  it('does not let a forbidden class be selected and keeps the map gated', () => {
    const variants = classificationVariants(DEMO_PRODUCT_RK30)
    expect(variants.filter((item) => item.variantType === 'forbidden')).toHaveLength(1)
    const state = defaultDemoState()
    expect(state.rk30SpecialistApproved).toBe(true)
    expect(state.rk30ClientApproved).toBe(false)
    expect(countPendingActions(state)).toBeGreaterThan(0)
  })

  it('marks walkthrough identifiers as demo', () => {
    expect(isDemoId('demo-minghu')).toBe(true)
    expect(isDemoId('org-live')).toBe(false)
  })
})
