import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve("./src"),
    },
  },
  build: {
    outDir: 'build',
    sourcemap: false
  },
  server: {
    headers: {
      'Content-Security-Policy': `
        default-src 'self';
        script-src 'self' 'unsafe-inline' 'unsafe-eval';
        style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
        font-src 'self' https://fonts.gstatic.com;
        img-src 'self' data: https: blob:;
        connect-src 'self' 
          https://*.walletconnect.com 
          https://*.walletconnect.org 
          https://api.web3modal.org 
          https://subnets.avax.network 
          wss://*.bridge.walletconnect.org 
          https://cloudflare-ipfs.com;
        frame-src 'self' https://*.walletconnect.com https://*.walletconnect.org;
      `.replace(/\s+/g, ' ').trim()
    }
  }
})