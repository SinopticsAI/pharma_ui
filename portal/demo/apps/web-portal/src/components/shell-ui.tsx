import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'

interface ShellUi {
  createOpen: boolean
  openCreate: () => void
  closeCreate: () => void
}

const ShellUiContext = createContext<ShellUi | null>(null)

export function ShellUiProvider({ children }: { children: ReactNode }) {
  const [createOpen, setCreateOpen] = useState(false)
  const value = useMemo<ShellUi>(
    () => ({
      createOpen,
      openCreate: () => setCreateOpen(true),
      closeCreate: () => setCreateOpen(false),
    }),
    [createOpen],
  )
  return <ShellUiContext.Provider value={value}>{children}</ShellUiContext.Provider>
}

export function useShellUi(): ShellUi {
  const value = useContext(ShellUiContext)
  if (!value) throw new Error('useShellUi вне ShellUiProvider')
  return value
}
