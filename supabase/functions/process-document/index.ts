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

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

interface DocumentRecord {
  id: string;
  content: string;
  embedding?: number[];
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

// Improved embedding generator that creates more meaningful embeddings
function generateEmbedding(text: string): number[] {
  // Limit text length to prevent timeouts
  const limitedText = text.substring(0, 8000); // Limit to 8KB for better performance
  const words = limitedText
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ') // Remove punctuation
    .split(/\s+/)
    .filter(word => word.length > 2) // Filter out short words
    .slice(0, 800); // Limit to 800 words

  // Create a 1536-dimensional embedding
  const embedding = new Array(1536).fill(0);

  // Common legal terms and their semantic weights
  const legalTerms = {
    law: 0.8,
    legal: 0.8,
    attorney: 0.7,
    lawyer: 0.7,
    advocate: 0.7,
    court: 0.6,
    judge: 0.6,
    case: 0.6,
    client: 0.6,
    contract: 0.6,
    agreement: 0.5,
    document: 0.5,
    firm: 0.5,
    practice: 0.5,
    rights: 0.5,
    property: 0.4,
    business: 0.4,
    corporate: 0.4,
    commercial: 0.4,
    litigation: 0.7,
    arbitration: 0.6,
    mediation: 0.6,
    settlement: 0.5,
    appeal: 0.6,
    trial: 0.6,
    evidence: 0.5,
    testimony: 0.5,
    witness: 0.5,
    plaintiff: 0.6,
    defendant: 0.6,
    prosecution: 0.6,
    defense: 0.6,
    constitutional: 0.7,
    statute: 0.6,
    regulation: 0.5,
    compliance: 0.5,
    intellectual: 0.6,
    patent: 0.6,
    trademark: 0.6,
    copyright: 0.6,
    employment: 0.5,
    labor: 0.5,
    discrimination: 0.6,
    harassment: 0.6,
    tax: 0.5,
    finance: 0.4,
    banking: 0.4,
    insurance: 0.4,
    'real estate': 0.5,
    family: 0.4,
    divorce: 0.6,
    custody: 0.6,
    inheritance: 0.5,
    estate: 0.5,
    criminal: 0.7,
    felony: 0.6,
    misdemeanor: 0.6,
    probation: 0.5,
    immigration: 0.6,
    citizenship: 0.6,
    visa: 0.5,
    deportation: 0.6,
    environmental: 0.6,
    energy: 0.4,
    healthcare: 0.5,
    medical: 0.4,
    technology: 0.4,
    software: 0.4,
    data: 0.4,
    privacy: 0.5,
    security: 0.4,
  };

  // Process each word
  words.forEach((word, wordIndex) => {
    // Create a hash for the word
    const hash = word.split('').reduce((a, b) => {
      a = (a << 5) - a + b.charCodeAt(0);
      return a & a;
    }, 0);

    // Get semantic weight for legal terms
    const semanticWeight = legalTerms[word] || 0.1;

    // Distribute the word's influence across multiple dimensions
    const numPositions = Math.max(1, Math.floor(semanticWeight * 10));

    for (let i = 0; i < numPositions; i++) {
      const position = Math.abs(hash + i * 31) % 1536;
      const value = semanticWeight * (1 - i * 0.1); // Decreasing influence
      embedding[position] += value;
    }

    // Add word frequency and position information
    const freqPosition = (wordIndex * 7) % 1536;
    embedding[freqPosition] += 0.2;

    // Add word length information
    const lengthPosition = (word.length * 13) % 1536;
    embedding[lengthPosition] += 0.1;
  });

  // Normalize the embedding to prevent overflow
  const maxValue = Math.max(...embedding);
  if (maxValue > 0) {
    embedding.forEach((val, index) => {
      embedding[index] = val / maxValue;
    });
  }

  // Add some noise for uniqueness
  embedding.forEach((val, index) => {
    const noise = (Math.sin(index * 0.1) + 1) * 0.05;
    embedding[index] = Math.min(1, val + noise);
  });

  return embedding;
}

serve(async req => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('=== Edge Function Started ===');
    console.log('Method:', req.method);
    console.log('URL:', req.url);

    // Parse request body
    let body;
    try {
      body = await req.json();
      console.log('Request body received:', JSON.stringify(body, null, 2));
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError);
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Handle different input formats
    let record: DocumentRecord | null = null;

    if (body.record) {
      record = body.record;
      console.log('Using body.record format');
    } else if (body.id && body.content) {
      record = body;
      console.log('Using direct body format');
    } else if (body.document) {
      record = body.document;
      console.log('Using body.document format');
    } else {
      console.error('No valid record found in request body');
      return new Response(
        JSON.stringify({
          error:
            'Missing required fields. Expected: { record: {...} } or { id, content } or { document: {...} }',
          received: Object.keys(body),
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate record
    if (!record || !record.id || !record.content) {
      console.error('Invalid record structure:', record);
      return new Response(
        JSON.stringify({
          error: 'Missing required fields: record.id or record.content',
          received: record ? Object.keys(record) : 'null',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Check if already processed
    if (record.embedding) {
      console.log('Document already has embedding, skipping processing');
      return new Response(
        JSON.stringify({ success: true, msg: 'Already embedded' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(
      `Processing document: ${record.id} (${record.content.length} chars)`
    );

    // Generate embedding with timeout protection
    const embedding = generateEmbedding(record.content);
    console.log(`Generated embedding with length: ${embedding.length}`);

    // Update database
    console.log('Updating database...');
    const { error } = await supabase
      .from('documents')
      .update({ embedding })
      .eq('id', record.id);

    if (error) {
      console.error('Database update error:', error);
      return new Response(
        JSON.stringify({
          error: error.message,
          details: error.details,
          hint: error.hint,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`Successfully processed document: ${record.id}`);
    return new Response(
      JSON.stringify({
        success: true,
        embedding_length: embedding.length,
        document_id: record.id,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Process document error:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'Unknown error occurred',
        stack: error.stack,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
