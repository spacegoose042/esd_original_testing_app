import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    manifest: true,
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    }
  },
  server: {
    proxy: {
      '/api': {
        target: process.env.NODE_ENV === 'production'
          ? 'https://esdoriginaltestingapp-production.up.railway.app'
          : 'http://localhost:3001',
        changeOrigin: true,
        secure: false
      }
    }
  }
})
