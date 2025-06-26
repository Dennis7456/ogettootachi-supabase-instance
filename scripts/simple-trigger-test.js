import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

const supabaseService = createClient(supabaseUrl, supabaseServiceKey)

async function testTrigger() {
  console.log('🧪 Simple Trigger Test...\n')
  
  const testEmail = `trigger-test-${Date.now()}@example.com`
  
  try {
    // Step 1: Create a user
    console.log('1️⃣ Creating user...')
    const { data: userData, error: userError } = await supabaseService.auth.admin.createUser({
      email: testEmail,
      password: 'testpassword123',
      email_confirm: true,
      user_metadata: {
        full_name: 'Trigger Test User',
        role: 'user'
      }
    })
    
    if (userError) {
      console.log('❌ User creation failed:', userError.message)
      return
    }
    
    console.log('✅ User created:', userData.user.id)
    
    // Step 2: Immediately check for profile
    console.log('\n2️⃣ Checking for profile...')
    const { data: profile, error: profileError } = await supabaseService
      .from('profiles')
      .select('*')
      .eq('id', userData.user.id)
      .single()
    
    if (profileError) {
      console.log('❌ Profile not found:', profileError.message)
      console.log('   This means the trigger function is not working')
      
      // Step 3: Check if user exists in auth.users
      console.log('\n3️⃣ Checking if user exists in auth.users...')
      const { data: authUser, error: authError } = await supabaseService
        .from('auth.users')
        .select('id, email, raw_user_meta_data')
        .eq('id', userData.user.id)
        .single()
      
      if (authError) {
        console.log('❌ Auth user check failed:', authError.message)
      } else {
        console.log('✅ Auth user found:', authUser)
      }
      
      // Step 4: Try to manually create profile
      console.log('\n4️⃣ Manually creating profile...')
      const { data: manualProfile, error: manualError } = await supabaseService
        .from('profiles')
        .insert({
          id: userData.user.id,
          full_name: 'Trigger Test User',
          role: 'user',
          is_active: true
        })
        .select()
        .single()
      
      if (manualError) {
        console.log('❌ Manual profile creation failed:', manualError.message)
      } else {
        console.log('✅ Manual profile creation successful:', manualProfile)
      }
      
    } else {
      console.log('✅ Profile found automatically!')
      console.log('   Profile:', profile)
      console.log('   This means the trigger function is working!')
    }
    
    // Step 5: Clean up - delete the test user
    console.log('\n5️⃣ Cleaning up...')
    const { error: deleteError } = await supabaseService.auth.admin.deleteUser(userData.user.id)
    if (deleteError) {
      console.log('⚠️  Could not delete test user:', deleteError.message)
    } else {
      console.log('✅ Test user deleted')
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

testTrigger() 