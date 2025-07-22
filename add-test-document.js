/* eslint-disable no-console, no-undef */
import { createClient } from '@supabase/supabase-js';

const config = {
  SUPABASE_URL: 'http://127.0.0.1:54321',
  SUPABASE_SERVICE_ROLE_KEY:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU',
};

async function addTestDocument() {
  try {
    const _supabase = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);

    const testDocument = {
      title: 'Dashboard Test Document',
      content: 'This is a test document for the dashboard functionality.',
      category: 'test',
    };

    const { data, error } = await _supabase.from('documents').insert(testDocument).select();

    if (error) {
      console.error('Error adding test document:', error);
      return;
    }

    if (data) {
      console.log('Test document added successfully:', data);
    }
  } catch (_error) {
    console.error('Unexpected error:', _error);
  }
}

addTestDocument().catch(console.error);
