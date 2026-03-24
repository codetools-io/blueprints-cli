import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['**/__tests__/**/*.mjs', '**/?(*.)+(spec|test).mjs'],
    exclude: ['**/node_modules/**', '**/.blueprints/**'],
    clearMocks: true,
    globals: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      include: ['app/**/*.mjs'],
      exclude: [
        'app/**/*.test.mjs',
        'app/__mocks__/**',
        'app/cli.mjs',
        'app/pkg.mjs',
        // Re-export barrel files — trivial, add no test value
        'app/**/index.mjs',
      ],
      thresholds: {
        lines: 60,
        functions: 70,
        branches: 50,
        statements: 60,
      },
    },
  },
})
