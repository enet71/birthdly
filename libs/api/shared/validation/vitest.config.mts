import { defineConfig } from 'vitest/config';

export default defineConfig(() => ({
  root: import.meta.dirname,
  cacheDir: '../../../../node_modules/.vite/libs/api/shared/validation',
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    name: 'api-shared-validation',
    watch: false,
    globals: true,
    environment: 'node',
    include: ['{src,tests}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    reporters: ['default'],
    passWithNoTests: true,
    coverage: {
      reportsDirectory: '../../../../coverage/libs/api/shared/validation',
      provider: 'v8' as const,
    },
  },
}));
