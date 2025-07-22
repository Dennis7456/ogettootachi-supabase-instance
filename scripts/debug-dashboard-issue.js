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

const _supabase = createClient(_supabaseUrl, _supabaseServiceKey);

async function debugDashboardIssue() {
  try {
    // Check 1: List all tables
    const { _data: _tables, _error: _tablesError } = await _supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');

    _logError('Failed to list tables', _tablesError);

    if (_tables) {
      console.log('Tables in public schema:');
      _tables.forEach((_table, _index) => {
        console.log(`   ${_index + 1}. ${_table.table_name}`);
      });
    }

    // Check 2: Count documents with service role
    const { count: _docCount, _error: _countError } = await _supabase
      .from('documents')
      .select('*', { count: 'exact', head: true });

    _logError('Failed to count documents', _countError);

    if (_docCount !== undefined) {
      console.log(`Total documents: ${_docCount}`);
    }

    // Check 3: List all documents with service role
    const { _data: _allDocs, _error: _listError } = await _supabase
      .from('documents')
      .select('*')
      .order('created_at', { ascending: false });

    _logError('Failed to list documents', _listError);

    if (_allDocs) {
      console.log('Recent Documents:');
      _allDocs.forEach((_doc, _index) => {
        console.log(`   ${_index + 1}. ${_doc.title} (${_doc.id})`);
      });
    }

    // Check 4: Test with anon role (what dashboard might use)
    const _anonSupabase = createClient(
      _supabaseUrl,
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
    );

    const { _data: _anonDocs, _error: _anonError } = await _anonSupabase
      .from('documents')
      .select('*')
      .limit(5);

    _logError('Anon role failed', _anonError);

    if (_anonDocs) {
      console.log('Documents accessible by anon role:');
      _anonDocs.forEach((_doc, _index) => {
        console.log(`   ${_index + 1}. ${_doc.title}`);
      });
    }

    // Check 5: Check RLS policies
    const { _data: _policies, _error: _policiesError } = await _supabase
      .from('information_schema.policies')
      .select('*')
      .eq('table_name', 'documents');

    _logError('Failed to check policies', _policiesError);

    if (_policies) {
      console.log('RLS Policies for documents table:');
      _policies.forEach((_policy, _index) => {
        console.log(`   ${_index + 1}. ${JSON.stringify(_policy)}`);
      });
    }

    // Check 6: Check if RLS is enabled
    const { _data: _rlsInfo, _error: _rlsError } = await _supabase
      .from('information_schema.tables')
      .select('is_row_security_enabled')
      .eq('table_name', 'documents')
      .eq('table_schema', 'public')
      .single();

    _logError('Failed to check RLS', _rlsError);

    if (_rlsInfo) {
      console.log('RLS Enabled:', _rlsInfo.is_row_security_enabled);
    }

    // Check 7: Create a test document and immediately query it
    const _testDoc = {
      title: 'Debug Test Document',
      content: 'This is a test document for debugging dashboard issues.',
      category: 'debug',
      file_path: '/debug/test-document.txt',
      file_type: 'text/plain',
    };

    const { _data: _newDoc, _error: _createError } = await _supabase
      .from('documents')
      .insert(_testDoc)
      .select()
      .single();

    _logError('Failed to create test document', _createError);

    if (_newDoc) {
      // Immediately query it
      const { _data: _queryDoc, _error: _queryError } = await _supabase
        .from('documents')
        .select('*')
        .eq('id', _newDoc.id)
        .single();

      _logError('Failed to query test document', _queryError);

      if (_queryDoc) {
        console.log('Test document created and retrieved successfully');
      }

      // Clean up
      await _supabase.from('documents').delete().eq('id', _newDoc.id);
    }

    console.log('Debug Recommendations:');
    console.log(
      '   - Check if you\'re looking at the correct project in Supabase dashboard'
    );
    console.log(
      '   - Check if you\'re in the right environment (local vs remote)'
    );
  } catch (_error) {
    console.error('❌ Debug failed:', _error.message);
    console.error('Error details:', _error);
  }
}

debugDashboardIssue();
