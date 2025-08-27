import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { handleOptions, withCorsJson } from '../_shared/cors.ts'

// CORS handled via shared helper

interface PasswordResetRequest {
  email: string;
}

// Simple in-memory rate limiting (in production, use Redis or database)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 60 * 1000; // 60 seconds in milliseconds
const MAX_REQUESTS_PER_WINDOW = 3; // Maximum 3 requests per email per minute

// Cleanup expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

function checkRateLimit(email: string): { 
  allowed: boolean; 
  remainingTime?: number; 
  remainingRequests?: number;
  windowResetTime?: number;
} {
  const now = Date.now();
  const key = email.toLowerCase().trim();
  
  const record = rateLimitStore.get(key);
  
  if (!record) {
    // First request for this email
    rateLimitStore.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return { 
      allowed: true, 
      remainingRequests: MAX_REQUESTS_PER_WINDOW - 1,
      windowResetTime: Math.ceil(RATE_LIMIT_WINDOW / 1000)
    };
  }
  
  if (now > record.resetTime) {
    // Window has expired, reset
    rateLimitStore.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return { 
      allowed: true, 
      remainingRequests: MAX_REQUESTS_PER_WINDOW - 1,
      windowResetTime: Math.ceil(RATE_LIMIT_WINDOW / 1000)
    };
  }
  
  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    // Rate limit exceeded
    const remainingTime = Math.ceil((record.resetTime - now) / 1000);
    return { 
      allowed: false, 
      remainingTime,
      remainingRequests: 0,
      windowResetTime: remainingTime
    };
  }
  
  // Increment count
  record.count++;
  rateLimitStore.set(key, record);
  
  const remainingRequests = MAX_REQUESTS_PER_WINDOW - record.count;
  const windowResetTime = Math.ceil((record.resetTime - now) / 1000);
  
  return { 
    allowed: true, 
    remainingRequests,
    windowResetTime
  };
}

