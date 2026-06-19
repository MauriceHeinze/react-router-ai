import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'react-router-ai': fileURLToPath(new URL('../../packages/react-router-ai/src/index.ts', import.meta.url)),
    },
  },
})
