#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Performance test configuration
const CONFIG = {
  concurrentRequests: 10,
  totalRequests: 50,
  delayBetweenBatches: 1000, // 1 second
  timeoutMs: 30000, // 30 seconds
  successThreshold: 0.95 // 95% success rate
}

// Test data
const testAppointment = {
  name: 'Performance Test User',
  email: 'perf-test@example.com',
  phone: '+1234567890',
  practice_area: 'Corporate Law',
  preferred_date: '2025-07-10',
  preferred_time: '10:00 AM',
  message: 'Performance test appointment'
}

const testContactMessage = {
  name: 'Performance Test Contact',
  email: 'perf-contact@example.com',
  phone: '+1234567890',
  subject: 'Performance Test Subject',
  message: 'This is a performance test contact message',
  practice_area: 'Corporate Law'
}

const testChatbotMessage = {
  message: 'What are your corporate law services?',
  session_id: 'perf-test-session'
}

const testDocument = {
  title: 'Performance Test Document',
  content: 'This is a performance test document content for processing and embedding generation.',
  category: 'corporate',
  file_path: '/uploads/perf-test-document.pdf'
}

class PerformanceMonitor {
  constructor() {
    this.results = {
      appointments: [],
      contact: [],
      chatbot: [],
      processDocument: []
    }
    this.adminToken = null
  }

  async setup() {
    console.log('🔧 Setting up performance test...')
    
    try {
      // Create admin user for authenticated tests
      const adminUser = {
        email: 'perf-admin@test.com',
        password: 'perfpassword123'
      }
      
      const { data: { user }, error: signUpError } = await supabase.auth.signUp(adminUser)
      if (signUpError) throw signUpError
      
      if (user) {
        // Create admin profile
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([{
            id: user.id,
            first_name: 'Perf',
            last_name: 'Admin',
            role: 'admin'
          }])
        
        if (profileError) throw profileError
        
        // Get session
        const { data: { session }, error: signInError } = await supabase.auth.signInWithPassword(adminUser)
        if (signInError) throw signInError
        if (session) this.adminToken = session.access_token
      }
      
      console.log('✅ Setup completed')
    } catch (error) {
      console.error('❌ Setup failed:', error.message)
      throw error
    }
  }

