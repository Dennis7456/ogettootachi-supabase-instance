/* eslint-disable no-console, no-undef */
import { createClient } from '@supabase/supabase-js';

const config = {
  SUPABASE_URL: 'http://127.0.0.1:54321',
  SUPABASE_SERVICE_ROLE_KEY:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU',
};

async function checkUserStatus() {
  const email = process.argv[2] || 'webmastaz2019@gmail.com';
  const _supabase = createClient(
    config.SUPABASE_URL,
    config.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    // Check auth users
    const { data: users } = await _supabase.auth.admin.listUsers();
    const authUser = users.users.find(u => u.email === email);

    if (authUser) {
      console.log('User found in authentication system');
    }

    // Check invitations
    const { data: invitations } = await _supabase
      .from('user_invitations')
      .select('*')
      .eq('email', email)
      .order('created_at', { ascending: false });

    if (invitations && invitations.length > 0) {
      console.log(`Found ${invitations.length} invitation(s)`);
    }

    // Check Mailpit emails
    const mailpitResponse = await fetch(
      'http://127.0.0.1:54324/api/v1/messages'
    );
    const mailpitData = await mailpitResponse.json();

    if (mailpitData.messages) {
      console.log(`Found ${mailpitData.messages.length} email message(s)`);
    }
  } catch (_error) {
    console.error('Error checking user status:', _error);
  }
}

checkUserStatus().catch(console.error);
