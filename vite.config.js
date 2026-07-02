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
    commonjsOptions: {
      include: [/node_modules/]
    },
    esbuild: {
      loader: {
        '.js': 'jsx', 
      },
    },
  },

  server: {
    port: 5173,
    strictPort: true,
    host: true, 
    hmr: {
      protocol: 'ws',
      host: 'localhost',
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
        target: 'http://localhost:3000',
        changeOrigin: true,
      
       
      },
      '/socket.io': { 
        target: 'http://localhost:3000',
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
    force: true,
    include: ['react', 'react-dom', 'socket.io-client'] 
  },

  define: {
    'process.env': {} 
  }
})
