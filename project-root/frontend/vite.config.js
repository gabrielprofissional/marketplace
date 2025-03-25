import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react()],
  root: path.resolve(__dirname), // Aponta para project-root/
  css: {
    postcss: path.resolve(__dirname, '../postcss.config.cjs'), // Aponta para postcss.config.cjs em marketplace/
  },
  server: {
    port: 5173,
    proxy: {
      '/uploads': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
