import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

const fromHere = (relative: string) => fileURLToPath(new URL(relative, import.meta.url))

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      { find: '@demo/ui/lib/utils', replacement: fromHere('../../packages/ui/src/lib/utils.ts') },
      { find: '@demo/ui/components', replacement: fromHere('../../packages/ui/src/components/ui') },
      { find: '@demo/contracts', replacement: fromHere('../../packages/contracts/src/index.ts') },
      { find: '@demo/domain', replacement: fromHere('../../packages/domain/src/index.ts') },
      { find: '@demo/i18n', replacement: fromHere('../../packages/i18n/src/index.ts') },
    ],
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
  },
})
