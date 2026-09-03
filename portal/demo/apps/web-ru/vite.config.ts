import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

const fromHere = (relative: string) => fileURLToPath(new URL(relative, import.meta.url))

const REQUIRED = [
  'VITE_API_URL',
  'VITE_AGENT_API',
  'VITE_KEYCLOAK_URL',
  'VITE_KEYCLOAK_REALM',
  'VITE_KEYCLOAK_CLIENT_ID',
]

/** Сборка без адресов ядра и входа падает здесь, а не в браузере. */
function requireEnv(mode: string): void {
  const env = loadEnv(mode, fromHere('../..'), 'VITE_')
  const missing = REQUIRED.filter((key) => !env[key])
  if (missing.length > 0) {
    throw new Error(`Не заданы переменные сборки: ${missing.join(', ')}. Образец — portal/demo/.env.example`)
  }
}

// Консоль оператора живёт на том же origin, но по другому пути: /ru/.
export default defineConfig(({ mode }) => {
  requireEnv(mode)

  return {
    base: '/ru/',
    // Один .env на дерево кабинетов: адреса ядра и входа общие для трёх сборок.
    envDir: fromHere('../..'),
    plugins: [react()],
    resolve: {
      alias: [
        { find: '@demo/ui/tokens.css', replacement: fromHere('../../packages/ui/src/tokens.css') },
        { find: '@demo/ui', replacement: fromHere('../../packages/ui/src/index.tsx') },
        { find: '@demo/api-client', replacement: fromHere('../../packages/api-client/src/index.tsx') },
        { find: '@demo/auth', replacement: fromHere('../../packages/auth/src/index.tsx') },
        { find: '@demo/domain', replacement: fromHere('../../packages/domain/src/index.ts') },
        { find: '@demo/i18n', replacement: fromHere('../../packages/i18n/src/index.ts') },
      ],
    },
    server: {
      port: 5174,
      fs: { allow: [fromHere('../..')] },
    },
  }
})
