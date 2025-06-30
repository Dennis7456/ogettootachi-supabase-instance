import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { file_path, content, title, category } = await req.json()
    
    if (!content || !title) {
      throw new Error('Content and title are required')
    }

    // Get user from JWT token
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      throw new Error('Authorization header required')
    }

    // Create client with anon key for auth verification
    const supabaseAnon = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    // Create client with service role for database operations
    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Verify JWT and get user
    const { data: { user }, error: authError } = await supabaseAnon.auth.getUser(authHeader.replace('Bearer ', ''))
    if (authError || !user) {
      throw new Error('Invalid token')
    }

    // Check if user is admin
    const { data: profile } = await supabaseAnon
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    
    if (profile?.role !== 'admin') {
      throw new Error('Admin access required')
    }
    
    // Generate embedding using OpenAI
    const embedding = await generateEmbedding(content)
    
    // Insert into database using service role (bypasses RLS)
    const { data, error } = await supabaseService
      .from('documents')
      .insert({
        title,
        content,
        category: category || 'general',
        file_path,
        embedding
      })
      .select()
      .single()
    
    if (error) throw error
    
    return new Response(
      JSON.stringify({ success: true, data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Process document error:', error);
    return new Response(
      JSON.stringify({ error, message: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function generateEmbedding(text: string): Promise<number[]> {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      input: text,
      model: 'text-embedding-ada-002'
    })
  })
  
  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.statusText}`)
  }
  
  const result = await response.json()
  return result.data[0].embedding
} 