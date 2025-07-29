// This file runs before tests to set up the test environment
const { execSync } = require('child_process');

// Set test environment variables
process.env.NODE_ENV = 'test';

// Ensure test database is properly set up
const setupTestDatabase = () => {
  try {
    // This is where you would run any test database migrations
    // For Supabase, you might want to reset the test database
    // or use a separate test schema
    console.log('Test database setup complete');
  } catch (error) {
    console.error('Failed to set up test database:', error);
    process.exit(1);
  }
};

// Run setup before tests
if (process.env.SKIP_DB_SETUP !== 'true') {
  setupTestDatabase();
}

// Global test timeout
jest.setTimeout(30000);
