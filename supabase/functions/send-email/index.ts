import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { handleOptions, withCorsJson } from '../_shared/cors.ts'

// CORS handled via shared helper

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
  const opt = handleOptions(req)
  if (opt) return opt

  try {
    const { to, subject, text, html } = await req.json();

    if (!to || !subject || !text) {
      return withCorsJson({ error: 'Missing required fields: to, subject, text' }, 400, req)
    }

    const success = await sendEmail({ to, subject, text, html });

    if (success) {
      return withCorsJson({ success: true, message: 'Email sent successfully' }, 200, req)
    } else {
      return withCorsJson({ error: 'Failed to send email' }, 500, req)
    }
  } catch (error) {
    console.error('❌ Error in send-email function:', error);
    return withCorsJson({ error: 'Internal server error' }, 500, req)
  }
}); 