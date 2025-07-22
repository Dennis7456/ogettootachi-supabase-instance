import crypto from 'crypto';
import { Client } from 'pg';

// Debug logging function to replace console.log
function debugLog(...args) {
  if (process.env.DEBUG === 'true') {
    const timestamp = new Date().toISOString();
    const logMessage = args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg) : arg
    ).join(' ');
    process.stderr.write(`[DEBUG ${timestamp}] ${logMessage}\n`);
  }
}

async function testInvitation() {
  // PostgreSQL client
  const pgClient = new Client({
    host: '127.0.0.1',
    port: 54322,
    database: 'postgres',
    user: 'postgres',
    password: 'postgres',
  });
  
  try {
    // Connect to PostgreSQL
    await pgClient.connect();
    
    // Find admin users, prioritizing users with a full name
    const { rows: adminUsers } = await pgClient.query(`
      SELECT * 
      FROM public.profiles 
      WHERE role = 'admin' 
      ORDER BY 
        CASE 
          WHEN full_name IS NOT NULL AND full_name != 'Admin User' THEN 0 
          ELSE 1 
        END,
        created_at DESC
      LIMIT 1`);
    
    if (!adminUsers || adminUsers.length === 0) {
      throw new Error('No admin users found');
    }
    
    // Use the first admin user
    const adminUser = adminUsers[0];
    
    // Prepare invitation data
    const invitationData = {
      email: `test-${crypto.randomBytes(4).toString('hex')}@example.com`,
      role: 'staff',
      full_name: 'Test User',
      department: 'Legal',
      custom_message: 'Welcome to the team!',
      invitation_token: crypto.randomUUID(),
      invited_by: adminUser.id,
      expires_at: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
      status: 'sent',
    };
    
    // Insert invitation directly via PostgreSQL
    const { rows: invitation } = await pgClient.query(
      `INSERT INTO public.user_invitations 
       (email, role, full_name, department, custom_message, 
        invitation_token, invited_by, expires_at, status, created_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
       RETURNING *`,
      [
        invitationData.email,
        invitationData.role,
        invitationData.full_name,
        invitationData.department,
        invitationData.custom_message,
        invitationData.invitation_token,
        invitationData.invited_by,
        invitationData.expires_at,
        invitationData.status,
        new Date().toISOString(),
      ]
    );
    
    debugLog('✅ Invitation created successfully');
    
    return {
      id: invitation[0].id,
      email: invitation[0].email,
      token: invitation[0].invitation_token,
      invitedBy: invitation[0].invited_by,
      invitedByName: adminUser.full_name,
    };
  } catch (error) {
    debugLog('❌ Invitation Creation Failed:', error);
    throw error;
  } finally {
    // Always close the PostgreSQL connection
    await pgClient.end();
  }
}

// Run the test if this script is executed directly
if (import.meta.main) {
  testInvitation()
    .then(() => {
      debugLog('✅ Test completed successfully');
      process.exit(0);
    })
    .catch(error => {
      debugLog('❌ Test failed:', error);
      process.exit(1);
    });
}

export { testInvitation };
