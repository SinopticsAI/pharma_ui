import type { DemoState } from '@demo/domain'
import { createSeedState } from './seed'

const STORAGE_KEY = 'pharma-portal-demo-state-v1'

const listeners = new Set<() => void>()

function load(): DemoState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as DemoState
  } catch {
    // Повреждённое состояние не должно ронять стенд: молча возвращаемся к сиду.
  }
  return createSeedState()
}

let state: DemoState = load()

function persist(): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Приватный режим браузера: демо продолжает работать в памяти вкладки.
  }
}

function emit(): void {
  for (const listener of listeners) listener()
}

persist()

/**
 * Синхронизация вкладок: консоль оператора и кабинет производителя открыты
 * рядом и должны видеть одно состояние. Работает, только когда обе сборки
 * раздаются с одного origin.
 */
window.addEventListener('storage', (event) => {
  if (event.key !== STORAGE_KEY || !event.newValue) return
  try {
    state = JSON.parse(event.newValue) as DemoState
    emit()
  } catch {
    // Игнорируем некорректную запись из соседней вкладки.
  }
})

export function getState(): DemoState {
  return state
}

export function mutate(recipe: (draft: DemoState) => void): void {
  const draft = structuredClone(state)
  recipe(draft)
  state = draft
  persist()
  emit()
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function resetDemo(): void {
  state = createSeedState()
  persist()
  emit()
}
