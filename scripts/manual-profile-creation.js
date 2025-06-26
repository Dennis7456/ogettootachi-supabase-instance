import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

const supabaseService = createClient(supabaseUrl, supabaseServiceKey)

async function createProfileForUser(userId, fullName = '', role = 'user') {
  try {
    console.log(`Creating profile for user: ${userId}`)
    
    const { data, error } = await supabaseService
      .from('profiles')
      .insert({
        id: userId,
        full_name: fullName,
        role: role,
        is_active: true
      })
      .select()
      .single()
    
    if (error) {
      console.log('❌ Error creating profile:', error.message)
      return null
    }
    
    console.log('✅ Profile created successfully:', data)
    return data
  } catch (error) {
    console.error('❌ Exception creating profile:', error)
    return null
  }
}

// Export for use in other scripts
export { createProfileForUser }

// If run directly, create a test profile
if (import.meta.url === `file://${process.argv[1]}`) {
  const testUserId = process.argv[2]
  if (testUserId) {
    createProfileForUser(testUserId, 'Test User', 'user')
  } else {
    console.log('Usage: node manual-profile-creation.js <user-id>')
  }
} 