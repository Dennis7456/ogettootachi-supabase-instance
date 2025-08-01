const { createClient } = require('@supabase/supabase-js');

// Remote Supabase configuration
const supabaseUrl = 'https://szbjuskqrfthmjehknly.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6Ymp1c2txcmZ0aG1qZWhrbmx5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzQzNTg5OSwiZXhwIjoyMDY5MDExODk5fQ.cMrSpRsKWhU0OM9wpRtrhOFj-6HHzS-lVOJ91YCnepU';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkRLSStatus() {
  try {
    console.log('🔍 Checking RLS status and policies...');
    
    // Try to query the storage.objects table directly
    const { data, error } = await supabase
      .from('storage.objects')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('❌ Cannot query storage.objects directly:', error.message);
      console.log('This suggests RLS is enabled and blocking access');
    } else {
      console.log('✅ Can query storage.objects directly');
      console.log('This suggests RLS might be disabled or policies are permissive');
    }
    
    // Try to get policy information
    console.log('\n📋 Checking for policy information...');
    
    // Try different approaches to get policy info
    try {
      const { data: policies, error: policyError } = await supabase
        .from('information_schema.policies')
        .select('*')
        .eq('table_schema', 'storage')
        .eq('table_name', 'objects');
      
      if (policyError) {
        console.log('Cannot query policies directly:', policyError.message);
      } else {
        console.log('Found policies:', policies);
      }
    } catch (e) {
      console.log('Cannot access policy information:', e.message);
    }
    
    console.log('\n📝 MANUAL CHECK REQUIRED:');
    console.log('1. Go to your Supabase Dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Run this query to check RLS status:');
    console.log(`
      SELECT 
        schemaname,
        tablename,
        rowsecurity
      FROM pg_tables 
      WHERE tablename = 'objects' AND schemaname = 'storage';
    `);
    
    console.log('\n4. Run this query to see current policies:');
    console.log(`
      SELECT 
        policyname,
        permissive,
        roles,
        cmd,
        qual,
        with_check
      FROM pg_policies 
      WHERE tablename = 'objects' AND schemaname = 'storage';
    `);
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

checkRLSStatus(); 