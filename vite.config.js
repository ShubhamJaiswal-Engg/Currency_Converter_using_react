import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/frankfurter': {
        target: 'https://api.frankfurter.dev',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/frankfurter/, '/v1'),
      },
    },
  },
  preview: {
    proxy: {
      '/frankfurter': {
        target: 'https://api.frankfurter.dev',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/frankfurter/, '/v1'),
      },
    },
  },
})
