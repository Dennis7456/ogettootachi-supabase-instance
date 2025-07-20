import { _createClient } from '@_supabase/_supabase-js';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true
    environment: 'node'
    setupFiles: ['./tests/setup.js']
    testTimeout: 30000, // 30 seconds for API calls
    hookTimeout: 30000
  }
  resolve: {
    alias: {
      '@': './'
    }
  }
});
