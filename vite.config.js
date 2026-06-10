import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  base: '/',
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
  },
  plugins: [react(), tailwindcss()],
  build: {
    target: 'esnext',
    minify: 'esbuild',
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('@react-three/rapier'))     return 'vendor-physics'
            if (id.includes('@react-three/postprocessing') || id.includes('postprocessing')) return 'vendor-post'
            if (id.includes('@react-three') || id.includes('three'))  return 'vendor-three'
            if (id.includes('framer-motion') || id.includes('@react-spring')) return 'vendor-ui'
            if (id.includes('react-dom') || id.includes('react/'))   return 'react-core'
            if (id.includes('zustand'))                 return 'state'
          }
        },
      },
    },
  },
  optimizeDeps: {
    include: ['three', '@react-three/fiber', 'zustand', 'framer-motion'],
  },
})
