// @ts-nocheck
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { 
  withAuth, 
  AuthResult 
} from '../_shared/auth.ts';
import { 
  corsHeaders, 
  createErrorResponse 
} from '../_shared/error-handler.ts';

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 100; // 100 requests per minute
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Get client identifier for rate limiting
function getClientIdentifier(req: Request): string {
  const authHeader = req.headers.get('authorization');
  if (authHeader) {
    // Use user ID from token for authenticated requests
    return authHeader.replace('Bearer ', '').split('.')[0]; // Use token prefix as identifier
  }

  // Use IP address for unauthenticated requests
  const forwardedFor = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');
  return forwardedFor?.split(',')[0] || realIp || 'unknown';
}

// Rate limit check function
function checkRateLimit(clientId: string): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const existingLimit = rateLimitStore.get(clientId);

  // Reset rate limit if window has passed
  if (!existingLimit || now > existingLimit.resetTime) {
    const newLimit = {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW
    };
    rateLimitStore.set(clientId, newLimit);
    return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - 1, resetTime: newLimit.resetTime };
  }

  // Check if limit is exceeded
  if (existingLimit.count >= RATE_LIMIT_MAX_REQUESTS) {
    return { 
      allowed: false, 
      remaining: 0, 
      resetTime: existingLimit.resetTime 
    };
  }

  // Increment request count
  existingLimit.count++;
  return { 
    allowed: true, 
    remaining: RATE_LIMIT_MAX_REQUESTS - existingLimit.count, 
    resetTime: existingLimit.resetTime 
  };
}

// Logging function
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

// GET handler for retrieving appointments
async function handleGetAppointments(req: Request, authResult: AuthResult): Promise<Response> {
  const startTime = Date.now();
  const url = new URL(req.url);
  const method = req.method;
  const path = url.pathname;
  const clientId = getClientIdentifier(req);

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    // Get appointments with optional filtering
    const status = url.searchParams.get('status');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    // Validate pagination parameters
    if (limit < 1 || limit > 100) {
      throw new Error('Limit must be between 1 and 100');
    }
    if (offset < 0) {
      throw new Error('Offset must be non-negative');
    }

    let query = supabase
      .from('appointments')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    const { data: appointments, error } = await query;

    if (error) {
      console.error('Database error:', error);
      throw new Error('Failed to retrieve appointments from database');
    }

    const duration = Date.now() - startTime;

    // Log successful request
    log({
      timestamp: new Date().toISOString(),
      level: 'info',
      message: 'Appointments retrieved successfully',
      method,
      path,
      userId: authResult.user.id,
      userRole: authResult.profile.role,
      clientId,
      duration,
      statusCode: 200,
      metadata: {
        appointmentsCount: appointments.length,
        filters: { status, limit, offset },
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        appointments,
        count: appointments.length,
        pagination: {
          limit,
          offset,
          hasMore: appointments.length === limit,
        },
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('Appointments retrieval error:', error);

    return createErrorResponse(error, {
      method,
      path,
      clientId,
      duration,
    });
  }
}

// POST handler for creating appointments
async function handleCreateAppointment(req: Request, authResult: AuthResult): Promise<Response> {
  const startTime = Date.now();
  const url = new URL(req.url);
  const method = req.method;
  const path = url.pathname;
  const clientId = getClientIdentifier(req);

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    const appointmentData = await req.json();

    // Validate required fields
    const requiredFields = ['client_name', 'email', 'date', 'time'];
    for (const field of requiredFields) {
      if (!appointmentData[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(appointmentData.email)) {
      throw new Error('Invalid email format');
    }

    // Validate date is not in the past
    const appointmentDate = new Date(appointmentData.date);
    const currentDate = new Date();
    if (appointmentDate < currentDate) {
      throw new Error('Appointment date cannot be in the past');
    }

    // Insert appointment
    const { data, error } = await supabase
      .from('appointments')
      .insert({
        ...appointmentData,
        status: 'pending',
        created_by: authResult.user.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      throw new Error('Failed to create appointment');
    }

    const duration = Date.now() - startTime;

    // Log successful appointment creation
    log({
      timestamp: new Date().toISOString(),
      level: 'info',
      message: 'Appointment created successfully',
      method,
      path,
      userId: authResult.user.id,
      userRole: authResult.profile.role,
      clientId,
      duration,
      statusCode: 200,
      metadata: {
        appointmentId: data.id,
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        appointment: data,
        message: 'Appointment created successfully',
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('Appointment creation error:', error);

    return createErrorResponse(error, {
      method,
      path,
      clientId,
      duration,
    });
  }
}

// Main serve function with authentication
export default serve(
  withAuth(async (req: Request, authResult: AuthResult) => {
    const clientId = getClientIdentifier(req);
    const rateLimit = checkRateLimit(clientId);

    if (!rateLimit.allowed) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Rate limit exceeded. Please try again later.',
          retryAfter: Math.ceil((rateLimit.resetTime - Date.now()) / 1000),
        }),
        {
          status: 429,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': RATE_LIMIT_MAX_REQUESTS.toString(),
            'X-RateLimit-Remaining': rateLimit.remaining.toString(),
            'X-RateLimit-Reset': new Date(rateLimit.resetTime).toISOString(),
            'Retry-After': Math.ceil((rateLimit.resetTime - Date.now()) / 1000).toString(),
          },
        }
      );
    }

    switch (req.method) {
      case 'GET':
        return await handleGetAppointments(req, authResult);
      case 'POST':
        return await handleCreateAppointment(req, authResult);
      case 'OPTIONS':
        return new Response('ok', { headers: corsHeaders });
      default:
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Method not allowed',
            allowedMethods: ['GET', 'POST', 'OPTIONS'],
          }),
          {
            status: 405,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
            },
          }
        );
    }
  }, {
    allowedRoles: ['admin', 'staff'], // Only admin and staff can access
    requireAuth: true
  })
);
