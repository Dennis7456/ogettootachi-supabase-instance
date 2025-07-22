import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
dotenv.config();

// Debug logging function to replace console.log
function debugLog(...args) {
  if (process.env.DEBUG === 'true') {
    const timestamp = new Date().toISOString();
    const logMessage = args
      .map(arg => (typeof arg === 'object' ? JSON.stringify(arg) : arg))
      .join(' ');
    process.stderr.write(`[DEBUG ${timestamp}] ${logMessage}\n`);
  }
}

const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';
const _supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixStoragePolicies() {
  try {
    // Drop existing policies
    const dropPolicies = [
      'DROP POLICY IF EXISTS "Documents are uploadable by admins" ON storage.objects;',
      'DROP POLICY IF EXISTS "Documents are accessible by authenticated users" ON storage.objects;',
      'DROP POLICY IF EXISTS "Service role can access all storage" ON storage.objects;',
      'DROP POLICY IF EXISTS "Documents are updatable by admins" ON storage.objects;',
      'DROP POLICY IF EXISTS "Documents are deletable by admins" ON storage.objects;',
    ];

    for (const sql of dropPolicies) {
      const { error } = await _supabase.rpc('exec_sql', { sql });
      if (error) {
        debugLog('❌ Error dropping policy:', error);
      }
    }

    // Create new policies
    const createPolicies = [
      `CREATE POLICY "Documents are uploadable by admins" ON storage.objects
        FOR INSERT WITH CHECK (
          bucket_id = 'documents' AND 
          (auth.jwt() ->> 'role' = 'admin' OR auth.role() = 'service_role')
        );`,
      `CREATE POLICY "Documents are updatable by admins" ON storage.objects
        FOR UPDATE USING (
          bucket_id = 'documents' AND 
          (auth.jwt() ->> 'role' = 'admin' OR auth.role() = 'service_role')
        );`,
      `CREATE POLICY "Documents are deletable by admins" ON storage.objects
        FOR DELETE USING (
          bucket_id = 'documents' AND 
          (auth.jwt() ->> 'role' = 'admin' OR auth.role() = 'service_role')
        );`,
      `CREATE POLICY "Documents are accessible by authenticated users" ON storage.objects
        FOR SELECT USING (
          bucket_id = 'documents' AND auth.role() = 'authenticated'
        );`,
      `CREATE POLICY "Service role can access all storage" ON storage.objects
        FOR ALL USING (auth.role() = 'service_role');`,
    ];

    for (const sql of createPolicies) {
      const { error } = await _supabase.rpc('exec_sql', { sql });
      if (error) {
        debugLog('❌ Error creating policy:', error);
      }
    }

    debugLog('✅ Storage policies updated successfully');
  } catch (error) {
    debugLog('❌ Unexpected error:', error.message);
  }
}

fixStoragePolicies();
