import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import assetManifest from './plugins/assetManifest.js'
import pdfjsAssets from './plugins/pdfjsAssets.js'

// base './' → bản build chạy được ở bất kỳ đường dẫn nào
// (GitHub Pages /ten-repo/, Vercel, Netlify, Cloudflare Pages…)
export default defineConfig({
  base: './',
  plugins: [react(), assetManifest(), pdfjsAssets()],
  build: {
    chunkSizeWarningLimit: 900,
  },
})
