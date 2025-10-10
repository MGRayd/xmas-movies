import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'   // <-- add

export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),  // <-- add
    },
  },
})