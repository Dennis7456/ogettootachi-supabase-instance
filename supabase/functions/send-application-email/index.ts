import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmailData {
  to: string;
  subject: string;
  template: string;
  templateData: Record<string, any>;
  from?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get the request body
    const { to, subject, template, templateData, from = 'careers@ogettootachi.com' }: EmailData = await req.json()

    if (!to || !subject || !template || !templateData) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: to, subject, template, templateData' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Load email template
    let emailHtml = '';
    try {
      const templatePath = `./email-templates/${template}.html`;
      emailHtml = await Deno.readTextFile(templatePath);
    } catch (error) {
      console.error('Error loading template:', error);
      return new Response(
        JSON.stringify({ error: 'Template not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Replace template variables
    let processedHtml = emailHtml;
    for (const [key, value] of Object.entries(templateData)) {
      const placeholder = `{{${key}}}`;
      processedHtml = processedHtml.replace(new RegExp(placeholder, 'g'), value);
    }

    // Send email using existing email service
    const emailResponse = await fetch(
      `${supabaseUrl}/functions/v1/send-email`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to,
          subject,
          html: processedHtml,
          from
        }),
      }
    );

    if (!emailResponse.ok) {
      const errorData = await emailResponse.json();
      console.error('Email service error:', errorData);
      return new Response(
        JSON.stringify({ error: 'Failed to send email' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Log email sent
    const { error: logError } = await supabase
      .from('email_logs')
      .insert({
        to_email: to,
        subject: subject,
        template: template,
        status: 'sent',
        sent_at: new Date().toISOString()
      });

    if (logError) {
      console.error('Error logging email:', logError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Email sent successfully',
        to,
        subject,
        template
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in send-application-email:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}) 