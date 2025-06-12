import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig(({ command }) => {
  // Base configuration for both dev and build
  const baseConfig = {
    plugins: [react()],
    define: {
      global: 'globalThis',
    },
    server: {
      proxy: {
        '/login': { 
          target: 'http://localhost:8081',
          changeOrigin: true,
          secure: false
        }
      }
    },
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
      },
    },
  };

  // For development server (npm run dev) - normal React app
  if (command === 'serve') {
    return {
      ...baseConfig,
      root: resolve(__dirname, 'src/popup'),
      publicDir: resolve(__dirname, 'public'),
    };
  }

  // For build mode - Chrome extension build
  return {
    ...baseConfig,
    build: {
      rollupOptions: {
        input: {
          popup: resolve(__dirname, 'src/popup/index.html'),
          content: resolve(__dirname, 'src/content/content.ts'),
          background: resolve(__dirname, 'src/background/background.ts'),
        },
        output: {
          entryFileNames: (chunkInfo) => {
            if (chunkInfo.name === 'content') return 'content.js'
            if (chunkInfo.name === 'background') return 'background.js'
            if (chunkInfo.name === 'popup') return 'popup.js'
            return '[name].js'
          },
          chunkFileNames: '[name].js',
          assetFileNames: (assetInfo) => {
            if (assetInfo.name === 'popup.html') return 'index.html'
            if (assetInfo.name === 'index.css') return 'popup.css'
            if (assetInfo.name === 'content.css') return 'content.css'
            return '[name].[ext]'
          }
        }
      },
      outDir: 'dist',
      emptyOutDir: true,
      minify: false,
    },
  };
});
