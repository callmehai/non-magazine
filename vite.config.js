import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import assetManifest from './plugins/assetManifest.js'

// base './' → bản build chạy được ở bất kỳ đường dẫn nào
// (GitHub Pages /ten-repo/, Vercel, Netlify, Cloudflare Pages…)
export default defineConfig({
  base: './',
  plugins: [react(), assetManifest()],
  build: {
    chunkSizeWarningLimit: 900,
  },
})