async function sendPasswordResetEmail(email: string, resetLink: string) {
  try {
    const mailjetApiKey = Deno.env.get('MAILJET_API_KEY');
    const mailjetApiSecret = Deno.env.get('MAILJET_API_SECRET');

    if (!mailjetApiKey || !mailjetApiSecret) {
      console.log('⚠️ Mailjet credentials not found, logging email instead');
      console.log('📧 Password reset email would be sent to:', email);
      console.log('🔗 Reset link:', resetLink);
      return false;
    }

    // Email template embedded directly in the function
    const template = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Reset - Ogetto, Otachi & Company Advocates</title>
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
        
        .cta-button, .cta-button:link, .cta-button:visited, .cta-button:hover, .cta-button:active {
            color: #ffffff !important;
            text-decoration: none !important;
        }
        
        .cta-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
        }
        
        .security-notice {
            background: #fef3c7;
            border: 1px solid #f59e0b;
            border-radius: 8px;
            padding: 20px;
            margin: 30px 0;
        }
        
        .security-notice h3 {
            color: #92400e;
            font-size: 16px;
            font-weight: 600;
            margin-bottom: 12px;
            display: flex;
            align-items: center;
        }
        
        .security-notice p {
            color: #92400e;
            font-size: 14px;
            line-height: 1.6;
            margin: 0;
        }
        
        .info-box {
            background: #f0f9ff;
            border: 1px solid #0ea5e9;
            border-radius: 8px;
            padding: 20px;
            margin: 30px 0;
        }
        
        .info-box h3 {
            color: #0c4a6e;
            font-size: 16px;
            font-weight: 600;
            margin-bottom: 12px;
            display: flex;
            align-items: center;
        }
        
        .info-box p {
            color: #0c4a6e;
            font-size: 14px;
            line-height: 1.6;
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
                    <h1>Password Reset Request</h1>
                    <div class="subtitle">Secure Account Recovery</div>
                </div>
            </div>
            
            <div class="content">
                <div class="greeting">Dear Valued Client,</div>
                
                <div class="message">
                    We received a request to reset the password for your account at <strong>Ogetto, Otachi & Company Advocates</strong>. 
                    To proceed with the password reset, please click the button below:
                </div>
                
                <div class="cta-section">
                    <a href="{{RESET_LINK}}" class="cta-button" style="color: #ffffff !important; text-decoration: none;">
                        🔐 Reset My Password
                    </a>
                </div>
                
                <div class="security-notice">
                    <h3>
                        <span class="icon">⚠️</span>
                        Security Notice
                    </h3>
                    <p>
                        <strong>If you didn't request this password reset:</strong> Please ignore this email. Your account security has not been compromised. 
                        This link will expire in 1 hour for your protection.
                    </p>
                </div>
                
                <div class="info-box">
                    <h3>
                        <span class="icon">ℹ️</span>
                        Important Information
                    </h3>
                    <p>
                        • This link will expire in <strong>1 hour</strong><br>
                        • You can only use this link <strong>once</strong><br>
                        • If you need a new link, please request another password reset<br>
                        • For security reasons, we cannot see your current password
                    </p>
                </div>
                
                <div class="message">
                    If you have any questions or concerns about this request, please don't hesitate to contact our support team.
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
                    This email was sent to you because a password reset was requested for your account. 
                    If you didn't make this request, please ignore this email.
                </p>
            </div>
        </div>
    </div>
</body>
</html>`;

    console.log('✅ Email template embedded successfully, size:', template.length, 'characters');

    // Replace template variables
    const html = template.replace(/\{\{RESET_LINK\}\}/g, resetLink);
    const text = `Password Reset Request

You requested a password reset for your account at Ogetto, Otachi & Company Advocates.

Click the link below to reset your password:
${resetLink}

If you didn't request this, please ignore this email.

This link will expire in 1 hour.

Best regards,
Ogetto, Otachi & Company Advocates`;

    const emailPayload = {
      Messages: [
        {
          From: {
            Email: 'support@anydayessay.com',
            Name: 'Ogetto, Otachi & Company Advocates'
          },
          To: [
            {
              Email: email,
              Name: email
            }
          ],
          Subject: 'Password Reset Request - Ogetto, Otachi & Company Advocates',
          TextPart: text,
          HTMLPart: html
        }
      ]
    };

    console.log('📧 Sending password reset email via Mailjet...');
    
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
      console.log('✅ Password reset email sent successfully');
      return true;
    } else {
      console.error('❌ Mailjet API error:', result);
      return false;
    }
  } catch (error) {
    console.error('❌ Error sending password reset email:', error);
    return false;
  }
}

serve(async (req) => {
  const opt = handleOptions(req)
  if (opt) return opt

  try {
    const { email } = await req.json() as PasswordResetRequest;

    if (!email) {
      return withCorsJson({ error: 'Email is required' }, 400, req)
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return withCorsJson({ error: 'Invalid email format' }, 400, req)
    }

    console.log('🔍 Processing password reset request for:', email);

    // Check rate limiting
    const rateLimitResult = checkRateLimit(email);
    if (!rateLimitResult.allowed) {
      console.log('🚫 Rate limit exceeded for:', email);
      return withCorsJson({ 
        error: 'Too many requests', 
        message: `Please wait ${rateLimitResult.remainingTime} seconds before trying again.`,
        retryAfter: rateLimitResult.remainingTime,
        rateLimitInfo: {
          remainingRequests: rateLimitResult.remainingRequests,
          windowResetTime: rateLimitResult.windowResetTime
        }
      }, 429, req);
    }

    // Create Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Missing Supabase environment variables');
      return withCorsJson({ error: 'Server configuration error' }, 500, req)
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Check if user exists
    const { data: users, error: userError } = await supabase.auth.admin.listUsers();
    
    if (userError) {
      console.error('❌ Error listing users:', userError);
      return withCorsJson({ error: 'Server error' }, 500, req)
    }

    const user = users.users.find(u => u.email === email);
    
    if (!user) {
      console.log('⚠️ Password reset requested for non-existent email:', email);
      // Return a specific response for non-existent users while maintaining security
      return withCorsJson({ 
        success: false, 
        error: 'Email not found',
        message: 'No account found with this email address. Please check the email address or contact support if you believe this is an error.',
        userExists: false
      }, 200, req)
    }

    console.log('✅ User found, generating password reset link');

    // Generate password reset link using Supabase Auth
    // Use the frontend URL for redirect, not the Supabase URL
    const isDevelopment = Deno.env.get('ENVIRONMENT') === 'development';
    const frontendUrl = isDevelopment 
      ? (Deno.env.get('FRONTEND_URL_DEV') || 'http://localhost:5173')
      : (Deno.env.get('FRONTEND_URL') || 'https://ogetto-otachi-law-firm.web.app');
    
    console.log('🔗 Environment:', isDevelopment ? 'development' : 'production');
    console.log('🔗 Frontend URL:', frontendUrl);
    console.log('🔗 Redirect URL:', `${frontendUrl}/reset-password`);
    
    const { data: resetData, error: resetError } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: email,
      options: {
        redirectTo: `${frontendUrl}/reset-password`
      }
    });

    if (resetError) {
      console.error('❌ Error generating reset link:', resetError);
      return withCorsJson({ error: 'Failed to generate reset link' }, 500, req)
    }

    if (!resetData.properties?.action_link) {
      console.error('❌ No reset link generated');
      return withCorsJson({ error: 'Failed to generate reset link' }, 500, req)
    }

    const resetLink = resetData.properties.action_link;
    console.log('🔗 Generated reset link for:', email);

    // Send the password reset email
    const emailSent = await sendPasswordResetEmail(email, resetLink);

    if (emailSent) {
      console.log('✅ Password reset email sent successfully to:', email);
      return withCorsJson({ 
        success: true, 
        message: 'Password reset link has been sent to your email address.',
        rateLimitInfo: {
          remainingRequests: rateLimitResult.remainingRequests,
          windowResetTime: rateLimitResult.windowResetTime
        }
      }, 200, req)
    } else {
      console.error('❌ Failed to send password reset email');
      return withCorsJson({ error: 'Failed to send password reset email' }, 500, req)
    }

  } catch (error) {
    console.error('❌ Error in request-password-reset function:', error);
    return withCorsJson({ error: 'Internal server error' }, 500, req)
  }
});