  async cleanup() {
    console.log('🧹 Cleaning up test data...')
    
    try {
      // Clean up test data
      await supabase.from('appointments').delete().eq('client_email', testAppointment.email)
      await supabase.from('contact_messages').delete().eq('email', testContactMessage.email)
      await supabase.from('chatbot_conversations').delete().eq('session_id', testChatbotMessage.session_id)
      await supabase.from('documents').delete().eq('title', testDocument.title)
      
      // Clean up admin user
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase.from('profiles').delete().eq('id', user.id)
        await supabase.auth.admin.deleteUser(user.id)
      }
      
      console.log('✅ Cleanup completed')
    } catch (error) {
      console.error('⚠️ Cleanup failed:', error.message)
    }
  }

  async makeRequest(url, options) {
    const startTime = Date.now()
    
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), CONFIG.timeoutMs)
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      const endTime = Date.now()
      const duration = endTime - startTime
      
      const data = await response.json()
      
      return {
        success: response.ok,
        status: response.status,
        duration,
        data,
        error: null
      }
    } catch (error) {
      const endTime = Date.now()
      const duration = endTime - startTime
      
      return {
        success: false,
        status: 0,
        duration,
        data: null,
        error: error.message
      }
    }
  }

  async testAppointments() {
    console.log('\n📅 Testing Appointments Function...')
    
    const results = []
    
    for (let i = 0; i < CONFIG.totalRequests; i++) {
      const result = await this.makeRequest(`${supabaseUrl}/functions/v1/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...testAppointment,
          name: `${testAppointment.name} ${i + 1}`,
          email: `perf-test-${i + 1}@example.com`
        })
      })
      
      results.push(result)
      
      if ((i + 1) % CONFIG.concurrentRequests === 0) {
        await new Promise(resolve => setTimeout(resolve, CONFIG.delayBetweenBatches))
      }
    }
    
    this.results.appointments = results
    this.printResults('Appointments', results)
  }

  async testContact() {
    console.log('\n📧 Testing Contact Function...')
    
    const results = []
    
    for (let i = 0; i < CONFIG.totalRequests; i++) {
      const result = await this.makeRequest(`${supabaseUrl}/functions/v1/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...testContactMessage,
          name: `${testContactMessage.name} ${i + 1}`,
          email: `perf-contact-${i + 1}@example.com`
        })
      })
      
      results.push(result)
      
      if ((i + 1) % CONFIG.concurrentRequests === 0) {
        await new Promise(resolve => setTimeout(resolve, CONFIG.delayBetweenBatches))
      }
    }
    
    this.results.contact = results
    this.printResults('Contact', results)
  }

  async testChatbot() {
    console.log('\n🤖 Testing Chatbot Function...')
    
    if (!this.adminToken) {
      console.log('⚠️ Skipping chatbot test - no admin token')
      return
    }
    
    const results = []
    
    for (let i = 0; i < CONFIG.totalRequests; i++) {
      const result = await this.makeRequest(`${supabaseUrl}/functions/v1/chatbot`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${this.adminToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...testChatbotMessage,
          session_id: `${testChatbotMessage.session_id}-${i + 1}`
        })
      })
      
      results.push(result)
      
      if ((i + 1) % CONFIG.concurrentRequests === 0) {
        await new Promise(resolve => setTimeout(resolve, CONFIG.delayBetweenBatches))
      }
    }
    
    this.results.chatbot = results
    this.printResults('Chatbot', results)
  }

  async testProcessDocument() {
    console.log('\n📄 Testing Process Document Function...')
    
    if (!this.adminToken) {
      console.log('⚠️ Skipping process document test - no admin token')
      return
    }
    
    const results = []
    
    for (let i = 0; i < CONFIG.totalRequests; i++) {
      const result = await this.makeRequest(`${supabaseUrl}/functions/v1/process-document`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${this.adminToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...testDocument,
          title: `${testDocument.title} ${i + 1}`,
          content: `${testDocument.content} - Test ${i + 1}`
        })
      })
      
      results.push(result)
      
      if ((i + 1) % CONFIG.concurrentRequests === 0) {
        await new Promise(resolve => setTimeout(resolve, CONFIG.delayBetweenBatches))
      }
    }
    
    this.results.processDocument = results
    this.printResults('Process Document', results)
  }

  printResults(functionName, results) {
    const successful = results.filter(r => r.success)
    const failed = results.filter(r => !r.success)
    const durations = successful.map(r => r.duration)
    
    const avgDuration = durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0
    const minDuration = durations.length > 0 ? Math.min(...durations) : 0
    const maxDuration = durations.length > 0 ? Math.max(...durations) : 0
    const successRate = (successful.length / results.length) * 100
    
    console.log(`\n📊 ${functionName} Results:`)
    console.log(`   Total Requests: ${results.length}`)
    console.log(`   Successful: ${successful.length}`)
    console.log(`   Failed: ${failed.length}`)
    console.log(`   Success Rate: ${successRate.toFixed(2)}%`)
    console.log(`   Average Duration: ${avgDuration.toFixed(2)}ms`)
    console.log(`   Min Duration: ${minDuration}ms`)
    console.log(`   Max Duration: ${maxDuration}ms`)
    
    if (failed.length > 0) {
      console.log(`   Failed Requests: ${failed.length}`)
      failed.slice(0, 3).forEach((f, i) => {
        console.log(`     ${i + 1}. Status: ${f.status}, Error: ${f.error}`)
      })
    }
    
    // Check if performance meets thresholds
    const meetsThreshold = successRate >= (CONFIG.successThreshold * 100) && avgDuration < 5000
    
    if (meetsThreshold) {
      console.log(`   ✅ Performance meets thresholds`)
    } else {
      console.log(`   ⚠️ Performance below thresholds`)
    }
  }

  async runAllTests() {
    console.log('🚀 Starting Performance Tests...')
    console.log(`Configuration: ${CONFIG.concurrentRequests} concurrent, ${CONFIG.totalRequests} total requests`)
    
    try {
      await this.setup()
      
      await this.testAppointments()
      await this.testContact()
      await this.testChatbot()
      await this.testProcessDocument()
      
      console.log('\n🎉 Performance tests completed!')
      
      // Summary
      console.log('\n📈 Summary:')
      Object.entries(this.results).forEach(([functionName, results]) => {
        if (results.length > 0) {
          const successRate = (results.filter(r => r.success).length / results.length) * 100
          const avgDuration = results.filter(r => r.success).reduce((sum, r) => sum + r.duration, 0) / results.filter(r => r.success).length || 0
          console.log(`   ${functionName}: ${successRate.toFixed(1)}% success, ${avgDuration.toFixed(0)}ms avg`)
        }
      })
      
    } catch (error) {
      console.error('❌ Performance tests failed:', error.message)
    } finally {
      await this.cleanup()
    }
  }
}

async function main() {
  try {
    // Check if Supabase is running
    console.log('🔍 Checking Supabase status...')
    const { execSync } = await import('child_process')
    execSync('supabase status', { stdio: 'pipe' })
    console.log('✅ Supabase is running\n')
    
    const monitor = new PerformanceMonitor()
    await monitor.runAllTests()
    
  } catch (error) {
    console.error('❌ Performance monitoring failed:', error.message)
    console.log('\nMake sure Supabase is running: supabase start')
    process.exit(1)
  }
}

main() 