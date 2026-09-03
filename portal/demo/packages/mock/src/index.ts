import { useEffect } from 'react'
import type { QueryClient } from '@tanstack/react-query'
import { subscribe } from './store'

export * from './api'
export * from './intake'
export { getState, resetDemo, subscribe } from './store'
export { DATE_SLICE } from './seed'

/**
 * Любое изменение состояния — в этой вкладке или в соседней — инвалидирует кеш
 * запросов. Именно так консоль оператора двигает кабинет производителя.
 */
export function useDemoSync(queryClient: QueryClient): void {
  useEffect(() => subscribe(() => void queryClient.invalidateQueries()), [queryClient])
}
