import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testStorageAuth() {
  try {
    console.log('Testing storage authentication...');
    
    // Check current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log('Current user:', user ? user.id : 'No user');
    console.log('Auth error:', authError);
    
    if (!user) {
      console.log('No authenticated user found. Please log in first.');
      return;
    }
    
    // Test storage upload
    const testBlob = new Blob(['test content'], { type: 'text/plain' });
    const testFileName = `test-${Date.now()}.txt`;
    
    console.log('Attempting to upload test file:', testFileName);
    
    const { data, error } = await supabase.storage
      .from('blog-images')
      .upload(testFileName, testBlob, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (error) {
      console.error('Upload error:', error);
    } else {
      console.log('Upload successful:', data);
      
      // Test getting public URL
      const { data: { publicUrl } } = supabase.storage
        .from('blog-images')
        .getPublicUrl(testFileName);
      
      console.log('Public URL:', publicUrl);
      
      // Clean up - delete the test file
      const { error: deleteError } = await supabase.storage
        .from('blog-images')
        .remove([testFileName]);
      
      if (deleteError) {
        console.error('Delete error:', deleteError);
      } else {
        console.log('Test file deleted successfully');
      }
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testStorageAuth(); 