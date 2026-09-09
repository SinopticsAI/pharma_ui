import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { User } from 'oidc-client-ts'
import { hasAuthParams, stripAuthParams, userManager } from './manager'

export { appBaseUrl, userManager } from './manager'

export interface AuthProfile {
  subject: string
  name: string
  email: string
}

export type AuthStatus = 'signing-in' | 'ready' | 'error'

interface AuthValue {
  status: AuthStatus
  error: unknown
  profile: AuthProfile | null
  getAccessToken: () => Promise<string | null>
  logout: () => void
}

const AuthContext = createContext<AuthValue | null>(null)

/**
 * Витрина дизайна без ядра и Keycloak. Флаг `VITE_DEMO_OFFLINE=1` включает
 * заранее авторизованную сессию, чтобы кабинет открывался на demo-данных
 * MH-200. В проде и на живом контуре флаг не задаётся — работает реальный OIDC.
 */
const OFFLINE_DEMO = import.meta.env.VITE_DEMO_OFFLINE === '1'

const OFFLINE_PROFILE: AuthProfile = { subject: 'demo-wang-lei', name: '王磊', email: 'demo@medmost.example' }

function profileOf(user: User): AuthProfile {
  return {
    subject: user.profile.sub,
    name: String(user.profile.name ?? user.profile.preferred_username ?? ''),
    email: String(user.profile.email ?? ''),
  }
}

/**
 * Обмен кода на токен выполняется один раз на загрузку страницы.
 * Guard нужен из-за двойного вызова эффектов в StrictMode: повторный
 * `signinCallback` упал бы, потому что `state` уже израсходован.
 */
let signinOnce: Promise<User | null> | null = null

function resolveSession(): Promise<User | null> {
  if (signinOnce) return signinOnce
  const manager = userManager()
  signinOnce = (async () => {
    if (hasAuthParams()) {
      const user = await manager.signinCallback()
      stripAuthParams()
      return user ?? null
    }
    const existing = await manager.getUser()
    if (existing && !existing.expired) return existing
    await manager.signinRedirect()
    return null
  })()
  return signinOnce
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>(OFFLINE_DEMO ? 'ready' : 'signing-in')
  const [error, setError] = useState<unknown>(null)
  const [profile, setProfile] = useState<AuthProfile | null>(OFFLINE_DEMO ? OFFLINE_PROFILE : null)

  useEffect(() => {
    if (OFFLINE_DEMO) return
    let cancelled = false
    resolveSession()
      .then((user) => {
        if (cancelled || !user) return
        setProfile(profileOf(user))
        setStatus('ready')
      })
      .catch((cause: unknown) => {
        if (cancelled) return
        signinOnce = null
        setError(cause)
        setStatus('error')
      })
    return () => {
      cancelled = true
    }
  }, [])

  const getAccessToken = useCallback(async () => {
    if (OFFLINE_DEMO) return 'demo-offline-token'
    const manager = userManager()
    const current = await manager.getUser()
    if (current && !current.expired) return current.access_token
    const renewed = await manager.signinSilent().catch(() => null)
    if (renewed) return renewed.access_token
    await manager.signinRedirect()
    return null
  }, [])

  const logout = useCallback(() => {
    if (OFFLINE_DEMO) {
      window.location.reload()
      return
    }
    void userManager().signoutRedirect()
  }, [])

  const value = useMemo<AuthValue>(
    () => ({ status, error, profile, getAccessToken, logout }),
    [status, error, profile, getAccessToken, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthValue {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth вызван вне AuthProvider')
  return value
}
