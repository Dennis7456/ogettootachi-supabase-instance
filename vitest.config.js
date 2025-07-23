import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import tsconfigPaths from 'vite-tsconfig-paths';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    tsconfigPaths({
      root: __dirname,
      projects: [resolve(__dirname, 'tsconfig.json')]
    })
  ],
  resolve: {
    alias: {
      '@supabase/supabase-js': resolve(__dirname, 'node_modules/@supabase/supabase-js')
    }
  },
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.js'],
    include: ['tests/**/*.{test,spec}.{js,ts}'],
    exclude: ['**/node_modules/**', '**/dist/**'],
    testTimeout: 30000, // 30 seconds for API calls
    hookTimeout: 30000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['tests/**', 'supabase/functions/**'],
      exclude: ['**/node_modules/**', '**/dist/**']
    }
  }
});
