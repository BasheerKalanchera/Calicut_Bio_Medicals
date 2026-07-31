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
        id: '/',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/icon-512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },
      includeAssets: ['favicon.svg', 'icon-192.png', 'icon-512.png', 'icon-512-maskable.png']
    })
  ],
  server: {
    allowedHosts: true,
    host: true,
    proxy: {
      '/api': 'http://localhost:8000'
    }
  },
  preview: {
    allowedHosts: true,
    proxy: {
      '/api': 'http://localhost:8000'
    }
  }
})
