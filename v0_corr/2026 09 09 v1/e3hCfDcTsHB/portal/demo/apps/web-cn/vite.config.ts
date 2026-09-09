import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

const fromHere = (relative: string) => fileURLToPath(new URL(relative, import.meta.url))

const REQUIRED = [
  'VITE_API_URL',
  'VITE_AGENT_API',
  'VITE_KEYCLOAK_URL',
  'VITE_KEYCLOAK_REALM',
  'VITE_KEYCLOAK_CLIENT_ID',
]

/**
 * Сборка без адресов ядра и входа падает здесь, а не в браузере: такой бандл
 * выложился бы на домен и выглядел бы как сломанный кабинет.
 */
function requireEnv(mode: string): void {
  const env = loadEnv(mode, fromHere('../..'), 'VITE_')
  // Витрина дизайна: VITE_DEMO_OFFLINE=1 открывает кабинет на demo-данных без
  // ядра и Keycloak, поэтому адреса контура тогда не обязательны.
  if (env.VITE_DEMO_OFFLINE === '1') return
  const missing = REQUIRED.filter((key) => !env[key])
  if (missing.length > 0) {
    throw new Error(`Не заданы переменные сборки: ${missing.join(', ')}. Образец — portal/demo/.env.example`)
  }
}

// Базовый путь /cn/ совпадает с раскладкой шлюза и с redirect URIs клиента
// medmost-spa: обмен кода на токен возвращается ровно на этот путь.
export default defineConfig(({ mode }) => {
  requireEnv(mode)

  return {
    base: '/cn/',
    envDir: fromHere('../..'),
    plugins: [
      tanstackRouter({
        target: 'react',
        autoCodeSplitting: true,
      }),
      tailwindcss(),
      react(),
    ],
    resolve: {
      alias: [
        { find: '@demo/ui/globals.css', replacement: fromHere('../../packages/ui/src/styles/globals.css') },
        { find: '@demo/ui/lib/utils', replacement: fromHere('../../packages/ui/src/lib/utils.ts') },
        { find: '@demo/ui/components', replacement: fromHere('../../packages/ui/src/components/ui') },
        { find: '@demo/contracts', replacement: fromHere('../../packages/contracts/src/index.ts') },
        { find: '@demo/api-client', replacement: fromHere('../../packages/api-client/src/index.tsx') },
        { find: '@demo/auth', replacement: fromHere('../../packages/auth/src/index.tsx') },
        { find: '@demo/domain', replacement: fromHere('../../packages/domain/src/index.ts') },
        { find: '@demo/i18n', replacement: fromHere('../../packages/i18n/src/index.ts') },
      ],
    },
    server: {
      port: 5173,
      fs: { allow: [fromHere('../..')] },
    },
  }
})
