// @ts-nocheck
// Shared CORS utilities for Supabase Edge Functions (backend)
export const ALLOWED_ORIGIN = Deno.env.get('CORS_ALLOWED_ORIGIN') || '*'

export function buildCorsHeaders(req?: Request): Record<string, string> {
  const origin = req?.headers.get('origin') || ALLOWED_ORIGIN
  const requestedHeaders = req?.headers.get('access-control-request-headers')
  const allowHeaders = requestedHeaders && requestedHeaders.trim().length > 0
    ? requestedHeaders
    : 'authorization, x-supabase-authorization, x-client-info, apikey, content-type'
  const requestedMethod = req?.headers.get('access-control-request-method') || 'POST'
  return {
    'Access-Control-Allow-Origin': origin,
    'Vary': 'Origin',
    'Access-Control-Allow-Headers': allowHeaders,
    'Access-Control-Allow-Methods': `${requestedMethod}, OPTIONS, GET, POST`,
    'Access-Control-Max-Age': '86400',
  }
}

export const corsHeaders = buildCorsHeaders()

export function handleOptions(req: Request): Response | null {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: buildCorsHeaders(req) })
  }
  return null
}

export function withCors(body: BodyInit | null, init?: ResponseInit, req?: Request): Response {
  const headers = { ...(init?.headers || {}), ...buildCorsHeaders(req) }
  return new Response(body, { ...init, headers })
}

export function withCorsJson(data: unknown, status = 200, req?: Request): Response {
  const headers = { ...buildCorsHeaders(req), 'Content-Type': 'application/json' }
  return new Response(JSON.stringify(data), { status, headers })
}


