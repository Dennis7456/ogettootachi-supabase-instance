import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { message, session_id } = await req.json();

    if (!message) {
      throw new Error('Message is required');
    }

    // Get user from JWT token
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('Authorization header required');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Verify JWT and get user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (authError || !user) {
      throw new Error('Invalid token');
    }

    // Generate embedding for user message
    const messageEmbedding = await generateEmbedding(message);

    // Search for relevant documents
    const { data: documents, error: searchError } = await supabase.rpc('match_documents', {
      query_embedding: messageEmbedding,
      match_threshold: 0.7,
      match_count: 5,
    });

    if (searchError) {
      console.error('Search error:', searchError);
      // Continue without documents if search fails
    }

    // Generate response using OpenAI
    const response = await generateResponse(message, documents || []);

    // Store conversation
    const { error: insertError } = await supabase.from('chatbot_conversations').insert({
      user_id: user.id,
      session_id,
      message,
      response: response.choices[0].message.content,
      documents_used: documents?.map((d) => ({ id: d.id, title: d.title })) || [],
      tokens_used: response.usage?.total_tokens || 0,
    });

    if (insertError) {
      console.error('Insert error:', insertError);
      // Don't fail the request if conversation storage fails
    }

    return new Response(
      JSON.stringify({
        response: response.choices[0].message.content,
        documents: documents || [],
        tokens_used: response.usage?.total_tokens || 0,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Chatbot error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function generateEmbedding(text: string): Promise<number[]> {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      input: text,
      model: 'text-embedding-ada-002',
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.statusText}`);
  }

  const result = await response.json();
  return result.data[0].embedding;
}

async function generateResponse(message: string, documents: any[]) {
  const context =
    documents.length > 0
      ? documents.map((d) => d.content).join('\n\n')
      : 'No specific legal documents found for this query.';

  const systemPrompt = `You are a legal assistant for Ogetto, Otachi & Company Advocates, a prestigious law firm in Kenya. 

Your role is to:
1. Provide accurate legal information based on the context provided
2. Be professional, helpful, and clear in your responses
3. If you don't have enough information in the context, acknowledge this and suggest contacting the firm directly
4. Always maintain confidentiality and professional standards
5. Provide general legal guidance but avoid giving specific legal advice that could constitute attorney-client relationship

Context from legal documents:
${context}

Remember: This is for informational purposes only and does not constitute legal advice. For specific legal matters, clients should consult with qualified attorneys.`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: message,
        },
      ],
      max_tokens: 500,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.statusText}`);
  }

  return await response.json();
}
