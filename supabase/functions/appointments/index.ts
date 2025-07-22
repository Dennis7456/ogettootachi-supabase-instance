// @ts-nocheck
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 100; // 100 requests per minute
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Structured logging interface
interface LogEntry {
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
}

// Structured logging function
function log(entry: LogEntry) {
  const logMessage = {
    ...entry,
    service: 'appointments-edge-function',
    environment: Deno.env.get('ENVIRONMENT') || 'development',
  };

  console.log(JSON.stringify(logMessage));
}

// Rate limiting function
function checkRateLimit(identifier: string): {
  allowed: boolean;
  remaining: number;
  resetTime: number;
} {
  const now = Date.now();
  const record = rateLimitStore.get(identifier);

  if (!record || now > record.resetTime) {
    // Reset or create new record
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW,
    });
    return {
      allowed: true,
      remaining: RATE_LIMIT_MAX_REQUESTS - 1,
      resetTime: now + RATE_LIMIT_WINDOW,
    };
  }

  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    return { allowed: false, remaining: 0, resetTime: record.resetTime };
  }

  // Increment count
  record.count++;
  rateLimitStore.set(identifier, record);

  return {
    allowed: true,
    remaining: RATE_LIMIT_MAX_REQUESTS - record.count,
    resetTime: record.resetTime,
  };
}

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

