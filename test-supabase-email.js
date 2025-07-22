/* eslint-disable no-console, no-undef */
import { createClient } from "@supabase/supabase-js";

// Test Supabase Auth Email Functionality
const _config = {
  SUPABASE_URL: "http://127.0.0.1:54321",
  SUPABASE_SERVICE_ROLE_KEY:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU",
};

// Utility function for logging errors
const _logError = (prefix, _error) => {
  if (_error) {
    console.error(`❌ ${prefix}:`, _error.message || _error);
  }
};

async function testSupabaseEmail() {
  const _supabaseAdmin = createClient(_config.SUPABASE_URL, _config.SUPABASE_SERVICE_ROLE_KEY);

  // Test 1: Try to create a user and send invite
  try {
    const _testEmail = `test-email-${Date.now()}@example.com`;
    const { _data: _userData, _error: _userError } = await _supabaseAdmin.auth.admin.createUser({
      email: _testEmail,
      password: "testPassword123",
      email_confirm: false,
      user_metadata: {
        role: "staff",
        full_name: "Test User",
      },
    });

    _logError("User creation error", _userError);

    if (_userData) {
      console.log("User created successfully:", _userData);
    }
  } catch (_error) {
    console.error("Unexpected error in user creation:", _error);
  }

  // Test 2: Try to send reset password email (this should trigger email)
  try {
    const _testEmail = "password-reset-test@example.com";
    const { _data: _resetData, _error: _resetError } = await _supabaseAdmin.auth.admin.generateLink(
      {
        type: "recovery",
        email: _testEmail,
        options: {
          redirectTo: "http://localhost:5173/password-setup",
        },
      }
    );

    _logError("Password reset link generation error", _resetError);

    if (_resetData) {
      console.log("Password reset link generated:", _resetData.properties.action_link);
    }
  } catch (_error) {
    console.error("Unexpected error in password reset:", _error);
  }

  // Test 3: Check if Mailpit received any emails
  try {
    const _response = await fetch("http://127.0.0.1:54324/api/v1/messages");
    const _data = await _response.json();

    if (_data.messages && _data.messages.length > 0) {
      console.log("Mailpit Messages:");
      _data.messages.slice(0, 5).forEach((_msg, _index) => {
        console.log(`Message ${_index + 1}:`, _msg);
      });
    } else {
      console.log("No messages found in Mailpit");
    }
  } catch (_error) {
    console.error("Error checking Mailpit messages:", _error);
  }

  console.log("3. For local development, Supabase should auto-use Inbucket/Mailpit");
}

testSupabaseEmail().catch(console.error);
