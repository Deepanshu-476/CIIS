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
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // Large standalone export tools that don't depend on React
            if (id.includes('jspdf') || id.includes('xlsx') || id.includes('html2canvas')) {
              return 'vendor-export';
            }
            // All React and React-dependent libraries together in one unified chunk to prevent useLayoutEffect/undefined errors
            if (
              id.includes('react') ||
              id.includes('react-dom') ||
              id.includes('react-router-dom') ||
              id.includes('@mui') ||
              id.includes('@emotion') ||
              id.includes('@date-io') ||
              id.includes('lucide-react') ||
              id.includes('sweetalert2') ||
              id.includes('recharts') ||
              id.includes('chart.js')
            ) {
              return 'vendor-react-core';
            }
          }
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
