import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './tests/setup/vitest.setup.ts',
    include: ['src/**/*.test.{ts,tsx}', 'tests/unit/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      enabled: true,
      reporter: ['text', 'json', 'lcov'],
      exclude: ['node_modules/', 'tests/e2e/', 'src/types.ts'],
    },
    watch: !process.env.CI,
    threads: true,
  },
});
