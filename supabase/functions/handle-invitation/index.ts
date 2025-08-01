// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
          HTMLPart: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #2563eb;">Welcome to Ogetto, Otachi & Company Advocates</h2>
              <p>Hello ${fullName},</p>
              <p>You have been invited to join our law firm portal as a staff member.</p>
              <p>To complete your account setup and confirm your email, please click the link below:</p>
              <p style="margin: 20px 0;">
                <a href="${inviteRedirectBaseUrl}/invitation?token=${invitationToken}" 
                   style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
                  Accept Invitation
                </a>
              </p>
              <p>This invitation link will expire in 7 days.</p>
              <p>If you have any questions, please contact the administrator.</p>
              <br>
              <p>Best regards,<br>Ogetto, Otachi & Company Advocates</p>
            </div>
          `
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

    // Check if user is admin
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || profile.role !== 'admin') {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Unauthorized: Admin access required' 
        }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
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
      // Find existing invitation
      const { data: existingInvitation, error: findError } = await supabaseClient
        .from('user_invitations')
        .select('*')
        .eq('email', email)
        .eq('status', 'pending')
        .single()

      if (findError || !existingInvitation) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'No pending invitation found for this email' 
          }),
          { 
            status: 404, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      // Resend the invitation email
      const emailSent = await sendInvitationEmail(email, existingInvitation.full_name || email, existingInvitation.token)

      if (emailSent) {
        // Update invitation timestamp
        await supabaseClient
          .from('user_invitations')
          .update({ 
            updated_at: new Date().toISOString(),
            resend_count: (existingInvitation.resend_count || 0) + 1
          })
          .eq('id', existingInvitation.id)

        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Invitation resent successfully' 
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
            error: 'Failed to send invitation email' 
          }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
    }

    // Handle create invitation
    if (action === 'create') {
          // Check if user already exists and their status
    const { data: existingUsers } = await supabaseClient.auth.admin.listUsers()
    const existingUser = existingUsers.users.find(u => u.email === email)

    if (existingUser) {
      // Check if user is active (email confirmed and profile active)
      const { data: userProfile, error: profileError } = await supabaseClient
        .from('profiles')
        .select('is_active, email_confirmed')
        .eq('id', existingUser.id)
        .single()

      if (profileError) {
        console.error('Error fetching user profile:', profileError)
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Error checking user status' 
          }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      // Check if user is active (email confirmed and profile active)
      const isUserActive = existingUser.email_confirmed_at && userProfile?.is_active

      if (isUserActive) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'User with this email is already active and cannot be re-invited' 
          }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      // User exists but is inactive - allow re-invitation
      console.log('User exists but is inactive, allowing re-invitation')
      
      // Check for existing invitation
      const { data: existingInvitation, error: invitationError } = await supabaseClient
        .from('user_invitations')
        .select('*')
        .eq('email', email)
        .eq('status', 'pending')
        .single()

      if (existingInvitation) {
        // Update existing invitation
        const newToken = generateToken()
        await supabaseClient
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
          return new Response(
            JSON.stringify({ 
              success: true, 
              message: 'Re-invitation sent successfully to inactive user',
              user_id: existingUser.id
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
              error: 'Failed to send re-invitation email' 
            }),
            { 
              status: 500, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }
      }
    }

      // Generate invitation token
      const invitationToken = generateToken()

      // Create user with email confirmation disabled
      const { data: userData, error: createError } = await supabaseClient.auth.admin.createUser({
        email,
        email_confirm: false,
        user_metadata: {
          full_name: full_name || email,
          role: role
        }
      })

      if (createError) {
        console.error('Error creating user:', createError)
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: createError.message 
          }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      // Create minimal profile data (required fields)
      const profileData = {
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
      if (typeof professional_image !== 'undefined' && professional_image !== null) profileData.professional_image = professional_image;
      if (typeof bio !== 'undefined' && bio !== null) profileData.bio = bio;
      if (typeof email_confirmed !== 'undefined' && email_confirmed !== null) profileData.email_confirmed = email_confirmed;
      // Add more optional fields here ONLY if they exist in your table

      // LOGGING: Output the profile data before insert
      console.log('Attempting to insert profile with data:', JSON.stringify(profileData, null, 2));

      // Insert profile
      const { error: profileError } = await supabaseClient
        .from('profiles')
        .insert(profileData)

      // LOGGING: Output the error if insert fails
      if (profileError) {
        console.error('Error creating profile:', profileError);
        console.error('Profile data that caused error:', JSON.stringify(profileData, null, 2));
      }

      if (profileError) {
        console.error('Error creating profile:', profileError)
        // Clean up the created user if profile creation fails
        await supabaseClient.auth.admin.deleteUser(userData.user.id)
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Failed to create user profile' 
          }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      // Create invitation record
      const { error: invitationError } = await supabaseClient
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
        await supabaseClient.auth.admin.deleteUser(userData.user.id)
        await supabaseClient.from('profiles').delete().eq('id', userData.user.id)
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Failed to create invitation record' 
          }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      // Send invitation email
      const emailSent = await sendInvitationEmail(email, full_name || email, invitationToken)

      if (emailSent) {
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Invitation sent successfully',
            user_id: userData.user.id
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      } else {
        // Clean up if email fails
        await supabaseClient.auth.admin.deleteUser(userData.user.id)
        await supabaseClient.from('profiles').delete().eq('id', userData.user.id)
        await supabaseClient.from('user_invitations').delete().eq('email', email)
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Failed to send invitation email' 
          }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
    }

    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Invalid action specified' 
      }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in handle-invitation function:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}) 