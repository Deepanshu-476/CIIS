import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
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

  // Fix for Material-UI v4 + Vite compatibility
  build: {
    commonjsOptions: {
      include: [/node_modules/]
    },
    esbuild: {
      loader: {
        '.js': 'jsx', // Enabling JSX syntax for .js files
      },
    },
  },

  server: {
    port: 5173,
    strictPort: true,
    host: true, // Expose to network
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      port: 5173, // ✅ Same as server port
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
      '/socket.io': { // ✅ Add socket.io proxy
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
        ws: true, // Enable WebSocket proxying
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
    'process.env': {} // For compatibility
  }
})
