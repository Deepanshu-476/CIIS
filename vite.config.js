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
            if (id.includes('react/') || id.includes('react-dom/') || id.includes('react-router-dom/')) {
              return 'vendor-react';
            }
            if (id.includes('@mui/') || id.includes('@emotion/')) {
              return 'vendor-mui';
            }
            if (id.includes('recharts') || id.includes('chart.js') || id.includes('react-chartjs-2') || id.includes('d3-')) {
              return 'vendor-charts';
            }
            if (id.includes('jspdf') || id.includes('xlsx') || id.includes('html2canvas')) {
              return 'vendor-export';
            }
            if (id.includes('lucide-react') || id.includes('react-icons') || id.includes('sweetalert2') || id.includes('react-toastify') || id.includes('react-select')) {
              return 'vendor-ui';
            }
            if (id.includes('socket.io-client') || id.includes('engine.io-client')) {
              return 'vendor-socket';
            }
            if (id.includes('date-fns') || id.includes('dayjs') || id.includes('axios')) {
              return 'vendor-utils';
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
