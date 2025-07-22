import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

async function testAdminInsert() {
  const { data, error } = await supabase
    .from('documents')
    .insert([
      { title: 'TDD Test', content: 'Test content for embedding generation' },
    ])
    .select();
  if (error) throw error;
  console.assert(
    data[0].embedding == null,
    'Embedding should be null on insert'
  );
  console.log('Document inserted:', data[0].id);
  return data[0].id;
}

async function testQueueProcessing() {
  // Trigger the queue processing
  const response = await fetch(
    `${Deno.env.get('SUPABASE_URL')}/functions/v1/process-queue`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Queue processing failed: ${response.statusText}`);
  }

  const result = await response.json();
  console.log('Queue processing result:', result);
}

async function testEmbeddingGenerated(id: string) {
  for (let i = 0; i < 10; i++) {
    const { data } = await supabase
      .from('documents')
      .select('embedding')
      .eq('id', id);
    if (data && data[0].embedding) {
      console.log(
        '✅ Embedding generated:',
        data[0].embedding.slice(0, 5),
        '...'
      );
      return;
    }
    console.log(`Waiting for embedding... (attempt ${i + 1}/10)`);
    await new Promise((r) => setTimeout(r, 2000));
  }
  throw new Error('Embedding not generated in time');
}

(async () => {
  try {
    console.log('🧪 Starting TDD test...');

    const id = await testAdminInsert();
    await testQueueProcessing();
    await testEmbeddingGenerated(id);

    console.log(
      '✅ TDD passed: Admin insert triggers embedding generation via queue'
    );
  } catch (error) {
    console.error('❌ TDD failed:', error);
    process.exit(1);
  }
})();
