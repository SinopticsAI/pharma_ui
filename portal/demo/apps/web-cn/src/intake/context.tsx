import { createContext, useContext } from 'react'

/**
 * Действия карточек диалога.
 *
 * Кнопка карточки либо пишет в ядро через REST (загрузка документа, одобрение
 * карточки), либо возвращает ответ в нить. Ни одна из них не решает за человека:
 * агент готовит черновик, состояние меняет пользователь.
 */
export interface IntakeActions {
  /** Ответ одной строкой: он закрывает пробел не хуже файла. */
  send: (text: string) => void
  attach: (itemType: string) => void
  approveDraft: (scope: 'company' | 'product', entityId: string) => void
  busy: boolean
}

const IntakeContext = createContext<IntakeActions | null>(null)

export const IntakeActionsProvider = IntakeContext.Provider

export function useIntakeActions(): IntakeActions {
  const value = useContext(IntakeContext)
  if (!value) throw new Error('Карточка интейка отрендерена вне IntakeActionsProvider')
  return value
}
