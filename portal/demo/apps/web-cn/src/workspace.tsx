import { createContext, useContext } from 'react'

/**
 * Продукт и его кейс — одно рабочее место, поэтому разделы берут идентификаторы
 * из кабинета продукта, а не из адреса кейса. Кейса может ещё не быть: карту
 * строит ядро после утверждения классификации, и тогда `caseId` пуст.
 */
export interface Workspace {
  productId: string
  caseId: string
}

const WorkspaceContext = createContext<Workspace>({ productId: '', caseId: '' })

export const WorkspaceProvider = WorkspaceContext.Provider

export function useWorkspace(): Workspace {
  return useContext(WorkspaceContext)
}

export function useCaseId(): string {
  return useWorkspace().caseId
}
