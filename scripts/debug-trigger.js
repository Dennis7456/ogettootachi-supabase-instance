const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseServiceKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';
const _supabaseService = _createClient(supabaseUrl, supabaseServiceKey);
async function debugTrigger() {
  try {
    // Check if trigger exists
    const { _data: triggers, _error: triggerError } =
      await _supabaseService.rpc('check_trigger_exists', {
        trigger_name: 'on_auth_user_created',
      });
    if (triggerError) {
      console.error('❌ Trigger check error:', triggerError.message);
    } else {
    }
    // Check if function exists
    const { _data: functions, _error: functionError } =
      await _supabaseService.rpc('check_function_exists', {
        function_name: 'handle_new_user',
      });
    if (functionError) {
      console.error('❌ Function check error:', functionError.message);
    } else {
    }
    // Test the function directly
    const testUserId = '00000000-0000-0000-0000-000000000000';
    const { _data: functionTest, _error: functionTestError } =
      await _supabaseService.rpc('test_handle_new_user', {
        user_id: testUserId,
        full_name: 'Test User',
        role: 'user',
      });
    if (functionTestError) {
      console.error('❌ Function test error:', functionTestError.message);
    } else {
    }
    // Check RLS policies on profiles table
    const { _data: policies, _error: policiesError } =
      await _supabaseService.rpc('check_rls_policies', {
        table_name: 'profiles',
      });
    if (policiesError) {
      console.error('❌ RLS policy check error:', policiesError.message);
    } else {
    }
  } catch (_error) {
    console.error('❌ Debug failed:', _error);
  }
}
async function createDebugFunctions() {
  try {
    // Function to check if trigger exists
    const { _error: triggerCheckError } = await _supabaseService.rpc(
      'create_trigger_check_function'
    );
    if (triggerCheckError) {
      console.error(
        '❌ Error creating trigger check function:',
        triggerCheckError.message
      );
    } else {
    }
    // Function to check if function exists
    const { _error: functionCheckError } = await _supabaseService.rpc(
      'create_function_check_function'
    );
    if (functionCheckError) {
      console.error(
        '❌ Error creating function check function:',
        functionCheckError.message
      );
    } else {
    }
  } catch (_error) {
    console.error('❌ Error creating debug functions:', _error);
  }
}
debugTrigger();
