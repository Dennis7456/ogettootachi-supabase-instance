import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

const supabase = createClient(supabaseUrl, supabaseAnonKey)
const supabaseService = createClient(supabaseUrl, supabaseServiceKey)

async function testRegistrationFlow() {
  console.log('🧪 Testing Registration Flow...\n')
  
  const testEmail = `test-user-${Date.now()}@example.com`
  const testPassword = 'testpassword123'
  
  try {
    // Step 1: Test user registration with anon client
    console.log('1️⃣ Testing user registration with anon client...')
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          full_name: 'Test User',
          role: 'user'
        }
      }
    })
    
    if (signUpError) {
      console.log('❌ Sign up error:', signUpError.message)
      return
    }
    
    console.log('✅ User registration successful')
    console.log('   User ID:', signUpData.user.id)
    console.log('   Email:', signUpData.user.email)
    console.log('   Email confirmed:', signUpData.user.email_confirmed_at ? 'Yes' : 'No')
    
    // Step 2: Check if profile was created automatically
    console.log('\n2️⃣ Creating profile using function...')
    
    // Use the new function to create profile
    const { data: profileResult, error: profileFunctionError } = await supabaseService
      .rpc('create_user_profile', {
        user_id: signUpData.user.id,
        full_name: 'Test User',
        user_role: 'user'
      })
    
    if (profileFunctionError) {
      console.log('❌ Profile function error:', profileFunctionError.message)
    } else {
      console.log('✅ Profile function result:', profileResult)
    }
    
    // Now check if profile exists
    const { data: profile, error: profileError } = await supabaseService
      .from('profiles')
      .select('*')
      .eq('id', signUpData.user.id)
      .single()
    
    if (profileError) {
      console.log('❌ Profile fetch error:', profileError.message)
      console.log('   This might mean the function failed')
      
      // Try to manually create the profile
      console.log('   Attempting to manually create profile...')
      const { data: manualProfile, error: manualError } = await supabaseService
        .from('profiles')
        .insert({
          id: signUpData.user.id,
          full_name: 'Test User',
          role: 'user',
          is_active: true
        })
        .select()
        .single()
      
      if (manualError) {
        console.log('❌ Manual profile creation failed:', manualError.message)
      } else {
        console.log('✅ Profile created manually')
        console.log('   Profile ID:', manualProfile.id)
        console.log('   Full Name:', manualProfile.full_name)
        console.log('   Role:', manualProfile.role)
        console.log('   Is Active:', manualProfile.is_active)
      }
    } else {
      console.log('✅ Profile created successfully')
      console.log('   Profile ID:', profile.id)
      console.log('   Full Name:', profile.full_name)
      console.log('   Role:', profile.role)
      console.log('   Is Active:', profile.is_active)
    }
    
    // Step 3: Test user login
    console.log('\n3️⃣ Testing user login...')
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    })
    
    if (signInError) {
      console.log('❌ Sign in error:', signInError.message)
    } else {
      console.log('✅ User login successful')
      console.log('   Session user ID:', signInData.user.id)
    }
    
    // Step 4: Test profile access after login
    console.log('\n4️⃣ Testing profile access after login...')
    const { data: userProfile, error: userProfileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', signInData.user.id)
      .single()
    
    if (userProfileError) {
      console.log('❌ User profile access error:', userProfileError.message)
    } else {
      console.log('✅ User can access their own profile')
      console.log('   Profile data:', userProfile)
    }
    
    // Step 5: Test admin user creation
    console.log('\n5️⃣ Testing admin user creation...')
    const adminEmail = `admin-${Date.now()}@example.com`
    const { data: adminData, error: adminError } = await supabaseService.auth.admin.createUser({
      email: adminEmail,
      password: 'adminpassword123',
      email_confirm: true,
      user_metadata: {
        full_name: 'Test Admin',
        role: 'admin'
      }
    })
    
    if (adminError) {
      console.log('❌ Admin creation error:', adminError.message)
    } else {
      console.log('✅ Admin user created successfully')
      console.log('   Admin ID:', adminData.user.id)
      console.log('   Admin Email:', adminData.user.email)
      
      // Update admin role in profile
      const { error: updateError } = await supabaseService
        .from('profiles')
        .update({ role: 'admin' })
        .eq('id', adminData.user.id)
      
      if (updateError) {
        console.log('❌ Admin role update error:', updateError.message)
      } else {
        console.log('✅ Admin role updated in profile')
      }
    }
    
    console.log('\n🎉 Registration flow test completed!')
    
  } catch (error) {
    console.error('❌ Test failed with error:', error)
  }
}

testRegistrationFlow() 