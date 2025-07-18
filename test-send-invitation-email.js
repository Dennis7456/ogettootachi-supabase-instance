// Test script to manually send an invitation email
// Use ES modules
import fetch from 'node-fetch';

// Use the invitation token from the previous test
const invitationToken = '904b804d-2051-4e2a-819d-77f2a8e0b36a';
const email = 'test@example.com';
const role = 'staff';
const customMessage = 'This is a test invitation email.';

// Supabase service role key - replace with your actual key
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

async function sendInvitationEmail() {
  try {
    console.log('Sending invitation email...');
    
    const response = await fetch('http://127.0.0.1:54321/functions/v1/send-invitation-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceRoleKey}`
      },
      body: JSON.stringify({
        email,
        role,
        invitation_token: invitationToken,
        custom_message: customMessage
      })
    });

    console.log('Response status:', response.status);
    
    const data = await response.text();
    console.log('Response body:', data);
    
    try {
      const jsonData = JSON.parse(data);
      console.log('Parsed JSON:', jsonData);
    } catch (e) {
      console.log('Could not parse response as JSON');
    }
    
  } catch (error) {
    console.error('Error sending invitation email:', error);
  }
}

sendInvitationEmail(); 