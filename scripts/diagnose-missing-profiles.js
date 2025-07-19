import { createClient } from '@supabase/supabase-js'
import { createProfileForUser } from './manual-profile-creation.js'

const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

const supabaseService = createClient(supabaseUrl, supabaseServiceKey)

async function diagnoseMissingProfiles() {
  try {
    console.log('🔍 Diagnosing missing user profiles...')
    
    // Get all users from auth.users
    const { data: users, error: usersError } = await supabaseService.auth.admin.listUsers()
    
    if (usersError) {
      console.error('❌ Failed to list users:', usersError)
      return
    }
    
    console.log(`Found ${users.users.length} total users`)
    
    // Track missing and created profiles
    const missingProfiles = []
    const createdProfiles = []
    
    // Check each user's profile
    for (const user of users.users) {
      // Check if profile exists
      const { data: profile, error: profileError } = await supabaseService
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      
      if (profileError) {
        // Profile doesn't exist
        missingProfiles.push(user)
        
        // Attempt to create profile
        const newProfile = await createProfileForUser(
          user.id, 
          user.user_metadata?.full_name || user.email?.split('@')[0],
          user.user_metadata?.role || 'user'
        )
        
        if (newProfile) {
          createdProfiles.push(newProfile)
        }
      }
    }
    
    // Report results
    console.log('\n📊 Diagnosis Results:')
    console.log(`Total Users: ${users.users.length}`)
    console.log(`Missing Profiles: ${missingProfiles.length}`)
    console.log(`Profiles Created: ${createdProfiles.length}`)
    
    if (missingProfiles.length > 0) {
      console.log('\n❗ Users with Missing Profiles:')
      missingProfiles.forEach(user => {
        console.log(`- ${user.email} (ID: ${user.id})`)
      })
    }
    
    return {
      totalUsers: users.users.length,
      missingProfiles: missingProfiles.length,
      createdProfiles: createdProfiles.length
    }
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

// If this script is run directly
if (import.meta.main) {
  diagnoseMissingProfiles()
}

export { diagnoseMissingProfiles }; 