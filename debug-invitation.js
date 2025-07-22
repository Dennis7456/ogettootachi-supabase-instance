/* eslint-disable no-console, no-undef, no-unused-vars */
import { createClient } from '@supabase/supabase-js';

// Debug Invitation System - Find out why emails aren't being sent
const config = {
  SUPABASE_URL: 'http://127.0.0.1:54321',
  SUPABASE_ANON_KEY:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0',
  SUPABASE_SERVICE_ROLE_KEY:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU',
};

const _supabase = createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY);
const _supabaseAdmin = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);

// Utility function for logging errors
const logError = (prefix, error) => {
  if (error) {
    console.error(`❌ ${prefix}:`, error.message);
  }
};

async function debugInvitation() {
  // Test 1: Check if Edge Function is accessible
  try {
    const _response = await fetch(`${config.SUPABASE_URL}/functions/v1/handle-invitation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        action: 'invite',
        email: 'debug-test@example.com',
        role: 'staff',
        full_name: 'Debug Test User',
      }),
    });
    const _responseText = await _response.text();
    if (_response.ok) {
      try {
        const _jsonResponse = JSON.parse(_responseText);
        console.log('Handle invitation function response:', _jsonResponse);
      } catch (_e) {
        console.error('Failed to parse response:', _e);
      }
    }
  } catch (_error) {
    console.error('Error in handle-invitation function:', _error);
  }

  // Test 2: Check database for invitations
  try {
    const { _data: _invitations, _error } = await _supabaseAdmin
      .from('user_invitations')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    logError('Error fetching invitations', _error);

    if (_invitations) {
      _invitations.forEach((_inv, _index) => {
        console.log(`Invitation ${_index + 1}:`, _inv);
      });
    }
  } catch (_error) {
    console.error('Error in invitation database check:', _error);
  }

  // Test 3: Check if send-invitation-email function exists
  try {
    const _response = await fetch(`${config.SUPABASE_URL}/functions/v1/send-invitation-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({
        email: 'test@example.com',
        role: 'staff',
        invitation_token: 'test-token-123',
      }),
    });
    const _responseText = await _response.text();

    if (_response.status === 404) {
      console.warn(
        "⚠️ send-invitation-email function not found - this might be why emails aren't sent"
      );
    } else {
      console.log('✅ Send invitation email function response:', _responseText);
    }
  } catch (_error) {
    console.error('Error in send-invitation-email function:', _error);
  }

  // Test 4: Check Mailpit/Inbucket
  try {
    const _response = await fetch('http://127.0.0.1:54324/api/v1/messages');
    const _messages = await _response.json();

    if (_messages.messages && _messages.messages.length > 0) {
      _messages.messages.slice(0, 3).forEach((_msg, _index) => {
        console.log(`Message ${_index + 1}:`, _msg);
      });
    } else {
      console.warn('No messages found in Mailpit');
    }
  } catch (_error) {
    console.error('Error checking Mailpit messages:', _error);
  }

  // Test 5: Check if functions are deployed
  try {
    const _functionsResponse = await fetch(`${config.SUPABASE_URL}/functions/v1/`, {
      headers: {
        Authorization: `Bearer ${config.SUPABASE_SERVICE_ROLE_KEY}`,
      },
    });

    if (_functionsResponse.ok) {
      console.log('✅ Functions endpoint is accessible');
    } else {
      console.warn('⚠️ Functions endpoint is not accessible');
    }
  } catch (_error) {
    console.error('Error checking functions endpoint:', _error);
  }

  // Recommendations
  console.log('Troubleshooting Recommendations:');
  console.log('1. Check if send-invitation-email function exists and is called');
  console.log('2. If database shows invitations but email service shows no messages:');
}

debugInvitation().catch(console.error);
