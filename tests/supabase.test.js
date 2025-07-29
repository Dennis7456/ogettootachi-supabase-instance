const supabase = require('../src/utils/supabase');

describe('Supabase Client', () => {
  test('should initialize client with valid configuration', () => {
    const client = supabase.getClient();
    expect(client).toBeDefined();
    expect(client.supabaseUrl).toBeDefined();
    expect(client.supabaseKey).toBeDefined();
  });

  test('should throw error for missing configuration', () => {
    // Save original env
    const originalEnv = { ...process.env };
    
    // Clear the module cache and environment variables
    jest.resetModules();
    
    // Remove required env vars
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_ANON_KEY;
    delete process.env.NODE_ENV; // Ensure we don't use any cached config
    
    // Mock the config to ensure it doesn't have any values
    jest.mock('../src/config/config', () => ({
      supabase: {}
    }));
    
    // Test that it throws
    expect(() => {
      const newSupabase = require('../src/utils/supabase');
      newSupabase.getClient();
    }).toThrow('Supabase URL and anon key are required');
    
    // Restore original environment
    Object.assign(process.env, originalEnv);
  });

  test('should return admin client when service role key is provided', () => {
    const adminClient = supabase.getAdminClient();
    expect(adminClient).toBeDefined();
  });
});
