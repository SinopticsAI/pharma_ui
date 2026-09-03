import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const fromHere = (relative: string) => fileURLToPath(new URL(relative, import.meta.url))

// Консоль оператора живёт на том же origin, но по другому пути: /ru/.
export default defineConfig({
  base: '/ru/',
  plugins: [react()],
  resolve: {
    alias: [
      { find: '@demo/ui/tokens.css', replacement: fromHere('../../packages/ui/src/tokens.css') },
      { find: '@demo/ui', replacement: fromHere('../../packages/ui/src/index.tsx') },
      { find: '@demo/domain', replacement: fromHere('../../packages/domain/src/index.ts') },
      { find: '@demo/i18n', replacement: fromHere('../../packages/i18n/src/index.ts') },
      { find: '@demo/mock', replacement: fromHere('../../packages/mock/src/index.ts') },
    ],
  },
  server: {
    port: 5174,
    fs: { allow: [fromHere('../..')] },
  },
})
