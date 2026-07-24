import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate', // Aplikacja sama się zaktualizuje u usera, gdy wrzucisz nową wersję
      includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
      manifest: {
        name: 'Flanki Hub',
        short_name: 'Flanki',
        description: 'Uczelniana Liga Flanek',
        theme_color: '#020617', // Kolor paska powiadomień (Twój slate-950)
        background_color: '#020617', // Kolor tła przy odpalaniu
        display: 'standalone', // KLUCZOWE: Odpala się bez paska URL przeglądarki!
        orientation: 'portrait',
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ]
})