import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'


export default defineConfig({
  base: '/',

  resolve: {
    alias: [
      {
        find: /^@mui\/utils\/(.+)$/,
        replacement: fileURLToPath(new URL('./node_modules/@mui/utils/esm/$1/index.js', import.meta.url)),
      },
    ],
  },

  plugins: [
    react(),
    tailwindcss(),
  ],

  
  build: {
    target: 'es2020',
    cssCodeSplit: true,
    chunkSizeWarningLimit: 800,
    commonjsOptions: {
      include: [/node_modules/]
    },
    rollupOptions: {
      output: {
        // Only the libraries every page needs get shared vendor chunks. Heavy page-specific
        // libraries (charts, jspdf, xlsx, html2canvas) are left to Rollup so they load with the
        // pages that import them instead of on the login page.
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (/[\\/]node_modules[\\/](react|react-dom|react-router|react-router-dom|scheduler)[\\/]/.test(id)) {
            return 'vendor-react';
          }
          if (/[\\/]node_modules[\\/](@mui|@emotion|@date-io|@popperjs)[\\/]/.test(id)) {
            return 'vendor-mui';
          }
          return undefined;
        },
      },
    },
  },

  server: {
    port: 5173,
    strictPort: true,
    host: '127.0.0.1',
    hmr: {
      protocol: 'ws',
      host: '127.0.0.1',
      port: 5173, 
      clientPort: 5173,
      timeout: 5000
    },
    watch: {
      usePolling: true,
      interval: 1000
    },
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
      
       
      },
      '/socket.io': { 
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
        secure: false,
        ws: true, 
      }
    },
    cors: true,
    force: true
  },

  preview: {
    port: 5173,
    strictPort: true
  },

  optimizeDeps: {
    entries: ['index.html'],
    force: true,
    include: ['react', 'react-dom', 'socket.io-client'] 
  },

  define: {
    'process.env': {} 
  }
})
