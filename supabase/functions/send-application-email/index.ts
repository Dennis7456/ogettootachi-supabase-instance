import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { handleOptions, withCorsJson } from '../_shared/cors.ts'

// CORS handled via shared helper

interface EmailData {
  to: string;
  subject: string;
  template: string;
  templateData: Record<string, any>;
  from?: string;
}

serve(async (req) => {
  const opt = handleOptions(req)
  if (opt) return opt

  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get the request body
    const { to, subject, template, templateData, from = 'careers@ogettootachi.com' }: EmailData = await req.json()

    if (!to || !subject || !template || !templateData) {
      return withCorsJson({ error: 'Missing required fields: to, subject, template, templateData' }, 400, req)
    }

    // Load email template
    let emailHtml = '';
    try {
      const templatePath = `./email-templates/${template}.html`;
      emailHtml = await Deno.readTextFile(templatePath);
    } catch (error) {
      console.error('Error loading template:', error);
      return withCorsJson({ error: 'Template not found' }, 404, req)
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
      return withCorsJson({ error: 'Failed to send email' }, 500, req)
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

    return withCorsJson({ success: true, message: 'Email sent successfully', to, subject, template }, 200, req)

  } catch (error) {
    console.error('Error in send-application-email:', error)
    return withCorsJson({ error: 'Internal server error' }, 500, req)
  }
}) 