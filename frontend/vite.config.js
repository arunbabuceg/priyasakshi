import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(process.cwd(), 'src'),
    },
  },
  // Only expose env vars prefixed with VITE_ to the client.
  envPrefix: ['VITE_'],
  server: {
    host: '0.0.0.0',
    port: 3000,
    strictPort: true,
    // Emergent preview environments serve over https via a reverse proxy;
    // this hint lets Vite's HMR client build the correct websocket URL.
    hmr: {
      clientPort: 443,
    },
    // Allow the auto-generated preview host through Vite 6's host check.
    allowedHosts: true,
  },
  preview: {
    host: '0.0.0.0',
    port: 3000,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 900,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
    css: false,
  },
});
