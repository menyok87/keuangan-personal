import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173
  },
  preview: {
    host: '0.0.0.0',
    port: 3000,
    // Allow access from any host for production deployment
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      'keuangan99.com',
      'www.keuangan99.com',
      '.keuangan99.com', // Wildcard for subdomains
      'all' // Allow all hosts (for production)
    ]
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          supabase: ['@supabase/supabase-js'],
          icons: ['lucide-react']
        }
      }
    }
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});