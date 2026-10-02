import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    // The tested code is pure data logic (no DOM), so the lighter node environment is enough.
    environment: 'node',
  },
})
