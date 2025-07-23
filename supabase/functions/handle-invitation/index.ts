import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { 
  withAuth, 
  AuthResult, 
  authenticateRequest 
} from '../_shared/auth';
import { 
  corsHeaders, 
  createErrorResponse 
} from '../_shared/error-handler';

// Configuration helper
const getConfig = () => ({
  SUPABASE_URL: Deno.env.get('SUPABASE_URL') || 'http://127.0.0.1:54321',
  SUPABASE_SERVICE_ROLE_KEY: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '',
  FRONTEND_URL: Deno.env.get('FRONTEND_URL') || 'http://localhost:5173',
});

// Logging function with enhanced error tracking
function log(entry: {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  method?: string;
  path?: string;
  userId?: string;
  userRole?: string;
  clientId?: string;
  duration?: number;
  statusCode?: number;
  error?: string;
  metadata?: Record<string, any>;
}) {
  console.log(JSON.stringify(entry));
}

// Main invitation handler
async function handleInvitation(req: Request, authResult: AuthResult): Promise<Response> {
  const startTime = Date.now();
  const url = new URL(req.url);
  const method = req.method;
  const path = url.pathname;

  try {
    // Detailed logging of request context
    console.log('Invitation Request Context:', {
      method,
      path,
      authUser: authResult.user?.id,
      authUserRole: authResult.profile?.role,
      headers: Object.fromEntries(req.headers)
    });

    const config = getConfig();
    const supabase = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);

    // Parse invitation payload with detailed error handling
    let payload: Record<string, any>;
    try {
      payload = await req.json();
    } catch (parseError: unknown) {
      console.error('Payload Parsing Error:', {
        error: parseError instanceof Error ? parseError.message : String(parseError),
        stack: parseError instanceof Error ? parseError.stack : undefined,
        rawBody: await req.text()
      });
      throw new Error('Invalid request payload');
    }

    const { 
      email, 
      role, 
      department, 
      custom_message, 
      full_name,
      force_resend = false 
    } = payload;

    // Validate required fields
    if (!email || !role) {
      console.error('Validation Error: Email and role are required', { email, role });
      throw new Error('Email and role are required');
    }

    // Log initial invitation details
    console.log('Invitation Request Details:', {
      email,
      role,
      department,
      force_resend,
      invitedBy: authResult.user.id
    });

    // Check for existing invitation
    const { data: existingInvitation, error: existingError } = await supabase
      .from('user_invitations')
      .select('*')
      .eq('email', email)
      .single();

    // Log existing invitation details
    console.log('Existing Invitation Check:', {
      existingInvitation: !!existingInvitation,
      existingError: existingError ? JSON.stringify(existingError) : null
    });

    // Handle duplicate invitation
    if (existingInvitation && !force_resend) {
      console.warn('Duplicate Invitation Attempt', { 
        email, 
        existingInvitationId: existingInvitation.id 
      });
      return new Response(
        JSON.stringify({
          error: 'Invitation already exists',
          details: 'An invitation for this email has already been sent'
        }),
        {
          status: 409,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Generate invitation token
    const invitationToken = crypto.randomUUID();

    // Construct invitation link
    const invitationLink = `${config.FRONTEND_URL}/invitation?token=${invitationToken}`;

    // Prepare invitation record
    const invitationRecord = {
      email,
      role,
      department: department || null,
      full_name: full_name || null,
      invitation_token: invitationToken,
      status: 'sent',
      expires_at: new Date(Date.now() + 72 * 60 * 60 * 1000), // 72 hours from now
      invited_by: authResult.user.id,
      custom_message: custom_message || null
    };

    // Insert or update invitation
    const { data, error } = existingInvitation
      ? await supabase
          .from('user_invitations')
          .update(invitationRecord)
          .eq('email', email)
          .select()
      : await supabase
          .from('user_invitations')
          .insert(invitationRecord)
          .select()
          .single();

    // Log database operation result
    console.log('Invitation Database Operation:', {
      success: !error,
      error: error ? JSON.stringify(error) : null,
      invitationId: data?.id
    });

    if (error) {
      console.error('Invitation Creation Error', { 
        error: JSON.stringify(error),
        invitationRecord 
      });
      throw error;
    }

    const duration = Date.now() - startTime;

    // Log invitation event
    log({
      timestamp: new Date().toISOString(),
      level: 'info',
      message: force_resend ? 'Invitation resent' : 'Invitation created',
      method,
      path,
      userId: authResult.user.id,
      userRole: authResult.profile?.role || 'unknown',
      duration,
      statusCode: 200,
      metadata: {
        email,
        role,
        invitationId: data.id,
        forceResend: force_resend,
      },
    });

    // Return successful response
    return new Response(
      JSON.stringify({
        success: true,
        message: force_resend ? 'Invitation resent' : 'Invitation sent',
        invitation_token: invitationToken,
        invitation: data,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  } catch (error: unknown) {
    const duration = Date.now() - startTime;
    console.error('❌ Invitation Error:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      details: JSON.stringify(error)
    });

    return createErrorResponse(
      error instanceof Error 
        ? error 
        : new Error(String(error)), 
      {
        method,
        path,
        duration,
      }
    );
  }
}

// Main serve function
export default serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Method not allowed', 
        allowedMethods: ['POST', 'OPTIONS'] 
      }), 
      {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  // Invitation requires admin or staff authentication
  return withAuth(handleInvitation, {
    allowedRoles: ['admin', 'staff'],
    requireAuth: true
  })(req);
});
