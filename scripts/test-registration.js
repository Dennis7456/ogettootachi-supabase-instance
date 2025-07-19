import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey)
const supabaseService = createClient(supabaseUrl, supabaseServiceKey)

async function testRegistration() {
  try {
    console.log('🧪 Starting User Registration Test...')
    
    // Generate a unique test email
    const testEmail = `test-${Date.now()}@example.com`
    const testPassword = 'TestPassword123!'
    
    // Step 1: Sign Up
    console.log('1️⃣ Signing up new user...')
    const { data: signUpData, error: signUpError } = await supabaseAnon.auth.signUp({
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
      console.error('❌ Sign Up Error:', signUpError)
      return false
    }
    
    console.log('✅ User signed up successfully')
    console.log('   User ID:', signUpData.user.id)
    console.log('   Email:', signUpData.user.email)
    
    // Step 2: Manually create profile using service role
    console.log('\n2️⃣ Creating profile manually...')
    const { data: profile, error: profileError } = await supabaseService
      .from('profiles')
      .upsert({
        id: signUpData.user.id,
        full_name: 'Test User',
        role: 'user',
        is_active: true
      }, { 
        onConflict: 'id' 
      })
      .select()
      .single()
    
    if (profileError) {
      console.error('❌ Profile Creation Error:', profileError)
      return false
    }
    
    console.log('✅ Profile created successfully:')
    console.log('   Profile ID:', profile.id)
    console.log('   Full Name:', profile.full_name)
    console.log('   Role:', profile.role)
    console.log('   Is Active:', profile.is_active)
    
    return true
  } catch (error) {
    console.error('❌ Unexpected Error:', error)
    return false
  }
}

// If run directly
if (import.meta.main) {
  testRegistration().then(success => {
    Deno.exit(success ? 0 : 1)
  })
}

export { testRegistration }; 