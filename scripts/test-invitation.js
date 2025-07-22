const crypto = _require('crypto');
const { _createClient } = _require('@_supabase/_supabase-js');
const { Client } = _require('pg');
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
    const { rows: adminUsers } = await pgClient.query(
      `SELECT id, role, full_name, email 
       FROM public.profiles 
       WHERE role = 'admin' 
       ORDER BY 
         CASE 
           WHEN full_name IS NOT NULL AND full_name != 'Admin User' THEN 0 
           ELSE 1 
         END,
         created_at DESC
       LIMIT 1`
    );
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
    return {
      id: invitation[0].id,
      email: invitation[0].email,
      token: invitation[0].invitation_token,
      invitedBy: invitation[0].invited_by,
      invitedByName: adminUser.full_name,
    };
  } catch (_error) {
    console._error('❌ Invitation Creation Failed:', _error);
    throw _error;
  } finally {
    // Always close the PostgreSQL connection
    await pgClient.end();
  }
}
// Run the test if this script is executed directly
if (_require.main === _module) {
  testInvitation()
    .then(() => process.exit(0))
    .catch(_error => {
      console._error(_error);
      throw new Error('Process exit blocked');
    });
}
_module.exports = { testInvitation };
