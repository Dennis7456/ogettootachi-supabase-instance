// deno-lint-ignore-file no-explicit-any
/** Common utilities shared by all edge functions */

export const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers':
    'authorization, apiKey, content-type, supabase-elevated-role',
};

/**
 * Wraps an Error object (or string) into a JSON response with helpful metadata
 * and CORS headers.
 */
export function createErrorResponse(
  err: unknown,
  {
    statusCode = 500,
    method,
    path,
    duration,
    metadata = {},
  }: {
    statusCode?: number;
    method?: string;
    path?: string;
    duration?: number;
    metadata?: Record<string, any>;
  } = {},
): Response {
  const errorObj = err instanceof Error ? err : new Error(String(err));
  const body = {
    success: false,
    error: errorObj.message,
    stack: errorObj.stack?.split('\n').slice(0, 3).join('\n'), // send trimmed stack
    method,
    path,
    duration,
    metadata,
  };
  return new Response(JSON.stringify(body), {
    status: statusCode,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

/** Basic email regex */
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;

export function validateEmail(email: string) {
  if (!emailRegex.test(email)) {
    throw new Error('Invalid email format');
  }
}

/**
 * Ensures that an object contains all required keys (non-empty).
 */
export function validateRequiredFields(
  obj: Record<string, any>,
  required: string[],
) {
  const missing = required.filter((key) => !obj[key]);
  if (missing.length) {
    throw new Error(`Missing required fields: ${missing.join(', ')}`);
  }
}
