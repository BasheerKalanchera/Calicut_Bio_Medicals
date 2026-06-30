import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Cabio Sales OS',
        short_name: 'Cabio',
        description: 'Medical equipment sales management',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: '/Cabio logo.jpeg',
            sizes: '192x192',
            type: 'image/jpeg'
          },
          {
            src: '/Cabio logo.jpeg',
            sizes: '512x512',
            type: 'image/jpeg'
          }
        ]
      }
    })
  ],
  server: {
    allowedHosts: true,
    host: true,
    proxy: {
      '/api': 'http://localhost:8000'
    }
  }
})
