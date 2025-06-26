import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createStorageBuckets() {
  try {
    console.log('Creating storage buckets...')
    
    // Create documents bucket
    const { data: documentsBucket, error: documentsError } = await supabase.storage.createBucket('documents', {
      public: false
    })
    
    if (documentsError) {
      console.log('Documents bucket error:', documentsError.message)
    } else {
      console.log('Documents bucket created successfully')
    }
    
    // Create public bucket
    const { data: publicBucket, error: publicError } = await supabase.storage.createBucket('public', {
      public: true
    })
    
    if (publicError) {
      console.log('Public bucket error:', publicError.message)
    } else {
      console.log('Public bucket created successfully')
    }
    
    console.log('Storage bucket creation completed')
  } catch (error) {
    console.error('Error creating storage buckets:', error)
  }
}

createStorageBuckets() 