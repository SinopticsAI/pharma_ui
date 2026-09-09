import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from 'react'
import { countPendingActions, type DemoUiState, readDemoState, resetDemoState, writeDemoState } from './state'

interface DemoStore {
  state: DemoUiState
  patch: (partial: Partial<DemoUiState>) => void
  reset: () => void
  pending: number
}

const DemoContext = createContext<DemoStore | null>(null)

export function DemoProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DemoUiState>(() => readDemoState())

  const patch = useCallback((partial: Partial<DemoUiState>) => {
    setState((current) => {
      const next = { ...current, ...partial }
      writeDemoState(next)
      return next
    })
  }, [])

  const reset = useCallback(() => {
    setState(resetDemoState())
  }, [])

  const value = useMemo<DemoStore>(
    () => ({ state, patch, reset, pending: countPendingActions(state) }),
    [state, patch, reset],
  )

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>
}

export function useDemo() {
  const value = useContext(DemoContext)
  if (!value) throw new Error('useDemo outside DemoProvider')
  return value
}
