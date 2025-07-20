declare namespace Deno {
  export interface Env {
    get(key: string): string | undefined;
  }
  export const env: Env;
}

// @ts-ignore
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Types
interface ChatRequest {
  query: string;
  topK: number;
}

interface ChatResponse {
  success: boolean;
  answer: string;
  sources: Array<{ id: string; content: string }>;
}

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Simple mock embedding function
function generateMockEmbedding(text: string): number[] {
  // Create a simple hash-based embedding for testing
  const words = text.toLowerCase().split(/\s+/);
  const embedding = new Array(1536).fill(0);

  words.forEach((word, index) => {
    const hash = word.split('').reduce((a, b) => {
      a = (a << 5) - a + b.charCodeAt(0);
      return a & a;
    }, 0);
    const position = Math.abs(hash) % 1536;
    embedding[position] = 1;
  });

  return embedding;
}

// Search for relevant documents using pgvector
async function searchDocuments(
  queryEmbedding: number[],
  topK: number
): Promise<Array<{ id: string; content: string }>> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  try {
    console.log('Searching documents', {
      topK,
      embeddingLength: queryEmbedding.length,
    });

    const { data, error } = await supabase.rpc('match_documents', {
      query_embedding: queryEmbedding,
      match_count: topK,
    });

    if (error) {
      console.error('Database search failed:', error);
      throw error;
    }

    const sources =
      data?.map((doc: any) => ({
        id: doc.id,
        content: doc.content,
      })) || [];

    console.log('Documents found:', sources.length);
    return sources;
  } catch (error) {
    console.error('Failed to search documents:', error);
    throw error;
  }
}

// Build prompt from retrieved chunks
function buildPrompt(
  query: string,
  chunks: Array<{ id: string; content: string }>
): string {
  if (chunks.length === 0) {
    return `Question: ${query}\n\nAnswer: I don't have enough information to answer this question. Please contact our legal team for assistance.`;
  }

  const context = chunks
    .map((chunk, index) => `Chunk ${index + 1}: ${chunk.content}`)
    .join('\n\n–––\n\n');

  return `Context:\n${context}\n\nQuestion: ${query}\n\nAnswer:`;
}

// Main request handler
async function handleChatRequest(req: Request): Promise<Response> {
  try {
    const body: ChatRequest = await req.json();

    // Validate input
    if (!body.query || typeof body.query !== 'string') {
      console.warn('Invalid request: missing or invalid query', body);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Query is required and must be a string',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (
      !body.topK ||
      typeof body.topK !== 'number' ||
      body.topK < 1 ||
      body.topK > 20
    ) {
      console.warn('Invalid request: invalid topK', body.topK);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'topK must be a number between 1 and 20',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('Processing chat request', {
      queryLength: body.query.length,
      topK: body.topK,
    });

    // Generate mock embedding for the query
    const queryEmbedding = generateMockEmbedding(body.query);

    // Search for relevant documents
    const sources = await searchDocuments(queryEmbedding, body.topK);

    // Build prompt with context
    const prompt = buildPrompt(body.query, sources);

    // Generate mock response
    const answer = `Based on the available information, here's what I found: ${body.query}. This is a test response from the simplified chat function.`;

    const response: ChatResponse = {
      success: true,
      answer,
      sources,
    };

    console.log('Chat request completed successfully', {
      answerLength: answer.length,
      sourcesCount: sources.length,
    });

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Chat request failed:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: 'Internal server error',
        details: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
}

// Main serve function
serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    console.warn('Invalid HTTP method:', req.method);
    return new Response(
      JSON.stringify({ success: false, error: 'Method not allowed' }),
      {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  return handleChatRequest(req);
});
