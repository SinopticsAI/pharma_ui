import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const fromHere = (relative: string) => fileURLToPath(new URL(relative, import.meta.url))

export default defineConfig({
  base: '/',
  plugins: [react()],
  resolve: {
    alias: [{ find: '@', replacement: fromHere('./src') }],
  },
  server: {
    port: 5175,
  },
})
