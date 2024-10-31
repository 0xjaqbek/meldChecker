import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve("./src"),
    },
  },
  server: {
    headers: {
      'Content-Security-Policy': `
        default-src 'self';
        script-src 'self' 'unsafe-inline' 'unsafe-eval' 
          https://*.walletconnect.org 
          https://*.walletconnect.com 
          https://verify.walletconnect.org 
          https://verify.walletconnect.com;
        style-src 'self' 'unsafe-inline' 
          https://fonts.googleapis.com 
          https://*.walletconnect.com;
        font-src 'self' 
          https://fonts.gstatic.com;
        img-src 'self' data: https: blob: 
          https://raw.githubusercontent.com 
          https://*.walletconnect.com 
          https://*.walletconnect.org;
        connect-src 'self' 
          https://*.walletconnect.com 
          https://*.walletconnect.org 
          wss://*.walletconnect.org
          wss://relay.walletconnect.org
          https://relay.walletconnect.org
          https://*.web3modal.com 
          https://*.web3modal.org
          https://api.web3modal.com 
          https://api.web3modal.org
          https://subnets.avax.network 
          wss://*.bridge.walletconnect.org 
          https://cloudflare-ipfs.com
          https://verify.walletconnect.org
          https://verify.walletconnect.com
          ws://localhost:*
          wss://localhost:*
          https://raw.githubusercontent.com;
        frame-src 'self' 
          https://*.walletconnect.com 
          https://*.walletconnect.org
          https://verify.walletconnect.org
          https://verify.walletconnect.com
          https://connect.trezor.io;
        worker-src 'self' blob:;
        manifest-src 'self';
        base-uri 'self';
        form-action 'self';
        media-src 'self' https://*.walletconnect.com;
        object-src 'none';
      `.replace(/\s+/g, ' ').trim()
    }
  },
  build: {
    outDir: 'build',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          web3: ['ethers', '@web3modal/wagmi', 'wagmi', 'viem']
        }
      }
    }
  },
  optimizeDeps: {
    include: ['@web3modal/wagmi', 'wagmi', 'viem']
  }
});