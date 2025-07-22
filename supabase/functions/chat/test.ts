// Test file for the chat function
// Run with: deno run --allow-net --allow-env test.ts

interface ChatRequest {
  query: string;
  topK: number;
}

interface ChatResponse {
  success: boolean;
  answer: string;
  sources: Array<{ id: string; content: string }>;
}

async function testChatFunction() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing environment variables: SUPABASE_URL and SUPABASE_ANON_KEY');
    return;
  }

  const functionUrl = `${supabaseUrl}/functions/v1/chat`;

  const testRequest: ChatRequest = {
    query: 'What are the requirements for filing a patent application?',
    topK: 3,
  };

  try {
    console.log('Testing chat function...');
    console.log('Request:', JSON.stringify(testRequest, null, 2));

    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify(testRequest),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', response.status, errorText);
      return;
    }

    const result: ChatResponse = await response.json();

    console.log('Response:', JSON.stringify(result, null, 2));

    if (result.success) {
      console.log('\n✅ Chat function test successful!');
      console.log(`Answer: ${result.answer}`);
      console.log(`Sources found: ${result.sources.length}`);
    } else {
      console.log('\n❌ Chat function test failed');
    }
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
testChatFunction();
