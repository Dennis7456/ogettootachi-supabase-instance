import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function clearAllUsers() {
  try {
    console.log('🧹 Starting user and profile cleanup...')
    
    // First, delete all profiles
    const { error: profilesError } = await supabase
      .from('profiles')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Avoid deleting any system reserved profiles
    
    if (profilesError) {
      console.error('❌ Error deleting profiles:', profilesError)
      return false
    }
    
    // Then, delete all users
    const { data: users, error: listError } = await supabase.auth.admin.listUsers()
    
    if (listError) {
      console.error('❌ Error listing users:', listError)
      return false
    }
    
    console.log(`Found ${users.users.length} users to delete`)
    
    const deletionResults = []
    
    for (const user of users.users) {
      // Skip system users or special accounts if needed
      if (user.email === 'service@supabase.com') continue
      
      const { error } = await supabase.auth.admin.deleteUser(user.id)
      
      if (error) {
        console.error(`❌ Failed to delete user ${user.email}:`, error)
        deletionResults.push({ email: user.email, deleted: false, error })
      } else {
        console.log(`✅ Deleted user: ${user.email}`)
        deletionResults.push({ email: user.email, deleted: true })
      }
    }
    
    console.log('\n📊 Deletion Summary:')
    console.log(`Total Users: ${users.users.length}`)
    console.log(`Successfully Deleted: ${deletionResults.filter(r => r.deleted).length}`)
    console.log(`Failed Deletions: ${deletionResults.filter(r => !r.deleted).length}`)
    
    return true
  } catch (error) {
    console.error('❌ Unexpected error during cleanup:', error)
    return false
  }
}

// If run directly
if (import.meta.main) {
  clearAllUsers().then(success => {
    Deno.exit(success ? 0 : 1)
  })
}

export { clearAllUsers }; 