import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmailData {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

async function sendEmail(emailData: EmailData) {
  try {
    const mailjetApiKey = Deno.env.get('MAILJET_API_KEY');
    const mailjetApiSecret = Deno.env.get('MAILJET_API_SECRET');

    if (!mailjetApiKey || !mailjetApiSecret) {
      console.log('⚠️ Mailjet credentials not found, logging email instead');
      console.log('📧 Email would be sent:', emailData);
      return false;
    }

    const { to, subject, text, html } = emailData;

    const emailPayload = {
      Messages: [
        {
          From: {
            Email: 'support@anydayessay.com',
            Name: 'Ogetto, Otachi & Company Advocates'
          },
          To: [
            {
              Email: to,
              Name: to
            }
          ],
          Subject: subject,
          TextPart: text,
          HTMLPart: html || text
        }
      ]
    };

    console.log('📧 Sending email via Mailjet...');
    
    const response = await fetch('https://api.mailjet.com/v3.1/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${btoa(`${mailjetApiKey}:${mailjetApiSecret}`)}`
      },
      body: JSON.stringify(emailPayload)
    });

    const result = await response.json();
    
    if (response.ok && result.Messages && result.Messages[0].Status === 'success') {
      console.log('✅ Email sent successfully');
      return true;
    } else {
      console.error('❌ Mailjet API error:', result);
      return false;
    }
  } catch (error) {
    console.error('❌ Error sending email:', error);
    return false;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { to, subject, text, html } = await req.json();

    if (!to || !subject || !text) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: to, subject, text' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const success = await sendEmail({ to, subject, text, html });

    if (success) {
      return new Response(
        JSON.stringify({ success: true, message: 'Email sent successfully' }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    } else {
      return new Response(
        JSON.stringify({ error: 'Failed to send email' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
  } catch (error) {
    console.error('❌ Error in send-email function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}); 