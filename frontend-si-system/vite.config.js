import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(),tailwindcss(),],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001', // Point to your NestJS port
        changeOrigin: true,
        // Optional: remove /api from the path before it hits NestJS
        // rewrite: (path) => path.replace(/^\/api/, '') 
      },
    },
  },
})