// Enhanced error handling function
function createErrorResponse(
  error: Error,
  statusCode: number = 400,
  metadata?: Record<string, any>
) {
  log({
    timestamp: new Date().toISOString(),
    level: 'error',
    message: error.message,
    statusCode,
    error: error.stack,
    metadata,
  });

  return new Response(
    JSON.stringify({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
      statusCode,
    }),
    {
      status: statusCode,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}

serve(async (req) => {
  const startTime = Date.now();
  const url = new URL(req.url);
  const method = req.method;
  const path = url.pathname;

  // Log request start
  log({
    timestamp: new Date().toISOString(),
    level: 'info',
    message: 'Request started',
    method,
    path,
    clientId: getClientIdentifier(req),
  });

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Apply rate limiting
  const clientId = getClientIdentifier(req);
  const rateLimit = checkRateLimit(clientId);

  if (!rateLimit.allowed) {
    log({
      timestamp: new Date().toISOString(),
      level: 'warn',
      message: 'Rate limit exceeded',
      method,
      path,
      clientId,
      metadata: {
        rateLimit: {
          limit: RATE_LIMIT_MAX_REQUESTS,
          remaining: rateLimit.remaining,
          resetTime: new Date(rateLimit.resetTime).toISOString(),
        },
      },
    });

    return new Response(
      JSON.stringify({
        success: false,
        error: 'Rate limit exceeded. Please try again later.',
        retryAfter: Math.ceil((rateLimit.resetTime - Date.now()) / 1000),
        timestamp: new Date().toISOString(),
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

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  // Handle GET requests (retrieve appointments)
  if (req.method === 'GET') {
    try {
      // Verify authentication for admin access
      const authHeader = req.headers.get('authorization');
      if (!authHeader) {
        throw new Error('Authorization header required');
      }

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
      if (authError || !user) {
        throw new Error('Invalid or expired token');
      }

      // Check if user is admin/staff
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (!profile || !['admin', 'staff'].includes(profile.role)) {
        throw new Error('Insufficient permissions - admin or staff access required');
      }

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
        userId: user.id,
        userRole: profile.role,
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
            'X-RateLimit-Limit': RATE_LIMIT_MAX_REQUESTS.toString(),
            'X-RateLimit-Remaining': rateLimit.remaining.toString(),
            'X-RateLimit-Reset': new Date(rateLimit.resetTime).toISOString(),
          },
        }
      );
    } catch (error) {
      const duration = Date.now() - startTime;
      let statusCode = 400;

      if (error.message.includes('Authorization header required')) {
        statusCode = 401;
      } else if (error.message.includes('Invalid or expired token')) {
        statusCode = 401;
      } else if (error.message.includes('Insufficient permissions')) {
        statusCode = 403;
      } else if (error.message.includes('Failed to retrieve')) {
        statusCode = 500;
      }

      return createErrorResponse(error, statusCode, {
        method,
        path,
        clientId,
        duration,
      });
    }
  }

  // Handle POST requests (create appointment)
  if (req.method === 'POST') {
    try {
      const { name, email, phone, practice_area, preferred_date, preferred_time, message } =
        await req.json();

      // Validate required fields
      if (!name || !email || !practice_area || !preferred_date || !preferred_time) {
        throw new Error(
          'Missing required fields: name, email, practice_area, preferred_date, preferred_time'
        );
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new Error('Invalid email format');
      }

      // Validate date is not in the past
      const appointmentDate = new Date(preferred_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (appointmentDate < today) {
        throw new Error('Appointment date cannot be in the past');
      }

      // Validate time format
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9](\s?(AM|PM))?$/i;
      if (!timeRegex.test(preferred_time)) {
        throw new Error('Invalid time format. Use HH:MM or HH:MM AM/PM');
      }

      // Insert appointment into database
      const { data, error } = await supabase
        .from('appointments')
        .insert([
          {
            client_name: name,
            client_email: email,
            client_phone: phone || null,
            practice_area,
            preferred_date,
            preferred_time,
            message: message || null,
            status: 'pending',
          },
        ])
        .select()
        .single();

      if (error) {
        console.error('Database error:', error);
        throw new Error('Failed to create appointment in database');
      }

      const duration = Date.now() - startTime;

      // Log successful appointment creation
      log({
        timestamp: new Date().toISOString(),
        level: 'info',
        message: 'Appointment created successfully',
        method,
        path,
        clientId,
        duration,
        statusCode: 200,
        metadata: {
          appointmentId: data.id,
          practiceArea: practice_area,
          preferredDate: preferred_date,
          clientEmail: email,
        },
      });

      // Optional: Send confirmation email (you can implement this later)
      // await sendConfirmationEmail(email, name, preferred_date, preferred_time)

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Appointment submitted successfully. We will contact you to confirm.',
          appointment: data,
          timestamp: new Date().toISOString(),
        }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': RATE_LIMIT_MAX_REQUESTS.toString(),
            'X-RateLimit-Remaining': rateLimit.remaining.toString(),
            'X-RateLimit-Reset': new Date(rateLimit.resetTime).toISOString(),
          },
        }
      );
    } catch (error) {
      const duration = Date.now() - startTime;
      let statusCode = 400;

      if (error.message.includes('Missing required fields')) {
        statusCode = 400;
      } else if (error.message.includes('Invalid email format')) {
        statusCode = 400;
      } else if (error.message.includes('Appointment date cannot be in the past')) {
        statusCode = 400;
      } else if (error.message.includes('Invalid time format')) {
        statusCode = 400;
      } else if (error.message.includes('Failed to create appointment')) {
        statusCode = 500;
      }

      return createErrorResponse(error, statusCode, {
        method,
        path,
        clientId,
        duration,
      });
    }
  }

  // Handle PUT requests (update appointment)
  if (req.method === 'PUT') {
    try {
      const appointmentId = url.pathname.split('/').pop();

      if (!appointmentId) {
        throw new Error('Appointment ID is required');
      }

      // Verify authentication for admin access
      const authHeader = req.headers.get('authorization');
      if (!authHeader) {
        throw new Error('Authorization header required');
      }

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
      if (authError || !user) {
        throw new Error('Invalid or expired token');
      }

      // Check if user is admin/staff
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (!profile || !['admin', 'staff'].includes(profile.role)) {
        throw new Error('Insufficient permissions - admin or staff access required');
      }

      const { status, notes } = await req.json();

      // Validate status if provided
      if (status && !['pending', 'confirmed', 'completed', 'cancelled'].includes(status)) {
        throw new Error('Invalid status. Must be one of: pending, confirmed, completed, cancelled');
      }

      // Update appointment
      const { data, error } = await supabase
        .from('appointments')
        .update({
          status: status || undefined,
          notes: notes || undefined,
          updated_at: new Date().toISOString(),
        })
        .eq('id', appointmentId)
        .select()
        .single();

      if (error) {
        console.error('Database error:', error);
        throw new Error('Failed to update appointment');
      }

      if (!data) {
        throw new Error('Appointment not found');
      }

      const duration = Date.now() - startTime;

      // Log successful update
      log({
        timestamp: new Date().toISOString(),
        level: 'info',
        message: 'Appointment updated successfully',
        method,
        path,
        userId: user.id,
        userRole: profile.role,
        clientId,
        duration,
        statusCode: 200,
        metadata: {
          appointmentId,
          status,
          hasNotes: !!notes,
        },
      });

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Appointment updated successfully',
          appointment: data,
          timestamp: new Date().toISOString(),
        }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': RATE_LIMIT_MAX_REQUESTS.toString(),
            'X-RateLimit-Remaining': rateLimit.remaining.toString(),
            'X-RateLimit-Reset': new Date(rateLimit.resetTime).toISOString(),
          },
        }
      );
    } catch (error) {
      const duration = Date.now() - startTime;
      let statusCode = 400;

      if (error.message.includes('Authorization header required')) {
        statusCode = 401;
      } else if (error.message.includes('Invalid or expired token')) {
        statusCode = 401;
      } else if (error.message.includes('Insufficient permissions')) {
        statusCode = 403;
      } else if (error.message.includes('Appointment not found')) {
        statusCode = 404;
      } else if (error.message.includes('Failed to update')) {
        statusCode = 500;
      }

      return createErrorResponse(error, statusCode, {
        method,
        path,
        clientId,
        duration,
      });
    }
  }

  // Handle DELETE requests (delete appointment)
  if (req.method === 'DELETE') {
    try {
      const appointmentId = url.pathname.split('/').pop();

      if (!appointmentId) {
        throw new Error('Appointment ID is required');
      }

      // Verify authentication for admin access
      const authHeader = req.headers.get('authorization');
      if (!authHeader) {
        throw new Error('Authorization header required');
      }

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
      if (authError || !user) {
        throw new Error('Invalid or expired token');
      }

      // Check if user is admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (!profile || profile.role !== 'admin') {
        throw new Error('Insufficient permissions - admin access required');
      }

      // Delete appointment
      const { error } = await supabase.from('appointments').delete().eq('id', appointmentId);

      if (error) {
        console.error('Database error:', error);
        throw new Error('Failed to delete appointment');
      }

      const duration = Date.now() - startTime;

      // Log successful deletion
      log({
        timestamp: new Date().toISOString(),
        level: 'info',
        message: 'Appointment deleted successfully',
        method,
        path,
        userId: user.id,
        userRole: profile.role,
        clientId,
        duration,
        statusCode: 200,
        metadata: {
          appointmentId,
        },
      });

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Appointment deleted successfully',
          timestamp: new Date().toISOString(),
        }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': RATE_LIMIT_MAX_REQUESTS.toString(),
            'X-RateLimit-Remaining': rateLimit.remaining.toString(),
            'X-RateLimit-Reset': new Date(rateLimit.resetTime).toISOString(),
          },
        }
      );
    } catch (error) {
      const duration = Date.now() - startTime;
      let statusCode = 400;

      if (error.message.includes('Authorization header required')) {
        statusCode = 401;
      } else if (error.message.includes('Invalid or expired token')) {
        statusCode = 401;
      } else if (error.message.includes('Insufficient permissions')) {
        statusCode = 403;
      } else if (error.message.includes('Failed to delete')) {
        statusCode = 500;
      }

      return createErrorResponse(error, statusCode, {
        method,
        path,
        clientId,
        duration,
      });
    }
  }

  // Handle unsupported methods
  const duration = Date.now() - startTime;

  log({
    timestamp: new Date().toISOString(),
    level: 'warn',
    message: 'Method not allowed',
    method,
    path,
    clientId,
    duration,
    statusCode: 405,
  });

  return new Response(
    JSON.stringify({
      success: false,
      error: 'Method not allowed',
      allowedMethods: ['GET', 'POST', 'PUT', 'DELETE'],
      timestamp: new Date().toISOString(),
    }),
    {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
});
