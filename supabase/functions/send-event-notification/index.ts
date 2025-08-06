import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type NotificationEvent = 
  | 'contact_message'
  | 'contact_message_notification'
  | 'appointment_booking'
  | 'appointment_update'
  | 'document_upload'
  | 'auth_email'
  | 'password_change'
  | 'user_invitation';

interface NotificationData {
  event: NotificationEvent;
  recipientEmail: string;
  recipientName?: string;
  data: any;
  adminEmails?: string[];
}

async function sendEventEmail(notificationData: NotificationData) {
  try {
    const mailjetApiKey = Deno.env.get('MAILJET_API_KEY');
    const mailjetApiSecret = Deno.env.get('MAILJET_API_SECRET');

    if (!mailjetApiKey || !mailjetApiSecret) {
      console.log('⚠️ Mailjet credentials not found, logging email instead');
      console.log('📧 Event notification would be sent:', notificationData);
      return false;
    }

    const { event, recipientEmail, recipientName, data, adminEmails } = notificationData;

    // Get email template based on event type
    const emailTemplate = getEmailTemplate(event, data, recipientName);
    
    // Send to recipient
    const recipientEmailData = {
      Messages: [
        {
          From: {
            Email: 'support@anydayessay.com',
            Name: 'Ogetto, Otachi & Company Advocates'
          },
          To: [
            {
              Email: recipientEmail,
              Name: recipientName || recipientEmail
            }
          ],
          Subject: emailTemplate.subject,
          TextPart: emailTemplate.textPart,
          HTMLPart: emailTemplate.htmlPart
        }
      ]
    };

    console.log('📧 Sending event notification email via Mailjet...');
    
    const response = await fetch('https://api.mailjet.com/v3.1/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${btoa(`${mailjetApiKey}:${mailjetApiSecret}`)}`
      },
      body: JSON.stringify(recipientEmailData)
    });

    const result = await response.json();
    
    if (response.ok && result.Messages && result.Messages[0].Status === 'success') {
      console.log('✅ Event notification email sent successfully to recipient');
    } else {
      console.error('❌ Mailjet API error for recipient:', result);
    }

    // Send admin notification if admin emails are provided
    if (adminEmails && adminEmails.length > 0) {
      const adminEmailData = {
        Messages: [
          {
            From: {
              Email: 'support@anydayessay.com',
              Name: 'Ogetto, Otachi & Company Advocates'
            },
            To: adminEmails.map(email => ({ Email: email })),
            Subject: `New ${event.replace('_', ' ')} - Admin Notification`,
            TextPart: getAdminNotificationText(event, data),
            HTMLPart: getAdminNotificationHTML(event, data)
          }
        ]
      };

      const adminResponse = await fetch('https://api.mailjet.com/v3.1/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${btoa(`${mailjetApiKey}:${mailjetApiSecret}`)}`
        },
        body: JSON.stringify(adminEmailData)
      });

      const adminResult = await adminResponse.json();
      
      if (adminResponse.ok && adminResult.Messages && adminResult.Messages[0].Status === 'success') {
        console.log('✅ Admin notification email sent successfully');
      } else {
        console.error('❌ Mailjet API error for admin notification:', adminResult);
      }
    }

    return true;
  } catch (error) {
    console.error('❌ Error sending event notification email:', error);
    return false;
  }
}

