import { describe, expect, it } from 'vitest'
import { sectionProgressKind, sortCompanySections } from './progress'

describe('sortCompanySections', () => {
  it('puts a banking-first API payload into mock order', () => {
    const sorted = sortCompanySections([
      { key: 'banking', filled: 0, total: 1 },
      { key: 'identity', filled: 1, total: 2 },
      { key: 'documents', filled: 0, total: 2 },
      { key: 'authority', filled: 0, total: 2 },
      { key: 'risk', filled: 0, total: 1 },
    ])
    expect(sorted.map((section) => section.key)).toEqual(['identity', 'documents', 'authority', 'banking', 'risk'])
  })
})

describe('sectionProgressKind', () => {
  it('classifies the four mock statuses', () => {
    expect(sectionProgressKind({ key: 'identity', filled: 2, total: 2 })).toBe('done')
    expect(sectionProgressKind({ key: 'documents', filled: 1, total: 2 })).toBe('partial')
    expect(sectionProgressKind({ key: 'banking', filled: 0, total: 1 })).toBe('left')
    expect(sectionProgressKind({ key: 'risk', filled: 0, total: 1 })).toBe('auto')
  })

  it('does not treat a filled risk section as waiting to start', () => {
    expect(sectionProgressKind({ key: 'risk', filled: 1, total: 1 })).toBe('done')
  })
})
