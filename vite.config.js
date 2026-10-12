import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    // The backend's CORS allowlist includes http://localhost:3000
    port: 3000,
    strictPort: true,
  },
  build: {
    // Same output folder as CRA, so the gh-pages deploy script and Vercel settings keep working
    outDir: 'build',
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/setupTests.js',
  },
});
