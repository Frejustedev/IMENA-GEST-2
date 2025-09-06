import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import { splitVendorChunkPlugin } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const isDev = mode === 'development';
    
    return {
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      
      // Optimisations de build
      build: {
        target: 'es2015',
        minify: false, // Désactiver la minification qui casse React
        rollupOptions: {
          output: {
            manualChunks(id) {
              // Vendor splitting optimisé
              if (id.includes('node_modules')) {
                if (id.includes('react') || id.includes('react-dom')) {
                  return 'react-vendor';
                }
                if (id.includes('recharts')) {
                  return 'charts';
                }
                if (id.includes('zustand') || id.includes('immer')) {
                  return 'state-management';
                }
                if (id.includes('@vitejs') || id.includes('vite')) {
                  return 'vite-vendor';
                }
                return 'vendor';
              }
              // Code splitting par feature
              if (id.includes('components/forms')) {
                return 'forms';
              }
              if (id.includes('components/icons')) {
                return 'icons';
              }
              if (id.includes('services')) {
                return 'services';
              }
            }
          }
        },
        chunkSizeWarningLimit: 500,
        cssCodeSplit: true,
        // Compression Brotli
        reportCompressedSize: true,
      },
      
      // Optimisations serveur dev
      server: {
        port: 5175,
        host: true,
        open: true,
        hmr: {
          port: 5175,
          overlay: false
        }
      },
      
      // Optimisations CSS
      css: {
        devSourcemap: isDev,
        preprocessorOptions: {
          scss: {
            additionalData: `@import "@/styles/design-system.css";`
          }
        }
      },
      
      // Plugins d'optimisation
      plugins: [
        react(),
        splitVendorChunkPlugin()
      ],
      
      // Optimisations des assets
      assetsInclude: ['**/*.woff2', '**/*.woff'],
      
      // Configuration esbuild pour optimiser
      esbuild: {
        target: 'es2015',
        drop: isDev ? [] : ['console', 'debugger'],
        legalComments: 'none'
      },
      
      // Optimisations dependencies
      optimizeDeps: {
        include: [
          'react',
          'react-dom',
          'recharts',
          'zustand',
          'immer'
        ],
        exclude: []
      }
    };
});
