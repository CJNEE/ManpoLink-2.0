import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (id.includes('react') || id.includes('react-dom')) return 'vendor_react';
          // Avoid creating a separate vendor chunk for leaflet/react-leaflet
          // to prevent circular chunk references with react packages.
          if (id.includes('recharts') || id.includes('@mui')) return 'vendor_charts';
          // Let Rollup handle other node_modules to avoid circular chunk references
          return undefined;
        }
      }
    }
  }
})

