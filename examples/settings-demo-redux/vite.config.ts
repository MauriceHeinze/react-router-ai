import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const weaviateTarget = env.VITE_WEAVIATE_DATABASE_URL

  return {
    plugins: [react()],
    resolve: {
      alias: {
        'react-router-ai': fileURLToPath(new URL('../../packages/react-router-ai/src/index.ts', import.meta.url)),
      },
    },
    server: weaviateTarget
      ? {
          proxy: {
            '/weaviate-api': {
              target: weaviateTarget.startsWith('http') ? weaviateTarget : `https://${weaviateTarget}`,
              changeOrigin: true,
              rewrite: (path) => path.replace(/^\/weaviate-api/, ''),
            },
          },
        }
      : undefined,
  }
})
