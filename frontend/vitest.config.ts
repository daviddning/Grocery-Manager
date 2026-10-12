import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// Test-only config, kept separate from vite.config.ts so the production
// `tsc -b` build never type-checks vitest options.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
    css: false,
    // forks (the default) is flaky on Windows; threads starts reliably.
    pool: 'threads',
  },
})
