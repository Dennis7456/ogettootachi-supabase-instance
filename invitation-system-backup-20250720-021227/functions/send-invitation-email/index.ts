/// <reference lib="deno.ns" />
/// <reference types="./types.d.ts" />

import { serve } from "std/http/server.ts";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

// Declare Deno global for type safety
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  }
};

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Configuration helper
const getConfig = () => ({
  // Supabase automatically provides SUPABASE_URL in Edge Functions
  SUPABASE_URL: Deno.env.get('SUPABASE_URL') || 'http://127.0.0.1:54321',
  SUPABASE_SERVICE_ROLE_KEY: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
  RESEND_API_KEY: Deno.env.get('RESEND_API_KEY') || 'test_api_key',
  FRONTEND_URL: Deno.env.get('FRONTEND_URL') || 'http://localhost:5173'
});

// Error response helper
const createErrorResponse = (message: string, status: number = 400) => {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
};

// Email template for invitation
const createInvitationEmailTemplate = (
  email: string, 
  role: string, 
  invitationUrl: string, 
  customMessage?: string
) => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>You're Invited - Ogetto, Otachi & Co Advocates</title>
</head>
<body>
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1>You're Invited to Join</h1>
        <h2>Ogetto, Otachi & Co Advocates</h2>
        
        <p>Dear Colleague,</p>
        
        ${customMessage ? `<p>${customMessage}</p>` : ''}
        
        <p>You have been invited to join our team as a ${role}.</p>
        
        <a href="${invitationUrl}" style="
            display: inline-block;
            padding: 10px 20px;
            background-color: #4CAF50;
            color: white;
            text-decoration: none;
            border-radius: 5px;
        ">Accept Invitation</a>
        
        <p>If the button doesn't work, copy and paste this link:</p>
        <p>${invitationUrl}</p>
        
        <small>This invitation will expire in 72 hours.</small>
    </div>
</body>
</html>
  `;
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return createErrorResponse('Method not allowed', 405);
  }

  try {
    // Parse request body
    const { 
      email, 
      role, 
      invitation_token, 
      custom_message 
    } = await req.json();

    // Validate required fields
    if (!email || !role || !invitation_token) {
      return createErrorResponse('Missing required fields');
    }

    const config = getConfig();

    // Check if we're in local development mode
    if (!config.RESEND_API_KEY || config.RESEND_API_KEY === 'test_api_key') {
      console.log('🏠 Local development mode - using Supabase Auth for email delivery');
      
      // Create the email content
      const invitationUrl = `${config.FRONTEND_URL}/password-setup?token=${invitation_token}&type=invite`;
      
      console.log('📧 Sending invitation email via Supabase Auth...');
      console.log('To:', email);
      console.log('Subject: You\'re Invited to Join Ogetto, Otachi & Co Advocates');
      console.log('Invitation URL:', invitationUrl);
      
      try {
        const supabaseAdmin = createClient(
          config.SUPABASE_URL, 
          config.SUPABASE_SERVICE_ROLE_KEY || ''
        );
        
        // Check if user exists first
        const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
        const existingUser = existingUsers.users.find(u => u.email === email);
        
        if (existingUser) {
          console.log('👤 User exists, deleting and recreating to send fresh invitation...');
          
          // Delete existing user so we can send a proper invitation email
          const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(existingUser.id);
          if (deleteError) {
            console.log('⚠️ Could not delete existing user:', deleteError.message);
            // Continue anyway - try to send invitation
          } else {
            console.log('🗑️ Existing user deleted successfully');
          }
          
          // Wait a moment for deletion to process
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        // Now create fresh user and send invitation email (works for both new and recreated users)
        {
          console.log('👤 New user, sending invitation email via Supabase Auth...');
          
          // For new users, use inviteUserByEmail which we know works
          const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
            data: {
              role: role,
              full_name: custom_message || 'Team Member',
              invitation_url: invitationUrl
            },
            redirectTo: invitationUrl
          });
          
          if (inviteError) {
            console.log('❌ Invitation error:', inviteError.message);
            throw inviteError;
          }
          
          console.log('✅ Invitation email sent successfully!');
          console.log('👤 User created:', inviteData.user.id);
          
          return new Response(JSON.stringify({ 
            message: 'Invitation email sent successfully (new user invitation)',
            emailId: 'invite-' + Date.now(),
            to: email,
            subject: 'You\'re Invited to Join Ogetto, Otachi & Co Advocates',
            note: 'Email sent via Supabase Auth invitation. Check Mailpit: http://127.0.0.1:54324',
            invitationUrl: invitationUrl,
            userId: inviteData.user.id
          }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        
      } catch (authError) {
        console.log('⚠️ Supabase Auth email failed:', authError.message);
        
        // Fallback: Just log the email content but still return success
        const emailHtml = createInvitationEmailTemplate(
          email, 
          role, 
          invitationUrl, 
          custom_message
        );
        
        console.log('📧 EMAIL CONTENT (Fallback):');
        console.log('=================================');
        console.log(`From: Ogetto, Otachi & Company <noreply@ogettootachi.com>`);
        console.log(`To: ${email}`);
        console.log(`Subject: You're Invited to Join Ogetto, Otachi & Co Advocates`);
        console.log(`Date: ${new Date().toISOString()}`);
        console.log('');
        console.log('HTML Content:');
        console.log(emailHtml);
        console.log('=================================');
        
        return new Response(JSON.stringify({ 
          message: 'Invitation email content logged (Auth failed)',
          emailId: 'fallback-' + Date.now(),
          to: email,
          subject: 'You\'re Invited to Join Ogetto, Otachi & Co Advocates',
          note: 'Email content logged to console. Auth method failed.',
          invitationUrl: invitationUrl,
          error: authError.message
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // Create Resend client
    const resend = new Resend(config.RESEND_API_KEY);

    // Construct invitation URL
    const invitationUrl = `${config.FRONTEND_URL}/password-setup?token=${invitation_token}&type=invite`;

    // Send email
    const { data, error } = await resend.emails.send({
      from: 'Ogetto, Otachi & Co <noreply@ogettootachi.com>',
      to: email,
      subject: 'You\'re Invited to Join Ogetto, Otachi & Co Advocates',
      html: createInvitationEmailTemplate(
        email, 
        role, 
        invitationUrl, 
        custom_message
      )
    });

    if (error) {
      console.error('Email sending error:', error);
      return createErrorResponse('Failed to send invitation email', 500);
    }

    return new Response(JSON.stringify({ 
      message: 'Invitation email sent successfully',
      emailId: data.id 
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Invitation email processing error:', error);
    return createErrorResponse('An unexpected error occurred', 500);
  }
}); 