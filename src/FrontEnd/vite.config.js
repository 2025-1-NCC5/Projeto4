// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
// https://vitejs.dev/config/
export default defineConfig({
plugins: [react()],
server: {
  port: 5173, // Garante que o frontend rode na porta esperada
    proxy: {
      // Requisições para /api serão redirecionadas para o backend Node.js
      '/api': {
      target: 'http://localhost:3000', // URL do seu backend Node.js
      changeOrigin: true, // Necessário para evitar problemas de CORS/origem
      // Opcional: reescrever o caminho se necessário (geralmente não é preciso aqui)
      // rewrite: (path) => path.replace(/^/api/, '')
        }
      }
    }
})