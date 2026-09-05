import { createContext, useContext } from 'react'

/**
 * Действия карточек диалога.
 *
 * Кнопка карточки либо пишет в ядро через REST (одобрение карточки), либо
 * возвращает ответ в нить. Ни одна из них не решает за человека: агент готовит
 * черновик, состояние меняет пользователь.
 *
 * Документ карточка не грузит сама: она называет тип документа и открывает
 * выбор файла, а дальше файл идёт тем же путём, что и скрепка композера.
 */
export interface IntakeActions {
  /** Ответ одной строкой: он закрывает пробел не хуже файла. */
  send: (text: string) => void
  /** Тип следующего вложения: его подставит адаптер в запрос загрузки. */
  setItemType: (itemType: string) => void
  /** Скрепка композера без карточки: на регистрации компании это 营业执照. */
  composerItemType: string
  /** Тип документа плюс выбор файла: вложение появляется чипом в композере. */
  attachDocument: (itemType: string) => void
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
