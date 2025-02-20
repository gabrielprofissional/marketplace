import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    proxy: {
      '/api': 'http://localhost:3000' // Aqui você redireciona todas as requisições /api para o backend
    }
  }
})
