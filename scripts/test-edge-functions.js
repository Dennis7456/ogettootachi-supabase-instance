import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://riuqslalytzybvgsebki.supabase.co'
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'your-anon-key'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-key'

const supabase = createClient(supabaseUrl, supabaseAnonKey)
const supabaseService = createClient(supabaseUrl, supabaseServiceKey)

async function testEdgeFunctions() {
  console.log('🧪 Testing Edge Functions...\n')
  
  try {
    // Step 1: Create a test user for authentication
    console.log('1️⃣ Creating test user...')
    const testEmail = `edge-test-${Date.now()}@example.com`
    const { data: userData, error: userError } = await supabaseService.auth.admin.createUser({
      email: testEmail,
      password: 'testpassword123',
      email_confirm: true,
      user_metadata: {
        full_name: 'Edge Test User',
        role: 'admin'
      }
    })
    
    if (userError) {
      console.log('❌ User creation failed:', userError.message)
      return
    }
    
    console.log('✅ Test user created:', userData.user.id)
    
    // Step 2: Create profile for the user
    console.log('\n2️⃣ Creating user profile...')
    const { data: profileResult } = await supabaseService.rpc('create_user_profile', {
      user_id: userData.user.id,
      full_name: 'Edge Test User',
      user_role: 'admin'
    })
    
    console.log('✅ Profile created:', profileResult)
    
    // Step 3: Get authentication token
    console.log('\n3️⃣ Getting authentication token...')
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: 'testpassword123'
    })
    
    if (authError) {
      console.log('❌ Authentication failed:', authError.message)
      return
    }
    
    const token = authData.session.access_token
    console.log('✅ Authentication successful')
    
    // Step 4: Test process-document function
    console.log('\n4️⃣ Testing process-document function...')
    const documentTestData = {
      title: 'Test Legal Document',
      content: 'This is a test legal document about contract law in Kenya. It contains information about the basic principles of contract formation, offer and acceptance, consideration, and capacity to contract.',
      category: 'contracts',
      file_path: 'test-document.txt'
    }
    
    const processResponse = await fetch(`${supabaseUrl}/functions/v1/process-document`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(documentTestData)
    })
    
    if (processResponse.ok) {
      const processResult = await processResponse.json()
      console.log('✅ Process-document function working:', processResult)
    } else {
      const errorText = await processResponse.text()
      console.log('❌ Process-document function failed:', processResponse.status, errorText)
    }
    
    // Step 5: Test chatbot function
    console.log('\n5️⃣ Testing chatbot function...')
    const chatbotTestData = {
      message: 'What are the basic principles of contract law?',
      session_id: `test-session-${Date.now()}`
    }
    
    const chatbotResponse = await fetch(`${supabaseUrl}/functions/v1/chatbot`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(chatbotTestData)
    })
    
    if (chatbotResponse.ok) {
      const chatbotResult = await chatbotResponse.json()
      console.log('✅ Chatbot function working:')
      console.log('   Response:', chatbotResult.response)
      console.log('   Documents used:', chatbotResult.documents?.length || 0)
      console.log('   Tokens used:', chatbotResult.tokens_used)
    } else {
      const errorText = await chatbotResponse.text()
      console.log('❌ Chatbot function failed:', chatbotResponse.status, errorText)
    }
    
    // Step 6: Clean up
    console.log('\n6️⃣ Cleaning up...')
    const { error: deleteError } = await supabaseService.auth.admin.deleteUser(userData.user.id)
    if (deleteError) {
      console.log('⚠️  Could not delete test user:', deleteError.message)
    } else {
      console.log('✅ Test user deleted')
    }
    
    console.log('\n🎉 Edge functions test completed!')
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

testEdgeFunctions() 