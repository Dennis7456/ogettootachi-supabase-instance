#!/usr/bin/env node

import { execSync } from 'child_process'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

console.log('🧪 Testing Edge Functions...\n')

// Test data
const testAppointment = {
  name: 'Test User',
  email: 'test@example.com',
  phone: '+1234567890',
  practice_area: 'Family Law',
  preferred_date: '2025-07-10',
  preferred_time: '10:00 AM',
  message: 'Test appointment message'
}

const testContactMessage = {
  name: 'Test Contact',
  email: 'contact@example.com',
  phone: '+1234567890',
  subject: 'Test Subject',
  message: 'This is a test contact message',
  practice_area: 'Corporate Law'
}

async function testAppointmentsFunction() {
  console.log('📅 Testing Appointments Function...')
  
  try {
    // Test POST - Create appointment
    const createResponse = await fetch(`${supabaseUrl}/functions/v1/appointments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testAppointment)
    })
    
    if (createResponse.ok) {
      const data = await createResponse.json()
      console.log('✅ Appointment creation: SUCCESS')
      console.log(`   - ID: ${data.appointment.id}`)
      console.log(`   - Status: ${data.appointment.status}`)
      
      // Test GET - Retrieve appointments (requires auth)
      console.log('⚠️  GET appointments test skipped (requires authentication)')
      
      return data.appointment.id
    } else {
      const error = await createResponse.json()
      console.log('❌ Appointment creation: FAILED')
      console.log(`   - Error: ${error.error}`)
      return null
    }
  } catch (error) {
    console.log('❌ Appointment creation: FAILED')
    console.log(`   - Error: ${error.message}`)
    return null
  }
}

async function testContactFunction() {
  console.log('\n📧 Testing Contact Messages Function...')
  
  try {
    // Test POST - Create contact message
    const createResponse = await fetch(`${supabaseUrl}/functions/v1/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testContactMessage)
    })
    
    if (createResponse.ok) {
      const data = await createResponse.json()
      console.log('✅ Contact message creation: SUCCESS')
      console.log(`   - ID: ${data.contact_message.id}`)
      console.log(`   - Status: ${data.contact_message.status}`)
      
      // Test GET - Retrieve messages (requires auth)
      console.log('⚠️  GET contact messages test skipped (requires authentication)')
      
      return data.contact_message.id
    } else {
      const error = await createResponse.json()
      console.log('❌ Contact message creation: FAILED')
      console.log(`   - Error: ${error.error}`)
      return null
    }
  } catch (error) {
    console.log('❌ Contact message creation: FAILED')
    console.log(`   - Error: ${error.message}`)
    return null
  }
}

async function testErrorCases() {
  console.log('\n🚨 Testing Error Cases...')
  
  // Test invalid appointment data
  try {
    const invalidAppointment = { ...testAppointment }
    delete invalidAppointment.name
    
    const response = await fetch(`${supabaseUrl}/functions/v1/appointments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invalidAppointment)
    })
    
    if (response.status === 400) {
      console.log('✅ Invalid appointment data: Correctly rejected')
    } else {
      console.log('❌ Invalid appointment data: Should have been rejected')
    }
  } catch (error) {
    console.log('❌ Invalid appointment data test failed')
  }
  
  // Test invalid contact data
  try {
    const invalidContact = { ...testContactMessage }
    delete invalidContact.email
    
    const response = await fetch(`${supabaseUrl}/functions/v1/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invalidContact)
    })
    
    if (response.status === 400) {
      console.log('✅ Invalid contact data: Correctly rejected')
    } else {
      console.log('❌ Invalid contact data: Should have been rejected')
    }
  } catch (error) {
    console.log('❌ Invalid contact data test failed')
  }
}

async function cleanupTestData(appointmentId, contactId) {
  console.log('\n🧹 Cleaning up test data...')
  
  try {
    if (appointmentId) {
      await supabase.from('appointments').delete().eq('id', appointmentId)
      console.log('✅ Test appointment cleaned up')
    }
    
    if (contactId) {
      await supabase.from('contact_messages').delete().eq('id', contactId)
      console.log('✅ Test contact message cleaned up')
    }
  } catch (error) {
    console.log('⚠️  Cleanup failed:', error.message)
  }
}

async function main() {
  try {
    // Check if Supabase is running
    console.log('🔍 Checking Supabase status...')
    execSync('supabase status', { stdio: 'pipe' })
    console.log('✅ Supabase is running\n')
    
    // Test functions
    const appointmentId = await testAppointmentsFunction()
    const contactId = await testContactFunction()
    await testErrorCases()
    
    // Cleanup
    await cleanupTestData(appointmentId, contactId)
    
    console.log('\n🎉 Edge Functions testing completed!')
    console.log('\nNext steps:')
    console.log('1. Run full tests: npm run test:functions')
    console.log('2. Deploy functions: npm run deploy-functions')
    console.log('3. Update frontend to use Edge Functions')
    
  } catch (error) {
    console.error('❌ Testing failed:', error.message)
    console.log('\nMake sure Supabase is running: supabase start')
    process.exit(1)
  }
}

main() 