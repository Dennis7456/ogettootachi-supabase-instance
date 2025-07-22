/* eslint-disable no-console, no-undef */
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const _supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
const _supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

// Utility function for logging errors
const _logError = (prefix, _error) => {
  if (_error) {
    console.error(`❌ ${prefix}:`, _error.message || _error);
  }
};

console.log('   Service Role Key:', _supabaseServiceKey.substring(0, 20) + '...');

const _supabase = createClient(_supabaseUrl, _supabaseServiceKey);

async function checkConnection() {
  try {
    // Test basic connection
    const { _data, _error } = await _supabase
      .from('documents')
      .select('count(*)', { count: 'exact', head: true });

    _logError('Connection failed', _error);

    if (_error) {
      return;
    }

    // Get document count
    const { count, _error: _countError } = await _supabase
      .from('documents')
      .select('*', { count: 'exact', head: true });

    _logError('Count failed', _countError);

    if (count !== undefined) {
      console.log(`Total documents: ${count}`);
    }

    // List recent documents
    const { _data: _docs, _error: _listError } = await _supabase
      .from('documents')
      .select('id, title, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    _logError('List failed', _listError);

    if (_docs) {
      console.log('Recent Documents:');
      _docs.forEach((_doc, _index) => {
        console.log(`   ${_index + 1}. ${_doc.title} (${_doc.id}) - ${_doc.created_at}`);
      });
    }

    console.log('\n⚠️  If you\'re looking at a remote dashboard (https://supabase.com/...)');
  } catch (_error) {
    console.error('❌ Check failed:', _error.message);
  }
}

checkConnection();
