const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkDatabaseStructure() {
  try {
    console.log('Checking database structure...');
    
    // List all tables
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_schema, table_name')
      .eq('table_schema', 'public');

    if (tablesError) {
      console.error('Error listing tables:', tablesError);
      return;
    }

    console.log('Tables in public schema:');
    tables.forEach(table => {
      console.log(`- ${table.table_schema}.${table.table_name}`);
    });

    // Check if profiles table exists
    const profilesTable = tables.find(t => t.table_name === 'profiles');
    if (profilesTable) {
      console.log('\n✅ profiles table found');
      
      // Get columns of profiles table
      const { data: columns, error: columnsError } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable')
        .eq('table_schema', 'public')
        .eq('table_name', 'profiles');

      if (columnsError) {
        console.error('Error getting columns:', columnsError);
        return;
      }

      console.log('\nColumns in profiles table:');
      columns.forEach(col => {
        console.log(`- ${col.column_name} (${col.data_type}, nullable: ${col.is_nullable})`);
      });

      // Check if professional_image column exists
      const professionalImageCol = columns.find(c => c.column_name === 'professional_image');
      if (professionalImageCol) {
        console.log('\n✅ professional_image column already exists');
      } else {
        console.log('\n❌ professional_image column does not exist');
        console.log('You need to add it manually in the Supabase dashboard');
      }
    } else {
      console.log('\n❌ profiles table not found');
      console.log('Available tables:', tables.map(t => t.table_name));
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

checkDatabaseStructure(); 