import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'framer-motion', 'lucide-react'],
  },
  build: {
    sourcemap: false,
    chunkSizeWarningLimit: 1200,
    // No manualChunks — string-matching packages into hand-picked chunks
    // (vendor/ui/utils/deps) broke in production: any package not matched
    // by name (recharts, @sentry/react) fell into a catch-all chunk that
    // could load before the 'vendor' chunk holding React itself finished
    // initializing, causing "Cannot read properties of undefined (reading
    // 'forwardRef')". Rollup's automatic chunking respects the real
    // module dependency graph instead of a hand-maintained name list.
  },
});
