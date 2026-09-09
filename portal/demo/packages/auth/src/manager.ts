import { UserManager, WebStorageStateStore, type User } from 'oidc-client-ts'

/**
 * Вход в кабинет: Authorization Code + PKCE, публичный клиент `medmost-spa`
 * realm `pharma`. Подпись, издателя и аудиторию проверяет JWT-авторайзер шлюза,
 * а роли приходят из realm — браузер ничего не перепроверяет.
 *
 * `redirect_uri` — базовый путь приложения (`/`, `/cn/`, `/ru/`). Именно он
 * замаплен в шлюзе напрямую и прописан в redirect URIs клиента.
 */

function required(name: string, value: string | undefined): string {
  if (!value) throw new Error(`${name} не задан: вход в кабинет невозможен`)
  return value
}

export function appBaseUrl(): string {
  const base = import.meta.env.BASE_URL || '/'
  return new URL(base, window.location.origin).toString()
}

let manager: UserManager | null = null

export function userManager(): UserManager {
  if (manager) return manager

  const authority = `${required('VITE_KEYCLOAK_URL', import.meta.env.VITE_KEYCLOAK_URL as string | undefined).replace(
    /\/$/,
    '',
  )}/realms/${required('VITE_KEYCLOAK_REALM', import.meta.env.VITE_KEYCLOAK_REALM as string | undefined)}`

  manager = new UserManager({
    authority,
    client_id: required('VITE_KEYCLOAK_CLIENT_ID', import.meta.env.VITE_KEYCLOAK_CLIENT_ID as string | undefined),
    redirect_uri: appBaseUrl(),
    post_logout_redirect_uri: appBaseUrl(),
    response_type: 'code',
    scope: 'openid profile email',
    // Обновление по refresh-токену, без скрытого iframe с целым приложением.
    automaticSilentRenew: true,
    userStore: new WebStorageStateStore({ store: window.localStorage }),
    stateStore: new WebStorageStateStore({ store: window.localStorage }),
  })
  return manager
}

export function hasAuthParams(): boolean {
  const params = new URLSearchParams(window.location.search)
  return (params.has('code') || params.has('error')) && params.has('state')
}

/** Убирает `code` и `state` из адресной строки, не перезагружая приложение. */
export function stripAuthParams(): void {
  window.history.replaceState({}, document.title, appBaseUrl())
}

export type { User }
