/* eslint-disable no-undef */
import { config } from 'dotenv';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { beforeAll, afterAll } from 'vitest';

// Load environment variables from root .env file
const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../.env') });

// Validate required environment variables
const requiredEnvVars = [
  'SUPABASE_URL', 
  'SUPABASE_ANON_KEY', 
  'SUPABASE_SERVICE_ROLE_KEY', 
  'FRONTEND_URL'
];

requiredEnvVars.forEach(varName => {
  if (!process.env[varName]) {
    console.warn(`⚠️ Warning: ${varName} is not set in the environment`);
  }
});

// Set default test values if environment variables are not set
const defaultTestConfig = {
  SUPABASE_URL: 'http://localhost:54321',
  SUPABASE_ANON_KEY: 'test-anon-key',
  SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
  FRONTEND_URL: 'http://localhost:5173'
};

Object.entries(defaultTestConfig).forEach(([key, defaultValue]) => {
  if (!process.env[key]) {
    process.env[key] = defaultValue;
    console.warn(`🔧 Using default value for ${key}: ${defaultValue}`);
  }
});

// Global test configuration
export const setup = {
  async beforeAll() {
    // Any global setup logic can be added here
    console.log('🧪 Global test setup initiated');
  },

  async afterAll() {
    // Any global cleanup logic can be added here
    console.log('🧹 Global test cleanup completed');
  }
};

// Optional: Add global hooks
beforeAll(setup.beforeAll);
afterAll(setup.afterAll);

// Export configuration for use in tests
export default {
  supabaseConfig: {
    url: process.env.SUPABASE_URL,
    anonKey: process.env.SUPABASE_ANON_KEY,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY
  }
};
