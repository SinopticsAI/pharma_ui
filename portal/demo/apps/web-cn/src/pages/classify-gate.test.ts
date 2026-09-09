import { describe, expect, it } from 'vitest'
import { countPendingActions, defaultDemoState } from '../demo/state'

describe('classification dual confirmation', () => {
  it('counts the client confirmation as a pending action until both sides signed', () => {
    const open = defaultDemoState()
    expect(open.rk30SpecialistApproved && !open.rk30ClientApproved).toBe(true)
    const closed = {
      ...open,
      rk30ClientApproved: true,
      poaDraftAccepted: true,
      logisticsConfirmed: true,
      mh200Electro: true,
    }
    expect(countPendingActions(closed)).toBe(0)
  })
})
