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
  SUPABASE_URL: Deno.env.get('SUPABASE_URL') || 'http://127.0.0.1:54321',
  SUPABASE_SERVICE_ROLE_KEY: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
  RESEND_API_KEY: Deno.env.get('RESEND_API_KEY'),
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

    // Validate Resend API key
    if (!config.RESEND_API_KEY) {
      console.log('⚠️ Email service not configured, but continuing for testing');
      // For testing, return success without actually sending email
      return new Response(JSON.stringify({ 
        message: 'Invitation email would be sent (mock mode)',
        emailId: 'mock-email-id',
        to: email,
        subject: 'You\'re Invited to Join Ogetto, Otachi & Co Advocates'
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
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