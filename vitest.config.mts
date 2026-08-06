import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

const emptyModule = fileURLToPath(new URL('./tests/stubs/empty.ts', import.meta.url))

export default defineConfig({
  resolve: {
    // Native tsconfig path resolution — replaces vite-tsconfig-paths.
    tsconfigPaths: true,
    alias: {
      'server-only': emptyModule,
      'client-only': emptyModule,
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    exclude: ['node_modules', '.next', 'tests/e2e'],
  },
})
