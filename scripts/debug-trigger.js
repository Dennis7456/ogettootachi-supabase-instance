/* eslint-disable no-console, no-undef, no-unused-vars */
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "http://127.0.0.1:54321";
const supabaseServiceKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";
const _supabaseService = createClient(supabaseUrl, supabaseServiceKey);

// Utility function for logging errors
const logError = (prefix, error) => {
  if (error) {
    console.error(`❌ ${prefix}:`, error.message);
  }
};

async function debugTrigger() {
  try {
    // Check if trigger exists
    const { _data: _triggers, _error: _triggerError } = await _supabaseService.rpc(
      "check_trigger_exists",
      {
        trigger_name: "on_auth_user_created",
      }
    );
    logError("Trigger check error", _triggerError);

    // Check if function exists
    const { _data: _functions, _error: _functionError } = await _supabaseService.rpc(
      "check_function_exists",
      {
        function_name: "handle_new_user",
      }
    );
    logError("Function check error", _functionError);

    // Test the function directly
    const _testUserId = "00000000-0000-0000-0000-000000000000";
    const { _data: _functionTest, _error: _functionTestError } = await _supabaseService.rpc(
      "test_handle_new_user",
      {
        user_id: _testUserId,
        full_name: "Test User",
        role: "user",
      }
    );
    logError("Function test error", _functionTestError);

    // Check RLS policies on profiles table
    const { _data: _policies, _error: _policiesError } = await _supabaseService.rpc(
      "check_rls_policies",
      {
        table_name: "profiles",
      }
    );
    logError("RLS policy check error", _policiesError);
  } catch (_error) {
    console.error("❌ Debug failed:", _error);
  }
}

async function _createDebugFunctions() {
  try {
    // Function to check if trigger exists
    const { _error: _triggerCheckError } = await _supabaseService.rpc(
      "create_trigger_check_function"
    );
    logError("Error creating trigger check function", _triggerCheckError);

    // Function to check if function exists
    const { _error: _functionCheckError } = await _supabaseService.rpc(
      "create_function_check_function"
    );
    logError("Error creating function check function", _functionCheckError);
  } catch (_error) {
    console.error("❌ Error creating debug functions:", _error);
  }
}

// Run the debug trigger
debugTrigger();
