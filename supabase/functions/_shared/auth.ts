// deno-lint-ignore-file no-explicit-any
// Shared authentication utilities for Supabase edge functions
// Import the Supabase JS client from esm.sh so that Deno can load it at runtime
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export interface AuthResult {
  user: any | null;
  profile: Record<string, any> | null;
}

/**
 * Creates a Supabase client that authenticates every request with the provided JWT.
 */
function createAuthedClient(token: string) {
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || 'http://127.0.0.1:54321';
  return createClient(SUPABASE_URL, token, {
    global: {
      headers: { Authorization: `Bearer ${token}` },
    },
  });
}

/**
 * Authenticates the incoming request using the Bearer token (if provided).
 * Returns the decoded user and their profile row (if it exists).
 * If the request is unauthenticated, both values are null – allowing handlers
 * to decide if auth is required or not.
 */
export async function authenticateRequest(req: Request): Promise<AuthResult> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { user: null, profile: null };
  }

  const jwt = authHeader.split(' ')[1];
  const supabase = createAuthedClient(jwt);

  // Fetch user based on JWT
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error) {
    console.error('[auth] getUser error', error);
    return { user: null, profile: null };
  }

  let profile: Record<string, any> | null = null;
  try {
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL') || 'http://127.0.0.1:54321',
      serviceRoleKey,
    );
    const { data } = await serviceClient
      .from('profiles')
      .select('*')
      .eq('id', user?.id)
      .single();
    profile = data ?? null;
  } catch (err) {
    console.warn('[auth] profile lookup failed', err);
  }

  return { user, profile };
}

/**
 * Higher-order helper that injects the AuthResult into the handler.
 * This makes it easy to keep the edge-function handlers tidy.
 */
export function withAuth(
  handler: (req: Request, auth: AuthResult) => Promise<Response>,
): (req: Request) => Promise<Response> {
  return async (req: Request) => {
    const authResult = await authenticateRequest(req);
    return handler(req, authResult);
  };
}
