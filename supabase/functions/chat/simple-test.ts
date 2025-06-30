// Simple test to check if the function is accessible
const functionUrl = 'https://riuqslalytzybvgsebki.supabase.co/functions/v1/chat'
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpdXFzbGFseXR6eWJ2Z3NlYmtpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3MzA0MDAsImV4cCI6MjA2NjMwNjQwMH0.SLbk4MgmS-DMpgCrHZOme9zolF_17SqvCFoKdgJtZWI'

async function testFunction() {
  try {
    console.log('Testing function accessibility...')
    
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${anonKey}`
      },
      body: JSON.stringify({
        query: "test",
        topK: 1
      })
    })
    
    console.log('Response status:', response.status)
    console.log('Response headers:', Object.fromEntries(response.headers.entries()))
    
    const text = await response.text()
    console.log('Response body:', text)
    
  } catch (error) {
    console.error('Test failed:', error)
  }
}

testFunction() 