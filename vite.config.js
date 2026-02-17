import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'Lalbet Trading PLC',
        short_name: 'Lalbet',
        description: 'Lalbet Trading PLC Application',
        theme_color: '#ffffff',
        icons: [
          {
            src: 'Lalbet logo-modified.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'Lalbet logo-modified.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
})
