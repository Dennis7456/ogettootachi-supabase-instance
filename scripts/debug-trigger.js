import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

const supabaseService = createClient(supabaseUrl, supabaseServiceKey)

async function debugTrigger() {
  console.log('🔍 Debugging Trigger Function...\n')
  
  try {
    // Check if trigger exists
    console.log('1️⃣ Checking if trigger exists...')
    const { data: triggers, error: triggerError } = await supabaseService
      .rpc('check_trigger_exists', { trigger_name: 'on_auth_user_created' })
    
    if (triggerError) {
      console.log('❌ Error checking trigger:', triggerError.message)
    } else {
      console.log('✅ Trigger check result:', triggers)
    }
    
    // Check if function exists
    console.log('\n2️⃣ Checking if function exists...')
    const { data: functions, error: functionError } = await supabaseService
      .rpc('check_function_exists', { function_name: 'handle_new_user' })
    
    if (functionError) {
      console.log('❌ Error checking function:', functionError.message)
    } else {
      console.log('✅ Function check result:', functions)
    }
    
    // Test the function directly
    console.log('\n3️⃣ Testing function directly...')
    const testUserId = '00000000-0000-0000-0000-000000000000'
    const { data: functionTest, error: functionTestError } = await supabaseService
      .rpc('test_handle_new_user', { user_id: testUserId, full_name: 'Test User', role: 'user' })
    
    if (functionTestError) {
      console.log('❌ Function test error:', functionTestError.message)
    } else {
      console.log('✅ Function test result:', functionTest)
    }
    
    // Check RLS policies on profiles table
    console.log('\n4️⃣ Checking RLS policies...')
    const { data: policies, error: policiesError } = await supabaseService
      .rpc('check_rls_policies', { table_name: 'profiles' })
    
    if (policiesError) {
      console.log('❌ Error checking policies:', policiesError.message)
    } else {
      console.log('✅ RLS policies:', policies)
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error)
  }
}

// Create helper functions for debugging
async function createDebugFunctions() {
  console.log('🔧 Creating debug functions...\n')
  
  try {
    // Function to check if trigger exists
    const { error: triggerCheckError } = await supabaseService.rpc('create_trigger_check_function')
    if (triggerCheckError) {
      console.log('❌ Error creating trigger check function:', triggerCheckError.message)
    } else {
      console.log('✅ Trigger check function created')
    }
    
    // Function to check if function exists
    const { error: functionCheckError } = await supabaseService.rpc('create_function_check_function')
    if (functionCheckError) {
      console.log('❌ Error creating function check function:', functionCheckError.message)
    } else {
      console.log('✅ Function check function created')
    }
    
  } catch (error) {
    console.error('❌ Error creating debug functions:', error)
  }
}

// Run debug
debugTrigger() 