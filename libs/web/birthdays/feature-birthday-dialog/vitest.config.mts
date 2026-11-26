import { defineConfig } from 'vitest/config';

export default defineConfig(() => ({
  root: import.meta.dirname,
  cacheDir: '../../../../node_modules/.vite/libs/web/birthdays/feature-birthday-dialog',
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    name: 'web-birthdays-feature-birthday-dialog',
    watch: false,
    globals: true,
    environment: 'jsdom',
    setupFiles: ['src/test-setup.ts'],
    include: ['{src,tests}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    passWithNoTests: true,
    reporters: ['default'],
    coverage: {
      reportsDirectory: '../../../../coverage/libs/web/birthdays/feature-birthday-dialog',
      provider: 'v8' as const,
    },
  },
}));
