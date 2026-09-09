import { defineConfig } from '@playwright/test'

/**
 * e2e без входа: порт :4173 не прописан в redirect URIs realm.
 * Проверяем, что шлюз-подобная раздача отдаёт HTML кабинета.
 */
export default defineConfig({
  testDir: './e2e',
  use: {
    baseURL: 'http://127.0.0.1:4173',
  },
  webServer: {
    command: 'pnpm run serve',
    port: 4173,
    reuseExistingServer: !process.env.CI,
  },
})
