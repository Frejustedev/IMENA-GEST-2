import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // Inject environment variables at build time
    'process.env.REACT_APP_API_URL': JSON.stringify('https://web-production-21857.up.railway.app/api/v1'),
    'process.env.REACT_APP_NODE_ENV': JSON.stringify('production'),
  },
  build: {
    target: 'es2020',
    minify: false,
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: undefined,
      }
    }
  },
  esbuild: {
    target: 'es2020'
  }
});
