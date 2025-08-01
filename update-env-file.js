const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');

// New environment variables
const newEnvContent = `# Supabase Configuration
SUPABASE_URL=https://szbjuskqrfthmjehknly.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6Ymp1c2txcmZ0aG1qZWhrbmx5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0MzU4OTksImV4cCI6MjA2OTAxMTg5OX0.hWqB5s3SO9e38DYIP3Qk_j5iRw8ZbCfR4-SV3kH6JHI
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6Ymp1c2txcmZ0aG1qZWhrbmx5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzQzNTg5OSwiZXhwIjoyMDY5MDExODk5fQ.cMrSpRsKWhU0OM9wpRtrhOFj-6HHzS-lVOJ91YCnepU

# Server Configuration
NODE_ENV=development
PORT=3001
API_PREFIX=/api/v1

# CORS Configuration
CORS_ORIGIN=http://localhost:5173

# Logging
LOG_LEVEL=debug

# Email config
MAILJET_API_KEY=c5ccdf24c9e75eba8ff13b7dd18c90a8
MAILJET_API_SECRET=0afc22f5dcc21d4c473baea278f0e51a%
`;

try {
  // Write the new .env content
  fs.writeFileSync(envPath, newEnvContent);
  console.log('✅ Successfully updated .env file with remote Supabase configuration');
  console.log('📋 Next steps:');
  console.log('1. Add the professional_image column to the profiles table');
  console.log('2. Create the professional-images bucket');
  console.log('3. Set up the RLS policies');
  console.log('\nRun the setup scripts again after completing the manual steps.');
} catch (error) {
  console.error('Error updating .env file:', error);
} 