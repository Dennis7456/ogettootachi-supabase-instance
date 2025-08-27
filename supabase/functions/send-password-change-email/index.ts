import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function sendPasswordChangeEmail(email: string, fullName: string) {
  console.log('🔍 [PASSWORD_UPDATE_FLOW] ===== EMAIL FUNCTION: sendPasswordChangeEmail STARTED =====');
  console.log('🔍 [PASSWORD_UPDATE_FLOW] Email function parameters:', {
    email: email,
    fullName: fullName
  });
  
  try {
    console.log('🔍 [PASSWORD_UPDATE_FLOW] Step 5a: Checking Mailjet credentials');
    const mailjetApiKey = Deno.env.get('MAILJET_API_KEY');
    const mailjetApiSecret = Deno.env.get('MAILJET_API_SECRET');

    console.log('🔍 [PASSWORD_UPDATE_FLOW] Mailjet credentials status:', {
      hasApiKey: !!mailjetApiKey,
      hasApiSecret: !!mailjetApiSecret,
      apiKeyPreview: mailjetApiKey ? `${mailjetApiKey.substring(0, 10)}...` : 'null'
    });

    if (!mailjetApiKey || !mailjetApiSecret) {
      console.log('🔍 [PASSWORD_UPDATE_FLOW] ⚠️ Mailjet credentials not found, logging email instead');
      console.log('🔍 [PASSWORD_UPDATE_FLOW] 📧 Password change confirmation email would be sent to:', email);
      console.log('🔍 [PASSWORD_UPDATE_FLOW] 📧 Recipient name:', fullName);
      return false;
    }

    // Read the email template
    // Email template embedded directly in the function
const template = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Updated - Ogetto, Otachi & Company Advocates</title>
    <style>
        /* CSS Reset for email compatibility */
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #2d3748;
            margin: 0;
            padding: 0;
            background: linear-gradient(135deg, #2d3748 0%, #1a365d 50%, #015260 100%);
            min-height: 100vh;
        }
        
        .email-wrapper {
            padding: 20px;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .container {
            max-width: 600px;
            width: 100%;
            background-color: #ffffff;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        }
        
        .header {
            background: linear-gradient(135deg, #015260 0%, #1a365d 100%);
            color: white;
            padding: 40px 30px;
            text-align: center;
            position: relative;
        }
        
        .header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="rgba(255,255,255,0.1)"/><circle cx="75" cy="75" r="1" fill="rgba(255,255,255,0.1)"/><circle cx="50" cy="10" r="0.5" fill="rgba(255,255,255,0.1)"/><circle cx="10" cy="60" r="0.5" fill="rgba(255,255,255,0.1)"/><circle cx="90" cy="40" r="0.5" fill="rgba(255,255,255,0.1)"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
            opacity: 0.3;
        }
        
        .header-content {
            position: relative;
            z-index: 1;
        }
        
        .logo-text {
            margin: 0 auto 20px;
            text-align: center;
            padding: 16px 0;
        }
        
        .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 700;
            font-family: 'EB Garamond', serif;
            letter-spacing: -0.5px;
            margin-bottom: 8px;
        }
        
        .header .subtitle {
            font-size: 16px;
            opacity: 0.9;
            font-weight: 400;
        }
        
        .content {
            padding: 40px 30px;
        }
        
        .greeting {
            font-size: 20px;
            margin-bottom: 24px;
            color: #015260;
            font-weight: 600;
            font-family: 'EB Garamond', serif;
        }
        
        .message {
            font-size: 16px;
            margin-bottom: 30px;
            line-height: 1.8;
            color: #4a5568;
        }
        
        .success-section {
            text-align: center;
            margin: 40px 0;
            padding: 30px;
            background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
            border-radius: 12px;
            border: 1px solid #bbf7d0;
        }
        
        .success-icon {
            width: 64px;
            height: 64px;
            background: #10b981;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 20px;
            font-size: 32px;
            color: white;
        }
        
        .success-title {
            color: #065f46;
            font-size: 20px;
            font-weight: 600;
            margin-bottom: 12px;
            font-family: 'EB Garamond', serif;
        }
        
        .success-message {
            color: #047857;
            font-size: 16px;
            line-height: 1.6;
        }
        
        .cta-section {
            text-align: center;
            margin: 40px 0;
            padding: 30px;
            background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
            border-radius: 12px;
            border: 1px solid #e2e8f0;
        }
        
        .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #015260 0%, #1a365d 100%);
            color: #ffffff !important;
            text-decoration: none;
            padding: 16px 32px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.5;
            text-align: center;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            transition: all 0.3s ease;
        }
        
        .cta-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
        }
        
        .security-info {
            background: #f0f9ff;
            border: 1px solid #0ea5e9;
            border-radius: 8px;
            padding: 20px;
            margin: 30px 0;
        }
        
        .security-info h3 {
            color: #0c4a6e;
            font-size: 16px;
            font-weight: 600;
            margin-bottom: 12px;
            display: flex;
            align-items: center;
        }
        
        .security-info p {
            color: #0c4a6e;
            font-size: 14px;
            line-height: 1.6;
            margin: 0;
        }
        
        .timestamp {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 16px;
            margin: 30px 0;
            text-align: center;
        }
        
        .timestamp p {
            color: #64748b;
            font-size: 14px;
            margin: 0;
        }
        
        .footer {
            background: #f8fafc;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #e2e8f0;
        }
        
        .footer p {
            color: #64748b;
            font-size: 14px;
            line-height: 1.6;
            margin-bottom: 16px;
        }
        
        .footer .contact-info {
            color: #015260;
            font-weight: 600;
        }
        
        .icon {
            display: inline-block;
            width: 20px;
            height: 20px;
            margin-right: 8px;
            vertical-align: middle;
        }
        
        /* Responsive design */
        @media only screen and (max-width: 600px) {
            .email-wrapper {
                padding: 10px;
            }
            
            .container {
                border-radius: 12px;
            }
            
            .header {
                padding: 30px 20px;
            }
            
            .header h1 {
                font-size: 24px;
            }
            
            .content {
                padding: 30px 20px;
            }
            
            .success-section,
            .cta-section {
                padding: 20px;
            }
            
            .footer {
                padding: 20px;
            }
        }
    </style>
</head>
<body>
    <div class="email-wrapper">
        <div class="container">
            <div class="header">
                <div class="header-content">
                    <div class="logo-text">
                        <h2 style="margin: 0; font-size: 24px; font-weight: 700; font-family: 'EB Garamond', serif; color: white;">
                            Ogetto, Otachi & Company
                        </h2>
                        <p style="margin: 4px 0 0 0; font-size: 14px; color: rgba(255,255,255,0.9); font-weight: 400;">
                            Advocates
                        </p>
                    </div>
                    <h1>Password Successfully Updated</h1>
                    <div class="subtitle">Your Account is Secure</div>
                </div>
            </div>
            
            <div class="content">
                <div class="greeting">Dear Valued Client,</div>
                
                <div class="message">
                    We're pleased to confirm that your password has been successfully updated for your account at <strong>Ogetto, Otachi & Company Advocates</strong>. 
                    Your account security is our top priority.
                </div>
                
                <div class="success-section">
                    <div class="success-icon">✓</div>
                    <div class="success-title">Password Update Complete</div>
                    <div class="success-message">
                        Your new password is now active and your account is secure. 
                        You can now log in to your account using your new password.
                    </div>
                </div>
                
                <div class="cta-section">
                    <a href="{{LOGIN_LINK}}" class="cta-button">
                        🔐 Log In to Your Account
                    </a>
                </div>
                
                <div class="security-info">
                    <h3>
                        <span class="icon">🔒</span>
                        Security Confirmation
                    </h3>
                    <p>
                        • Your password was updated on <strong>{{TIMESTAMP}}</strong><br>
                        • All active sessions have been secured<br>
                        • Your account is now protected with your new password<br>
                        • If you didn't make this change, please contact us immediately
                    </p>
                </div>
                
                <div class="timestamp">
                    <p>
                        <strong>Password Update Details:</strong><br>
                        Date: {{TIMESTAMP}}<br>
                        Account: Your registered email address<br>
                        IP Address: Securely logged for your protection
                    </p>
                </div>
                
                <div class="message">
                    If you have any questions about this password update or need assistance with your account, 
                    please don't hesitate to contact our support team. We're here to help!
                </div>
            </div>
            
            <div class="footer">
                <p>
                    <strong>Ogetto, Otachi & Company Advocates</strong><br>
                    Your trusted legal partners
                </p>
                <p class="contact-info">
                    📧 support@ogetto-otachi.com<br>
                    📞 +254 XXX XXX XXX<br>
                    🌐 www.ogetto-otachi.com
                </p>
                <p style="font-size: 12px; color: #94a3b8; margin-top: 20px;">
                    This email confirms that your password was successfully updated. 
                    If you didn't make this change, please contact us immediately for security assistance.
                </p>
            </div>
        </div>
    </div>
</body>
</html>`;
    let template = '';
    
    try {
      template = await Deno.readTextFile(templatePath);
    } catch (error) {
      console.error('❌ Error reading email template:', error);
      // Fallback to simple HTML
      template = `
        <!DOCTYPE html>
        <html>
        <head><title>Password Updated</title></head>
        <body>
          <h1>Password Updated Successfully</h1>
          <p>Dear ${fullName},</p>
          <p>Your password has been successfully updated for your account at Ogetto, Otachi & Company Advocates.</p>
          <p>You can now log in with your new password.</p>
          <p>If you didn't make this change, please contact our support team immediately.</p>
          <p>Best regards,<br>Ogetto, Otachi & Company Advocates</p>
        </body>
        </html>
      `;
    }

    // Replace template variables
    const timestamp = new Date().toLocaleString();
    const loginLink = `${new URL(Deno.env.get('SUPABASE_URL') ?? '').origin}/login`;
    
    const html = template
      .replace(/\{\{LOGIN_LINK\}\}/g, loginLink)
      .replace(/\{\{TIMESTAMP\}\}/g, timestamp);
    
    const text = `Password Updated Successfully

Dear ${fullName},

Your password has been successfully updated for your account at Ogetto, Otachi & Company Advocates.

You can now log in with your new password at: ${loginLink}

Password updated on: ${timestamp}

If you didn't make this change, please contact our support team immediately.

Best regards,
Ogetto, Otachi & Company Advocates`;

    const emailData = {
      Messages: [
        {
          From: {
            Email: 'support@anydayessay.com',
            Name: 'Ogetto, Otachi & Company Advocates'
          },
          To: [
            {
              Email: email,
              Name: fullName
            }
          ],
          Subject: 'Password Updated Successfully - Ogetto, Otachi & Company Advocates',
          TextPart: text,
          HTMLPart: html
        }
      ]
    };

    console.log('🔍 [PASSWORD_UPDATE_FLOW] Step 5b: Sending email via Mailjet API');
    console.log('🔍 [PASSWORD_UPDATE_FLOW] Mailjet API call details:', {
      url: 'https://api.mailjet.com/v3.1/send',
      method: 'POST',
      hasEmailData: !!emailData,
      emailDataKeys: Object.keys(emailData)
    });
    
    const response = await fetch('https://api.mailjet.com/v3.1/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${btoa(`${mailjetApiKey}:${mailjetApiSecret}`)}`
      },
      body: JSON.stringify(emailData)
    });

    console.log('🔍 [PASSWORD_UPDATE_FLOW] Mailjet API response status:', response.status);
    console.log('🔍 [PASSWORD_UPDATE_FLOW] Mailjet API response ok:', response.ok);
    
    const result = await response.json();
    console.log('🔍 [PASSWORD_UPDATE_FLOW] Mailjet API response data:', result);
    
    if (response.ok && result.Messages && result.Messages[0].Status === 'success') {
      console.log('🔍 [PASSWORD_UPDATE_FLOW] ✅ Password change confirmation email sent successfully via Mailjet');
      console.log('🔍 [PASSWORD_UPDATE_FLOW] ===== EMAIL FUNCTION: sendPasswordChangeEmail COMPLETED SUCCESSFULLY =====');
      return true;
    } else {
      console.log('🔍 [PASSWORD_UPDATE_FLOW] ❌ Mailjet API error:', result);
      console.log('🔍 [PASSWORD_UPDATE_FLOW] ===== EMAIL FUNCTION: sendPasswordChangeEmail FAILED =====');
      return false;
    }
  } catch (error) {
    console.log('🔍 [PASSWORD_UPDATE_FLOW] ❌ EMAIL FUNCTION ERROR OCCURRED');
    console.log('🔍 [PASSWORD_UPDATE_FLOW] Error details:', {
      message: error.message,
      name: error.name,
      stack: error.stack?.split('\n')[0] // First line of stack trace
    });
    console.log('🔍 [PASSWORD_UPDATE_FLOW] ===== EMAIL FUNCTION: sendPasswordChangeEmail FAILED WITH ERROR =====');
    return false;
  }
}

