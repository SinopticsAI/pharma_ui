/** Кабинет и портал делят один ключ: галочка Plane на интейке и досье одна. */
export const PLANE_TOGGLE_STORAGE_KEY = 'pharma.usePlane'

const CHANGE_EVENT = 'pharma.usePlane-change'

export function readPlaneEnabled(): boolean {
  try {
    if (typeof localStorage === 'undefined') return false
    const raw = localStorage.getItem(PLANE_TOGGLE_STORAGE_KEY)
    return raw === '1' || raw === 'true'
  } catch {
    return false
  }
}

export function writePlaneEnabled(on: boolean): void {
  try {
    localStorage.setItem(PLANE_TOGGLE_STORAGE_KEY, on ? '1' : '0')
  } catch {
    // private mode / disabled storage
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(CHANGE_EVENT))
  }
}

export function subscribePlaneEnabled(listener: () => void): () => void {
  if (typeof window === 'undefined') return () => undefined
  window.addEventListener(CHANGE_EVENT, listener)
  window.addEventListener('storage', listener)
  return () => {
    window.removeEventListener(CHANGE_EVENT, listener)
    window.removeEventListener('storage', listener)
  }
}
