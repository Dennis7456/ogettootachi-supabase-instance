// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { handleOptions, withCorsJson } from '../_shared/cors.ts'

// Helper function to get email template with variables
function getEmailTemplate(variables: Record<string, string>): string {
  const template = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to Ogetto, Otachi & Company Advocates</title>
    <style>
        /* CSS Reset for email compatibility */
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        /* Reset for links and buttons */
        a, button {
            color: inherit;
            text-decoration: none;
        }
        /* Ensure button text is always visible */
        .cta-button, .cta-button * {
            color: white !important;
        }
        /* Additional email-safe button styles */
        .email-button {
            color: #ffffff !important;
            text-decoration: none !important;
            background: linear-gradient(135deg, #015260 0%, #1a365d 100%) !important;
            padding: 16px 32px !important;
            border-radius: 8px !important;
            font-weight: 600 !important;
            font-size: 16px !important;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
            line-height: 1.5 !important;
            text-align: center !important;
            display: inline-block !important;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #2d3748;
            margin: 0;
            padding: 0;
            background-color: #f7fafc;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
            border-radius: 12px;
            overflow: hidden;
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
        .header h1 {
            margin: 0;
            font-size: 32px;
            font-weight: 700;
            font-family: 'EB Garamond', serif;
            letter-spacing: -0.5px;
        }
        .header .subtitle {
            margin-top: 8px;
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
        }
        .message {
            font-size: 16px;
            margin-bottom: 30px;
            line-height: 1.8;
            color: #4a5568;
        }
        .invitation-card {
            background: linear-gradient(145deg, #f8fafc 0%, #f1f5f9 100%);
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 30px;
            margin: 30px 0;
            text-align: center;
            position: relative;
        }
        .invitation-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(90deg, #015260 0%, #d4af37 50%, #1a365d 100%);
            border-radius: 12px 12px 0 0;
        }
        .invitation-card h3 {
            color: #015260;
            margin: 0 0 16px 0;
            font-size: 22px;
            font-weight: 600;
        }
        .invitation-card p {
            color: #64748b;
            margin-bottom: 24px;
            font-size: 15px;
        }
        .expiry-notice {
            background-color: #fef3c7;
            border: 1px solid #fbbf24;
            border-radius: 8px;
            padding: 20px;
            margin: 30px 0;
            text-align: center;
        }
        .expiry-notice h4 {
            color: #92400e;
            margin: 0 0 8px 0;
            font-size: 16px;
            font-weight: 600;
        }
        .expiry-notice p {
            color: #92400e;
            margin: 0;
            font-size: 14px;
        }
        .features {
            display: flex;
            justify-content: space-between;
            margin: 30px 0;
            gap: 20px;
        }
        .feature {
            flex: 1;
            text-align: center;
            padding: 20px;
            background: linear-gradient(145deg, #ffffff 0%, #f8fafc 100%);
            border: 1px solid #e2e8f0;
            border-radius: 8px;
        }
        .feature-icon {
            width: 40px;
            height: 40px;
            background: linear-gradient(135deg, #015260 0%, #1a365d 100%);
            border-radius: 50%;
            margin: 0 auto 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 18px;
            font-weight: bold;
        }
        .feature h4 {
            color: #015260;
            margin: 0 0 8px 0;
            font-size: 14px;
            font-weight: 600;
        }
        .feature p {
            color: #64748b;
            margin: 0;
            font-size: 12px;
            line-height: 1.4;
        }
        .contact-info {
            background-color: #f0f9ff;
            border: 1px solid #bae6fd;
            border-radius: 8px;
            padding: 20px;
            margin: 30px 0;
            text-align: center;
        }
        .contact-info h4 {
            color: #0369a1;
            margin: 0 0 12px 0;
            font-size: 16px;
            font-weight: 600;
        }
        .contact-info p {
            color: #0369a1;
            margin: 0;
            font-size: 14px;
        }
        .footer {
            background-color: #1e293b;
            color: white;
            padding: 30px 20px;
            text-align: center;
        }
        .footer-content {
            max-width: 400px;
            margin: 0 auto;
        }
        .footer h3 {
            color: #d4af37;
            margin: 0 0 12px 0;
            font-size: 18px;
            font-weight: 600;
        }
        .footer p {
            margin: 0 0 8px 0;
            font-size: 14px;
            opacity: 0.8;
        }
        .footer .divider {
            width: 60px;
            height: 2px;
            background: linear-gradient(90deg, #015260 0%, #d4af37 50%, #1a365d 100%);
            margin: 16px auto;
        }
        @media (max-width: 600px) {
            .container {
                margin: 10px;
                border-radius: 8px;
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
            .features {
                flex-direction: column;
                gap: 15px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="header-content">
                <h1>Ogetto, Otachi & Company</h1>
                <div class="subtitle">Advocates & Legal Consultants</div>
            </div>
        </div>
        
        <div class="content">
            <div class="greeting">Welcome, {{fullName}}!</div>
            
            <div class="message">
                We are delighted to invite you to join our esteemed law firm as a valued member of our team. 
                Your expertise and dedication will contribute to our continued success in providing exceptional 
                legal services to our clients.
            </div>
            
            <div class="invitation-card">
                <h3>Complete Your Account Setup</h3>
                <p>To begin your journey with us, please complete your account setup by clicking the button below:</p>
                <!-- Simple, reliable email button -->
                <div style="text-align: center; margin: 20px 0;">
                    <a href="{{invitationUrl}}" style="background-color: #015260; color: #ffffff; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; font-family: Arial, sans-serif; display: inline-block; border: 2px solid #015260;">
                        Accept Invitation
                    </a>
                </div>
            </div>
            
            <div class="expiry-notice">
                <h4>⏰ Important Notice</h4>
                <p>This invitation link will expire in 7 days. Please complete your setup before the expiration date.</p>
            </div>
            
            <div class="features">
                <div class="feature">
                    <div class="feature-icon">🔐</div>
                    <h4>Secure Access</h4>
                    <p>Protected portal with advanced security measures</p>
                </div>
                <div class="feature">
                    <div class="feature-icon">⚡</div>
                    <h4>Quick Setup</h4>
                    <p>Simple and streamlined onboarding process</p>
                </div>
                <div class="feature">
                    <div class="feature-icon">🤝</div>
                    <h4>Team Collaboration</h4>
                    <p>Connect with colleagues and access resources</p>
                </div>
            </div>
            
            <div class="contact-info">
                <h4>Need Assistance?</h4>
                <p>If you have any questions or need technical support, please contact our IT team or your department administrator.</p>
            </div>
        </div>
        
        <div class="footer">
            <div class="footer-content">
                <h3>Ogetto, Otachi & Company</h3>
                <p>Advocates & Legal Consultants</p>
                <div class="divider"></div>
                <p>Excellence in Legal Services</p>
                <p>Building Trust Through Professional Excellence</p>
            </div>
        </div>
    </div>
</body>
</html>`;

  // Replace template variables
  let processedTemplate = template;
  for (const [key, value] of Object.entries(variables)) {
    const placeholder = `{{${key}}}`;
    processedTemplate = processedTemplate.replace(new RegExp(placeholder, 'g'), value);
  }
  
  return processedTemplate;
}

function generateToken(length = 48) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < length; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

async function sendInvitationEmail(email: string, fullName: string, invitationToken: string) {
  try {
    const mailjetApiKey = Deno.env.get('MAILJET_API_KEY');
    const mailjetApiSecret = Deno.env.get('MAILJET_API_SECRET');
    
    if (!mailjetApiKey || !mailjetApiSecret) {
      console.log('⚠️ Mailjet credentials not found, logging email instead');
      console.log('Email would be sent:', {
        to: email,
        subject: 'Welcome to Ogetto, Otachi & Company Advocates',
        invitationToken: invitationToken
      });
      return true;
    }

    // Get frontend base URL for invitation link from env or default
    const inviteRedirectBaseUrl = Deno.env.get('INVITE_REDIRECT_BASE_URL') || 'http://localhost:5173';
    
    // Generate invitation URL
    const invitationUrl = `${inviteRedirectBaseUrl}/invitation-accept?token=${invitationToken}&type=invite`;
    
    // Get email template with variables
    const emailHtml = getEmailTemplate({
      fullName: fullName,
      invitationUrl: invitationUrl
    });

    const emailData = {
      Messages: [
        {
          From: {
            Email: "support@anydayessay.com",
            Name: "Ogetto, Otachi & Company Advocates"
          },
          To: [
            {
              Email: email,
              Name: fullName
            }
          ],
          Subject: "Welcome to Ogetto, Otachi & Company Advocates",
          HTMLPart: emailHtml
        }
      ]
    };

    console.log('📧 Sending invitation email via Mailjet...');
    
    // Create base64 encoded credentials for Mailjet
    const credentials = `${mailjetApiKey}:${mailjetApiSecret}`;
    // Use Deno-compatible base64 encoding
    const encodedCredentials = btoa ? btoa(credentials) : Buffer.from(credentials).toString('base64');
    
    const response = await fetch('https://api.mailjet.com/v3.1/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${encodedCredentials}`
      },
      body: JSON.stringify(emailData)
    });

    const result = await response.json();
    
    if (response.ok && result.Messages && result.Messages[0].Status === 'success') {
      console.log('✅ Email sent successfully via Mailjet');
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
  const optionsResponse = handleOptions(req)
  if (optionsResponse) return optionsResponse

  try {
    // Get the authorization header
    const authHeader = req.headers.get('authorization')
        if (!authHeader) {
      return withCorsJson({
          success: false,
          error: 'No authorization header provided'
      }, 401, req)
    }

    // Create a Supabase client with the anon key for token validation
    const supabaseAnonClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Create a Supabase client with the service role key for admin operations
    const supabaseServiceClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Verify the JWT token using the anon client
    const { data: { user }, error: authError } = await supabaseAnonClient.auth.getUser(authHeader.replace('Bearer ', ''))
    
        if (authError || !user) {
      return withCorsJson({
          success: false,
          error: 'Invalid or expired token'
      }, 401, req)
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabaseServiceClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

        if (profileError || !profile || profile.role !== 'admin') {
      return withCorsJson({
          success: false,
          error: 'Unauthorized: Admin access required'
      }, 403, req)
    }

    // Get the request body
    const {
      email,
      role = 'staff',
      full_name,
      title,
      phone,
      profile_picture,
      education,
      specializations = [],
      years_of_experience,
      memberships = [],
      certifications = [],
      bio,
      personal_story,
      areas_of_practice = [],
      action = 'create' // 'create' or 'resend'
    } = await req.json()

    console.log('Received request:', { email, full_name, role, action })

    // Handle resend invitation
    if (action === 'resend') {
      console.log('🔄 Resend action for email:', email);
      
      // Find existing invitation
      const { data: existingInvitation, error: findError } = await supabaseServiceClient
        .from('user_invitations')
        .select('*')
        .eq('email', email)
        .eq('status', 'pending')
        .single()

      console.log('🔍 Invitation lookup result:', {
        found: !!existingInvitation,
        error: findError?.message,
        invitation: existingInvitation ? {
          id: existingInvitation.id,
          email: existingInvitation.email,
          status: existingInvitation.status,
          created_at: existingInvitation.created_at
        } : null
      });

      if (findError || !existingInvitation) {
        console.log('❌ No pending invitation found for email:', email);
        console.log('🔄 Creating new invitation for existing user...');
        
        // Check if user exists
        const { data: existingUsers } = await supabaseServiceClient.auth.admin.listUsers();
        const existingUser = existingUsers.users.find(u => u.email === email);
        
        if (!existingUser) {
          return withCorsJson({ 
              success: false, 
              error: 'User not found' 
          }, 404, req)
        }
        
        // Create a new invitation for the existing user
        const newToken = generateToken();
        const { error: createInvitationError } = await supabaseServiceClient
          .from('user_invitations')
          .insert({
            email: email,
            full_name: existingUser.user_metadata?.full_name || email,
            role: existingUser.user_metadata?.role || 'staff',
            invitation_token: newToken,
            invited_by: user.id,
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
            status: 'pending'
          });
          
        if (createInvitationError) {
          console.error('❌ Error creating new invitation:', createInvitationError);
          return withCorsJson({ 
              success: false, 
              error: 'Failed to create invitation record' 
          }, 500, req)
        }
        
        // Send the new invitation email
        const emailSent = await sendInvitationEmail(email, existingUser.user_metadata?.full_name || email, newToken);
        
        if (emailSent) {
          return withCorsJson({ 
              success: true, 
              message: 'New invitation sent successfully' 
          }, 200, req)
        } else {
          return withCorsJson({ 
              success: false, 
              error: 'Failed to send invitation email' 
          }, 500, req)
        }
      }

      // Resend the invitation email
      const emailSent = await sendInvitationEmail(email, existingInvitation.full_name || email, existingInvitation.invitation_token)

      if (emailSent) {
        // Update invitation timestamp
        await supabaseServiceClient
          .from('user_invitations')
          .update({ 
            updated_at: new Date().toISOString(),
            resend_count: (existingInvitation.resend_count || 0) + 1
          })
          .eq('id', existingInvitation.id)

        return withCorsJson({ 
            success: true, 
            message: 'Invitation resent successfully' 
        }, 200, req)
      } else {
        return withCorsJson({ 
            success: false, 
            error: 'Failed to send invitation email' 
        }, 500, req)
      }
    }

    // Handle create invitation
    if (action === 'create') {
          // Check if user already exists and their status
    const { data: existingUsers } = await supabaseServiceClient.auth.admin.listUsers()
    const existingUser = existingUsers.users.find(u => u.email === email)

    if (existingUser) {
      // Check if user is active (profile active)
      const { data: userProfile, error: profileError } = await supabaseServiceClient
        .from('profiles')
        .select('is_active')
        .eq('id', existingUser.id)
        .single()

      if (profileError) {
        console.error('Error fetching user profile:', profileError)
        return withCorsJson({ 
            success: false, 
            error: 'Error checking user status' 
        }, 500, req)
      }

      // Check if user is active (email confirmed and profile active)
      const isUserActive = existingUser.email_confirmed_at && userProfile?.is_active

      if (isUserActive) {
        return withCorsJson({ 
            success: false, 
            error: 'User with this email is already active and cannot be re-invited' 
        }, 400, req)
      }

      // User exists but is inactive - allow re-invitation
      console.log('User exists but is inactive, allowing re-invitation')
      
      // Check for existing invitation
      const { data: existingInvitation, error: invitationError } = await supabaseServiceClient
        .from('user_invitations')
        .select('*')
        .eq('email', email)
        .eq('status', 'pending')
        .single()

      if (existingInvitation) {
        // Update existing invitation
        const newToken = generateToken()
        await supabaseServiceClient
          .from('user_invitations')
          .update({
            invitation_token: newToken,
            updated_at: new Date().toISOString(),
            resend_count: (existingInvitation.resend_count || 0) + 1,
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
          })
          .eq('id', existingInvitation.id)

        // Send new invitation email
        const emailSent = await sendInvitationEmail(email, full_name || email, newToken)

        if (emailSent) {
          return withCorsJson({ 
              success: true, 
              message: 'Re-invitation sent successfully to inactive user',
              user_id: existingUser.id
          }, 200, req)
        } else {
            return withCorsJson({ 
              success: false, 
              error: 'Failed to send re-invitation email' 
            }, 500, req)
        }
      }
    }

      // Generate invitation token
      const invitationToken = generateToken()

      // Create user with email confirmation disabled
      const { data: userData, error: createError } = await supabaseServiceClient.auth.admin.createUser({
        email,
        email_confirm: false,
        email_confirmed_at: null,
        user_metadata: {
          full_name: full_name || email,
          role: role
        }
      })

      if (createError) {
        console.error('Error creating user:', createError)
        return withCorsJson({ 
            success: false, 
            error: createError.message 
        }, 400, req)
      }

      // Log the created user's email confirmation status
      console.log('✅ User created successfully:', {
        id: userData.user.id,
        email: userData.user.email,
        email_confirmed_at: userData.user.email_confirmed_at,
        email_confirm: userData.user.email_confirm
      })

      // Create minimal profile data (required fields)
      const profileData: any = {
        id: userData.user.id,
        email: email,
        full_name: full_name,
        role: role,
        is_active: true, // Explicitly set to true for new profiles
      };

      // Optionally add fields if provided and not undefined/null
      if (typeof title !== 'undefined' && title !== null) profileData.title = title;
      if (typeof phone !== 'undefined' && phone !== null) profileData.phone = phone;
      if (typeof profile_picture !== 'undefined' && profile_picture !== null) profileData.profile_picture = profile_picture;
      if (typeof bio !== 'undefined' && bio !== null) profileData.bio = bio;
      // Add more optional fields here ONLY if they exist in your table

      // LOGGING: Output the profile data before insert
      console.log('Attempting to insert profile with data:', JSON.stringify(profileData, null, 2));

      // Insert or update profile (avoid conflict with auth trigger that may auto-create profile)
      const { error: profileError } = await supabaseServiceClient
        .from('profiles')
        .upsert(profileData, { onConflict: 'id' })

      // LOGGING: Output the error if insert fails
      if (profileError) {
        console.error('Error creating profile:', profileError);
        console.error('Profile data that caused error:', JSON.stringify(profileData, null, 2));
      }

      if (profileError) {
        console.error('Error creating profile:', profileError)
        // Clean up the created user if profile creation fails
        await supabaseServiceClient.auth.admin.deleteUser(userData.user.id)
        return withCorsJson({ 
            success: false, 
            error: 'Failed to create user profile' 
        }, 500, req)
      }

      // Create invitation record
      const { error: invitationError } = await supabaseServiceClient
        .from('user_invitations')
        .insert({
          email: email,
          full_name: full_name || email,
          role: role,
          invitation_token: invitationToken, // <-- use correct column name
          invited_by: user.id,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
          status: 'pending'
        })

      if (invitationError) {
        console.error('Error creating invitation:', invitationError)
        // Clean up if invitation creation fails
        await supabaseServiceClient.auth.admin.deleteUser(userData.user.id)
        await supabaseServiceClient.from('profiles').delete().eq('id', userData.user.id)
        return withCorsJson({ 
            success: false, 
            error: 'Failed to create invitation record' 
        }, 500, req)
      }

      // Send invitation email
      const emailSent = await sendInvitationEmail(email, full_name || email, invitationToken)

      if (emailSent) {
        return withCorsJson({ 
            success: true, 
            message: 'Invitation sent successfully',
            user_id: userData.user.id
        }, 200, req)
      } else {
        // Clean up if email fails
        await supabaseServiceClient.auth.admin.deleteUser(userData.user.id)
        await supabaseServiceClient.from('profiles').delete().eq('id', userData.user.id)
        await supabaseServiceClient.from('user_invitations').delete().eq('email', email)
        return withCorsJson({ 
            success: false, 
            error: 'Failed to send invitation email' 
        }, 500, req)
      }
    }

    return withCorsJson({ 
        success: false, 
        error: 'Invalid action specified' 
    }, 400, req)

  } catch (error) {
    console.error('Error in handle-invitation function:', error)
    return withCorsJson({ 
        success: false, 
        error: 'Internal server error' 
    }, 500, req)
  }
}) 