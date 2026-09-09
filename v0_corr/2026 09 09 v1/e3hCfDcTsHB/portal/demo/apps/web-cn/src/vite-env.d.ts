/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_AGENT_API: string
  readonly VITE_KEYCLOAK_URL: string
  readonly VITE_KEYCLOAK_REALM: string
  readonly VITE_KEYCLOAK_CLIENT_ID: string
  /** Витрина дизайна без ядра: '1' открывает кабинет на demo-данных. */
  readonly VITE_DEMO_OFFLINE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