serve(async (req) => {
  console.log('🔍 [PASSWORD_UPDATE_FLOW] ===== EDGE FUNCTION: send-password-change-email STARTED =====');
  console.log('🔍 [PASSWORD_UPDATE_FLOW] Request method:', req.method);
  console.log('🔍 [PASSWORD_UPDATE_FLOW] Request URL:', req.url);
  console.log('🔍 [PASSWORD_UPDATE_FLOW] Request headers:', Object.fromEntries(req.headers.entries()));
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('🔍 [PASSWORD_UPDATE_FLOW] CORS preflight request - returning ok');
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🔍 [PASSWORD_UPDATE_FLOW] Step 1: Checking authorization header');
    
    // Get the authorization header
    const authHeader = req.headers.get('authorization')
    console.log('🔍 [PASSWORD_UPDATE_FLOW] Authorization header present:', !!authHeader);
    console.log('🔍 [PASSWORD_UPDATE_FLOW] Authorization header preview:', authHeader ? `${authHeader.substring(0, 20)}...` : 'null');
    
    if (!authHeader) {
      console.log('🔍 [PASSWORD_UPDATE_FLOW] ❌ No authorization header provided - returning 401');
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

    console.log('🔍 [PASSWORD_UPDATE_FLOW] Step 2: Creating Supabase client with service role');
    
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
    
    console.log('🔍 [PASSWORD_UPDATE_FLOW] Supabase client created successfully');
    console.log('🔍 [PASSWORD_UPDATE_FLOW] Supabase URL configured:', !!Deno.env.get('SUPABASE_URL'));
    console.log('🔍 [PASSWORD_UPDATE_FLOW] Service role key configured:', !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'));

    console.log('🔍 [PASSWORD_UPDATE_FLOW] Step 3: Verifying JWT token');
    
    // Verify the JWT token
    const token = authHeader.replace('Bearer ', '');
    console.log('🔍 [PASSWORD_UPDATE_FLOW] Token preview:', `${token.substring(0, 20)}...`);
    
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)
    
    if (authError || !user) {
      console.log('🔍 [PASSWORD_UPDATE_FLOW] ❌ Token verification failed:', authError);
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

    console.log('🔍 [PASSWORD_UPDATE_FLOW] ✅ Token verified successfully');
    console.log('🔍 [PASSWORD_UPDATE_FLOW] User ID:', user.id);
    console.log('🔍 [PASSWORD_UPDATE_FLOW] User email:', user.email);

    console.log('🔍 [PASSWORD_UPDATE_FLOW] Step 4: Retrieving user profile data');
    
    // Get user profile data
    const { data: userData, error: userError } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      console.log('🔍 [PASSWORD_UPDATE_FLOW] ❌ User profile not found:', userError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'User profile not found' 
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('🔍 [PASSWORD_UPDATE_FLOW] ✅ User profile found successfully');
    console.log('🔍 [PASSWORD_UPDATE_FLOW] Profile data:', {
      fullName: userData.full_name,
      email: userData.email,
      role: userData.role,
      isActive: userData.is_active
    });

    console.log('🔍 [PASSWORD_UPDATE_FLOW] Step 5: Sending password change confirmation email');
    console.log('🔍 [PASSWORD_UPDATE_FLOW] Email parameters:', {
      email: user.email,
      fullName: userData.full_name || user.email
    });
    
    // Send password change confirmation email
    const emailSent = await sendPasswordChangeEmail(user.email, userData.full_name || user.email);

    if (emailSent) {
      console.log('🔍 [PASSWORD_UPDATE_FLOW] ✅ Password change confirmation email sent successfully');
      console.log('🔍 [PASSWORD_UPDATE_FLOW] ===== EDGE FUNCTION: send-password-change-email COMPLETED SUCCESSFULLY =====');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Password change confirmation email sent successfully' 
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    } else {
      console.log('🔍 [PASSWORD_UPDATE_FLOW] ❌ Failed to send password change confirmation email');
      console.log('🔍 [PASSWORD_UPDATE_FLOW] ===== EDGE FUNCTION: send-password-change-email FAILED =====');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to send password change confirmation email' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

  } catch (error) {
    console.log('🔍 [PASSWORD_UPDATE_FLOW] ❌ EDGE FUNCTION ERROR OCCURRED');
    console.log('🔍 [PASSWORD_UPDATE_FLOW] Error details:', {
      message: error.message,
      name: error.name,
      stack: error.stack?.split('\n')[0] // First line of stack trace
    });
    console.log('🔍 [PASSWORD_UPDATE_FLOW] ===== EDGE FUNCTION: send-password-change-email FAILED WITH ERROR =====');
    
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