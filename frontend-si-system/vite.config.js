import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(),tailwindcss(),],
  server: {
    host: '0.0.0.0',
    port: 5179,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://192.168.110.50:3004' , // Point to your NestJS port
        changeOrigin: true,
        // Optional: remove /api from the path before it hits NestJS
        // rewrite: (path) => path.replace(/^\/api/, '') 
      },
    },
  },
})
