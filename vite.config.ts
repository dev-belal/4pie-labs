import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Isolate heavy Spline 3D bundles into separate async chunks
          'spline-runtime': ['@splinetool/runtime'],
          'spline-react': ['@splinetool/react-spline'],
          // Separate vendor libs
          'vendor-react': ['react', 'react-dom'],
          'vendor-motion': ['framer-motion'],
        }
      }
    }
  }
})
