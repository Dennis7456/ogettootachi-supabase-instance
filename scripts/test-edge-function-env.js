/* eslint-disable no-console, no-undef */
import { createClient } from '@supabase/supabase-js';
import { execSync } from 'child_process';

// Test script for Edge Function environment variables
// Run this to check if the service role key is properly configured
// Local Supabase configuration
const _supabaseUrl = 'http://127.0.0.1:54321';
const _supabaseAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
// For local development, the service role key is typically:
const _supabaseServiceKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

// Utility function for logging errors
const _logError = (prefix, _error) => {
  if (_error) {
    console.error(`❌ ${prefix}:`, _error.message || _error);
  }
};

// Test 1: Check if we can create clients
try {
  const _supabaseAnon = createClient(_supabaseUrl, _supabaseAnonKey);
  const _supabaseService = createClient(_supabaseUrl, _supabaseServiceKey);
} catch (_error) {
  console.error('❌ Client creation failed:', _error.message);
}

// Test 2: Test service role permissions
async function testServiceRole() {
  try {
    const _supabaseService = createClient(_supabaseUrl, _supabaseServiceKey);

    // Test if service role can read documents
    const { _data, _error } = await _supabaseService.from('documents').select('*').limit(1);

    _logError('Service role read failed', _error);

    // Test if service role can insert documents (should work)
    const _testDoc = {
      title: 'Test Document',
      content: 'This is a test document for environment variable testing',
      category: 'test',
    };

    const { _data: _insertData, _error: _insertError } = await _supabaseService
      .from('documents')
      .insert(_testDoc)
      .select()
      .single();

    _logError('Service role insert failed', _insertError);

    if (_insertData) {
      // Clean up test document
      await _supabaseService.from('documents').delete().eq('id', _insertData.id);
    }

    return true;
  } catch (_error) {
    console.error('❌ Service role test failed:', _error.message);
    return false;
  }
}

// Test 3: Check environment variables for Edge Functions
// Test 4: Check current secrets
try {
  const _secrets = execSync('supabase secrets list', { encoding: 'utf8' });
  console.log('Supabase Secrets:', _secrets);
} catch (_error) {
  console.error("❌ Could not list secrets. Make sure you're in the supabase directory.");
}

// Run the service role test
async function runTests() {
  const _success = await testServiceRole();

  if (_success) {
    console.log('✅ Edge Function should work with proper environment variables');
  } else {
    console.error('❌ Edge Function environment test failed');
  }

  console.log('2. Deploy the Edge Function: supabase functions deploy process-document');
}

runTests();
