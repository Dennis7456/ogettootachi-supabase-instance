// Test setup file
import { config } from 'dotenv'
import { resolve } from 'path'

// Load environment variables from .env.local in the frontend directory
config({ path: resolve(__dirname, '../ogetto-otachi-frontend/.env.local') })

// Set default test values if environment variables are not set
if (!process.env.VITE_SUPABASE_URL) {
  process.env.VITE_SUPABASE_URL = 'http://localhost:54321'
}

if (!process.env.VITE_SUPABASE_ANON_KEY) {
  process.env.VITE_SUPABASE_ANON_KEY = 'test-key'
}

if (!process.env.OPENAI_API_KEY) {
  process.env.OPENAI_API_KEY = 'test-openai-key'
}

// Global test configuration
global.testTimeout = 30000 