function getEmailTemplate(event: NotificationEvent, data: any, recipientName?: string) {
  const name = recipientName || 'there';
  
  switch (event) {
    case 'contact_message':
      return {
        subject: 'Contact Message Received - Ogetto Otachi Law Firm',
        textPart: `Dear ${name},

Thank you for contacting Ogetto, Otachi & Company Advocates. We have received your message and will respond within 24 hours.

Message Details:
- Name: ${data.name}
- Email: ${data.email}
- Subject: ${data.subject}
- Practice Area: ${data.practice_area || 'Not specified'}

We appreciate your interest in our legal services.

Best regards,
Ogetto, Otachi & Company Advocates`,
        htmlPart: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h2 style="color: #2c3e50; margin: 0;">Contact Message Received</h2>
            </div>
            
            <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; border: 1px solid #e9ecef;">
              <p>Dear ${name},</p>
              
              <p>Thank you for contacting <strong>Ogetto, Otachi & Company Advocates</strong>. We have received your message and will respond within 24 hours.</p>
              
              <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <h4 style="margin: 0 0 10px 0; color: #2c3e50;">Message Details:</h4>
                <p><strong>Name:</strong> ${data.name}</p>
                <p><strong>Email:</strong> ${data.email}</p>
                <p><strong>Subject:</strong> ${data.subject}</p>
                <p><strong>Practice Area:</strong> ${data.practice_area || 'Not specified'}</p>
              </div>
              
              <p>We appreciate your interest in our legal services.</p>
              
              <br>
              <p>Best regards,<br>Ogetto, Otachi & Company Advocates</p>
            </div>
          </div>
        `
      };

    case 'contact_message_notification':
      const loginUrl = data.recipientRole === 'admin' 
        ? 'https://ogettootachi.com/admin/login' 
        : 'https://ogettootachi.com/staff/login';
      
      return {
        subject: `New Contact Message from ${data.senderName} - Ogetto Otachi Law Firm`,
        textPart: `Dear ${name},

You have received a new contact message from a potential client.

Message Details:
- Client Name: ${data.senderName}
- Client Email: ${data.senderEmail}
- Client Phone: ${data.senderPhone || 'Not provided'}
- Subject: ${data.subject}
- Practice Area: ${data.practiceArea || 'Not specified'}
- Message: ${data.message}
- Time Sent: ${new Date().toLocaleString()}

Please login to your dashboard to view the complete message and respond to the client.

Login URL: ${loginUrl}

Best regards,
Ogetto, Otachi & Company Advocates`,
        htmlPart: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h2 style="color: #2c3e50; margin: 0;">New Contact Message Received</h2>
            </div>
            
            <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; border: 1px solid #e9ecef;">
              <p>Dear ${name},</p>
              
              <p>You have received a new contact message from a potential client.</p>
              
              <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <h4 style="margin: 0 0 10px 0; color: #2c3e50;">Message Details:</h4>
                <p><strong>Client Name:</strong> ${data.senderName}</p>
                <p><strong>Client Email:</strong> ${data.senderEmail}</p>
                <p><strong>Client Phone:</strong> ${data.senderPhone || 'Not provided'}</p>
                <p><strong>Subject:</strong> ${data.subject}</p>
                <p><strong>Practice Area:</strong> ${data.practiceArea || 'Not specified'}</p>
                <p><strong>Message:</strong></p>
                <div style="background-color: #ffffff; padding: 10px; border-radius: 3px; border-left: 3px solid #007bff; margin: 10px 0;">
                  <p style="margin: 0; white-space: pre-wrap;">${data.message}</p>
                </div>
                <p><strong>Time Sent:</strong> ${new Date().toLocaleString()}</p>
              </div>
              
              <div style="background-color: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #2196f3;">
                <h4 style="margin: 0 0 10px 0; color: #1976d2;">Action Required</h4>
                <p style="margin: 0 0 15px 0;">Please login to your dashboard to view the complete message and respond to the client.</p>
                <a href="${loginUrl}" style="display: inline-block; background-color: #2196f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                  Login to Dashboard
                </a>
              </div>
              
              <br>
              <p>Best regards,<br>Ogetto, Otachi & Company Advocates</p>
            </div>
          </div>
        `
      };

    case 'appointment_booking':
      return {
        subject: 'Appointment Booking Confirmation - Ogetto Otachi Law Firm',
        textPart: `Dear ${name},

Thank you for booking an appointment with Ogetto, Otachi & Company Advocates. We have received your appointment request and will confirm the details shortly.

Appointment Details:
- Name: ${data.client_name}
- Email: ${data.client_email}
- Practice Area: ${data.practice_area}
- Preferred Date: ${data.preferred_date}
- Preferred Time: ${data.preferred_time}
- Appointment Type: ${data.appointment_type}

We will contact you within 24 hours to confirm your appointment.

Best regards,
Ogetto, Otachi & Company Advocates`,
        htmlPart: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h2 style="color: #2c3e50; margin: 0;">Appointment Booking Confirmation</h2>
            </div>
            
            <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; border: 1px solid #e9ecef;">
              <p>Dear ${name},</p>
              
              <p>Thank you for booking an appointment with <strong>Ogetto, Otachi & Company Advocates</strong>. We have received your appointment request and will confirm the details shortly.</p>
              
              <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <h4 style="margin: 0 0 10px 0; color: #2c3e50;">Appointment Details:</h4>
                <p><strong>Name:</strong> ${data.client_name}</p>
                <p><strong>Email:</strong> ${data.client_email}</p>
                <p><strong>Practice Area:</strong> ${data.practice_area}</p>
                <p><strong>Preferred Date:</strong> ${data.preferred_date}</p>
                <p><strong>Preferred Time:</strong> ${data.preferred_time}</p>
                <p><strong>Appointment Type:</strong> ${data.appointment_type}</p>
              </div>
              
              <p>We will contact you within 24 hours to confirm your appointment.</p>
              
              <br>
              <p>Best regards,<br>Ogetto, Otachi & Company Advocates</p>
            </div>
          </div>
        `
      };

    case 'appointment_update':
      return {
        subject: 'Appointment Update Notification - Ogetto Otachi Law Firm',
        textPart: `Dear ${name},

Your appointment with Ogetto, Otachi & Company Advocates has been updated. Please review the updated details below.

Updated Appointment Details:
- Name: ${data.client_name}
- Email: ${data.client_email}
- Practice Area: ${data.practice_area}
- Preferred Date: ${data.preferred_date}
- Preferred Time: ${data.preferred_time}
- Appointment Type: ${data.appointment_type}

${data.message ? `Additional Notes: ${data.message}` : ''}

If you have any questions about these changes, please contact our office.

Best regards,
Ogetto, Otachi & Company Advocates`,
        htmlPart: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h2 style="color: #856404; margin: 0;">⚠️ Appointment Update Notification</h2>
            </div>
            
            <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; border: 1px solid #e9ecef;">
              <p>Dear ${name},</p>
              
              <p>Your appointment with <strong>Ogetto, Otachi & Company Advocates</strong> has been updated. Please review the updated details below.</p>
              
              <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <h4 style="margin: 0 0 10px 0; color: #2c3e50;">Updated Appointment Details:</h4>
                <p><strong>Name:</strong> ${data.client_name}</p>
                <p><strong>Email:</strong> ${data.client_email}</p>
                <p><strong>Practice Area:</strong> ${data.practice_area}</p>
                <p><strong>Preferred Date:</strong> ${data.preferred_date}</p>
                <p><strong>Preferred Time:</strong> ${data.preferred_time}</p>
                <p><strong>Appointment Type:</strong> ${data.appointment_type}</p>
                ${data.message ? `<p><strong>Additional Notes:</strong> ${data.message}</p>` : ''}
              </div>
              
              <p>If you have any questions about these changes, please contact our office.</p>
              
              <br>
              <p>Best regards,<br>Ogetto, Otachi & Company Advocates</p>
            </div>
          </div>
        `
      };

    case 'document_upload':
      return {
        subject: 'Document Upload Confirmation - Ogetto Otachi Law Firm',
        textPart: `Dear ${name},

Your document has been successfully uploaded to our system.

Document Details:
- Document Name: ${data.document_name}
- Upload Date: ${data.upload_date}
- File Size: ${data.file_size}

Our team will review the document and contact you if any additional information is needed.

Best regards,
Ogetto, Otachi & Company Advocates`,
        htmlPart: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h2 style="color: #2c3e50; margin: 0;">Document Upload Confirmation</h2>
            </div>
            
            <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; border: 1px solid #e9ecef;">
              <p>Dear ${name},</p>
              
              <p>Your document has been successfully uploaded to our system.</p>
              
              <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <h4 style="margin: 0 0 10px 0; color: #2c3e50;">Document Details:</h4>
                <p><strong>Document Name:</strong> ${data.document_name}</p>
                <p><strong>Upload Date:</strong> ${data.upload_date}</p>
                <p><strong>File Size:</strong> ${data.file_size}</p>
              </div>
              
              <p>Our team will review the document and contact you if any additional information is needed.</p>
              
              <br>
              <p>Best regards,<br>Ogetto, Otachi & Company Advocates</p>
            </div>
          </div>
        `
      };

    case 'password_change':
      return {
        subject: 'Password Change Confirmation - Ogetto Otachi Law Firm',
        textPart: `Dear ${name},

Your password has been successfully changed.

If you did not request this password change, please contact our support team immediately.

Best regards,
Ogetto, Otachi & Company Advocates`,
        htmlPart: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h2 style="color: #2c3e50; margin: 0;">Password Change Confirmation</h2>
            </div>
            
            <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; border: 1px solid #e9ecef;">
              <p>Dear ${name},</p>
              
              <p>Your password has been successfully changed.</p>
              
              <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p style="margin: 0; color: #856404;">
                  <strong>Security Notice:</strong> If you did not request this password change, please contact our support team immediately.
                </p>
              </div>
              
              <br>
              <p>Best regards,<br>Ogetto, Otachi & Company Advocates</p>
            </div>
          </div>
        `
      };

    default:
      return {
        subject: 'Notification from Ogetto Otachi Law Firm',
        textPart: `Dear ${name},

You have received a notification from Ogetto, Otachi & Company Advocates.

Best regards,
Ogetto, Otachi & Company Advocates`,
        htmlPart: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h2 style="color: #2c3e50; margin: 0;">Notification</h2>
            </div>
            
            <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; border: 1px solid #e9ecef;">
              <p>Dear ${name},</p>
              
              <p>You have received a notification from <strong>Ogetto, Otachi & Company Advocates</strong>.</p>
              
              <br>
              <p>Best regards,<br>Ogetto, Otachi & Company Advocates</p>
            </div>
          </div>
        `
      };
  }
}

function getAdminNotificationText(event: NotificationEvent, data: any) {
  switch (event) {
    case 'contact_message':
      return `New contact message received:
Name: ${data.name}
Email: ${data.email}
Subject: ${data.subject}
Practice Area: ${data.practice_area || 'Not specified'}
Message: ${data.message}`;

    case 'contact_message_notification':
      return `New contact message received:
Client Name: ${data.senderName}
Client Email: ${data.senderEmail}
Client Phone: ${data.senderPhone || 'Not provided'}
Subject: ${data.subject}
Practice Area: ${data.practiceArea || 'Not specified'}
Message: ${data.message}
Time Sent: ${new Date().toLocaleString()}`;

    case 'appointment_booking':
      return `New appointment booking received:
Name: ${data.client_name}
Email: ${data.client_email}
Practice Area: ${data.practice_area}
Preferred Date: ${data.preferred_date}
Preferred Time: ${data.preferred_time}
Appointment Type: ${data.appointment_type}`;

    case 'appointment_update':
      return `Appointment updated:
Name: ${data.client_name}
Email: ${data.client_email}
Practice Area: ${data.practice_area}
Preferred Date: ${data.preferred_date}
Preferred Time: ${data.preferred_time}
Appointment Type: ${data.appointment_type}`;

    case 'document_upload':
      return `New document uploaded:
Document Name: ${data.document_name}
Upload Date: ${data.upload_date}
File Size: ${data.file_size}`;

    default:
      return `New ${event.replace('_', ' ')} event received.`;
  }
}

function getAdminNotificationHTML(event: NotificationEvent, data: any) {
  const eventTitle = event.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h2 style="color: #2c3e50; margin: 0;">New ${eventTitle}</h2>
      </div>
      
      <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; border: 1px solid #e9ecef;">
        <p>A new ${event.replace('_', ' ')} has been received:</p>
        
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
          ${getAdminNotificationDetails(event, data)}
        </div>
        
        <p>Please review and take appropriate action.</p>
      </div>
    </div>
  `;
}

function getAdminNotificationDetails(event: NotificationEvent, data: any) {
  switch (event) {
    case 'contact_message':
      return `
        <p><strong>Name:</strong> ${data.name}</p>
        <p><strong>Email:</strong> ${data.email}</p>
        <p><strong>Subject:</strong> ${data.subject}</p>
        <p><strong>Practice Area:</strong> ${data.practice_area || 'Not specified'}</p>
        <p><strong>Message:</strong> ${data.message}</p>
      `;

    case 'contact_message_notification':
      return `
        <p><strong>Client Name:</strong> ${data.senderName}</p>
        <p><strong>Client Email:</strong> ${data.senderEmail}</p>
        <p><strong>Client Phone:</strong> ${data.senderPhone || 'Not provided'}</p>
        <p><strong>Subject:</strong> ${data.subject}</p>
        <p><strong>Practice Area:</strong> ${data.practiceArea || 'Not specified'}</p>
        <p><strong>Message:</strong></p>
        <div style="background-color: #ffffff; padding: 10px; border-radius: 3px; border-left: 3px solid #007bff; margin: 10px 0;">
          <p style="margin: 0; white-space: pre-wrap;">${data.message}</p>
        </div>
        <p><strong>Time Sent:</strong> ${new Date().toLocaleString()}</p>
      `;

    case 'appointment_booking':
      return `
        <p><strong>Name:</strong> ${data.client_name}</p>
        <p><strong>Email:</strong> ${data.client_email}</p>
        <p><strong>Practice Area:</strong> ${data.practice_area}</p>
        <p><strong>Preferred Date:</strong> ${data.preferred_date}</p>
        <p><strong>Preferred Time:</strong> ${data.preferred_time}</p>
        <p><strong>Appointment Type:</strong> ${data.appointment_type}</p>
      `;

    case 'appointment_update':
      return `
        <p><strong>Name:</strong> ${data.client_name}</p>
        <p><strong>Email:</strong> ${data.client_email}</p>
        <p><strong>Practice Area:</strong> ${data.practice_area}</p>
        <p><strong>Preferred Date:</strong> ${data.preferred_date}</p>
        <p><strong>Preferred Time:</strong> ${data.preferred_time}</p>
        <p><strong>Appointment Type:</strong> ${data.appointment_type}</p>
      `;

    case 'document_upload':
      return `
        <p><strong>Document Name:</strong> ${data.document_name}</p>
        <p><strong>Upload Date:</strong> ${data.upload_date}</p>
        <p><strong>File Size:</strong> ${data.file_size}</p>
      `;

    default:
      return `<p>Event data: ${JSON.stringify(data, null, 2)}</p>`;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'No authorization header provided' 
        }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Create a Supabase client with the service role key for admin operations
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Verify the JWT token
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(authHeader.replace('Bearer ', ''))
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid or expired token' 
        }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('✅ Token verified, user ID:', user.id);

    // Parse the request body
    const notificationData: NotificationData = await req.json();

    // Validate required fields
    if (!notificationData.event || !notificationData.recipientEmail || !notificationData.data) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required fields: event, recipientEmail, or data' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get admin emails for admin notifications
    if (!notificationData.adminEmails) {
      const { data: adminProfiles } = await supabaseClient
        .from('profiles')
        .select('email')
        .eq('role', 'admin');

      if (adminProfiles) {
        notificationData.adminEmails = adminProfiles.map(profile => profile.email);
      }
    }

    // Send the email notification
    const emailSent = await sendEventEmail(notificationData);

    if (emailSent) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Event notification email sent successfully' 
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    } else {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to send event notification email' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

  } catch (error) {
    console.error('❌ Server error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}) 