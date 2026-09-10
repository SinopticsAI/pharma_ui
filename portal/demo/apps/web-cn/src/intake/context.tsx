import { createContext, useContext } from 'react'

/**
 * Слой между карточками и композером.
 *
 * Карточки только показывают данные. Тип документа с `ask-document` нужен
 * скрепке: адаптер читает его в момент отправки файла.
 */
export interface IntakeActions {
  /** Тип следующего вложения: его подставит адаптер в запрос загрузки. */
  setItemType: (itemType: string) => void
}

const IntakeContext = createContext<IntakeActions | null>(null)

export const IntakeActionsProvider = IntakeContext.Provider

export function useIntakeActions(): IntakeActions {
  const value = useContext(IntakeContext)
  if (!value) throw new Error('Карточка интейка отрендерена вне IntakeActionsProvider')
  return value
}
