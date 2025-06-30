import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

console.log('=== Database Connection Check ===\n');

console.log('🔗 Connection Details:');
console.log('   Supabase URL:', supabaseUrl);
console.log('   Studio URL:', supabaseUrl.replace('54321', '54323'));
console.log('   Service Role Key:', supabaseServiceKey.substring(0, 50) + '...');

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkConnection() {
  try {
    console.log('\n📊 Testing connection...');
    
    // Test basic connection
    const { data, error } = await supabase
      .from('documents')
      .select('count(*)', { count: 'exact', head: true });

    if (error) {
      console.error('❌ Connection failed:', error.message);
      return;
    }

    console.log('✅ Connection successful!');
    
    // Get document count
    const { count, error: countError } = await supabase
      .from('documents')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('❌ Count failed:', countError.message);
    } else {
      console.log(`📄 Documents in database: ${count}`);
    }

    // List recent documents
    const { data: docs, error: listError } = await supabase
      .from('documents')
      .select('id, title, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    if (listError) {
      console.error('❌ List failed:', listError.message);
    } else {
      console.log('\n📋 Recent documents:');
      docs.forEach((doc, index) => {
        console.log(`   ${index + 1}. ${doc.title} (${doc.id}) - ${doc.created_at}`);
      });
    }

    console.log('\n🎯 Next Steps:');
    console.log('   1. Open your browser and go to: http://127.0.0.1:54323');
    console.log('   2. This is your LOCAL Supabase Studio');
    console.log('   3. Navigate to Table Editor → documents');
    console.log('   4. You should see the documents listed above');
    console.log('\n⚠️  If you\'re looking at a remote dashboard (https://supabase.com/...),');
    console.log('   that\'s a different database than your local one!');

  } catch (error) {
    console.error('❌ Check failed:', error.message);
  }
}

checkConnection(); 