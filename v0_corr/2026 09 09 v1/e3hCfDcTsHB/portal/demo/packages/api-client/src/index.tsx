import type { Contour, Identity } from '@demo/domain'
import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from 'react'
import { type ApiClient, type ApiClientOptions, createApiClient } from './client'
import { ApiError } from './errors'

export type {
  AddStatusInput,
  ApiClientOptions,
  ApproveProductInput,
  UploadRequest,
} from './client'
export { ApiClient, createApiClient } from './client'
export { ApiError, describeError, ERROR_COPY } from './errors'

const ApiContext = createContext<ApiClient | null>(null)

/**
 * Витрина дизайна: `VITE_DEMO_OFFLINE=1` открывает кабинет на demo-данных
 * MH-200 без ядра. Личность подставляется здесь, а живые списки отдают
 * demo-строки через fallback в `queries.ts`. В проде флаг не задаётся.
 */
export const OFFLINE_DEMO = import.meta.env.VITE_DEMO_OFFLINE === '1'

/** Sentinel-адрес offline-режима: реальные запросы к нему отклоняются сразу. */
export const OFFLINE_BASE_URL = 'offline://demo'

/** Личность производителя для offline-витрины: аккаунт Минху, пользователь Ван Лэй. */
const OFFLINE_IDENTITY: Identity = {
  accountId: 'demo-account',
  subject: 'demo-wang-lei',
  role: 'client',
  displayName: '',
  account: {
    id: 'demo-account',
    name: { zh: '深圳明湖医疗', en: 'Shenzhen Minghu Medical', ru: 'Шэньчжэнь Минху Медикал' },
    status: 'active',
  },
  can: { approveAsSpecialist: false, operate: false },
}

/** Базовый адрес ядра. Без него кабинет не поднимается: тихого мока больше нет. */
export function edgeBaseUrl(): string {
  if (OFFLINE_DEMO) return OFFLINE_BASE_URL
  const value = import.meta.env.VITE_API_URL as string | undefined
  if (!value) {
    throw new Error('VITE_API_URL не задан: кабинет не знает, где живёт pharma-edge')
  }
  return value
}

export function ApiProvider({
  contour,
  getToken,
  onUnauthorized,
  children,
}: Omit<ApiClientOptions, 'baseUrl'> & { contour: Contour; children: ReactNode }) {
  const client = useMemo(
    () => createApiClient({ baseUrl: edgeBaseUrl(), contour, getToken, onUnauthorized }),
    [contour, getToken, onUnauthorized],
  )
  return <ApiContext.Provider value={client}>{children}</ApiContext.Provider>
}

export function useApi(): ApiClient {
  const client = useContext(ApiContext)
  if (!client) throw new Error('useApi вызван вне ApiProvider')
  return client
}

export type IdentityState =
  | { status: 'loading' }
  | { status: 'ready'; identity: Identity }
  | { status: 'not-linked'; subject: string }
  | { status: 'error'; error: unknown }

const IdentityContext = createContext<IdentityState | null>(null)

/**
 * Первый вызов после входа. Аккаунт не лежит в токене: Keycloak владеет
 * личностью, продукт — арендаторами, поэтому `sub` разрешается здесь.
 */
export function IdentityProvider({ children }: { children: ReactNode }) {
  const api = useApi()
  const [state, setState] = useState<IdentityState>(
    OFFLINE_DEMO ? { status: 'ready', identity: OFFLINE_IDENTITY } : { status: 'loading' },
  )

  useEffect(() => {
    if (OFFLINE_DEMO) return
    let cancelled = false
    api
      .getMe()
      .then((identity) => {
        if (!cancelled) setState({ status: 'ready', identity })
      })
      .catch((error: unknown) => {
        if (cancelled) return
        if (error instanceof ApiError && error.isAccountNotLinked) {
          setState({ status: 'not-linked', subject: String(error.details.subject ?? '') })
        } else {
          setState({ status: 'error', error })
        }
      })
    return () => {
      cancelled = true
    }
  }, [api])

  return <IdentityContext.Provider value={state}>{children}</IdentityContext.Provider>
}

export function useIdentityState(): IdentityState {
  const state = useContext(IdentityContext)
  if (!state) throw new Error('useIdentityState вызван вне IdentityProvider')
  return state
}

/** Для экранов внутри гейта: там личность уже разрешена. */
export function useIdentity(): Identity {
  const state = useIdentityState()
  if (state.status !== 'ready') throw new Error('useIdentity вызван до разрешения аккаунта')
  return state.identity
}
