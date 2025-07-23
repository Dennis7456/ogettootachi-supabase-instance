import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'http://127.0.0.1:54321';
// Local dev keys taken from docker-compose env; override via env vars if necessary
const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
export const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Utility to pause between auth calls (helps local dev containers finish setup)
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function createTestUser({ role = 'staff' } = {}) {
  const rand = Math.random().toString(36).substring(2, 10);
  const email = `test_${rand}@example.com`;
  const password = 'TestPassword123!';

  const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
    email,
    password,
  });
  if (signUpErr) throw signUpErr;

  const userId = signUpData.user.id;

  // Set profile role (requires service role)
  await supabaseAdmin.from('profiles').update({ role }).eq('id', userId);

  // Sign in to obtain a JWT
  // Wait briefly for auth row and profile trigger completion
  await sleep(500);
  const { data: sessionData, error: signInErr } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (signInErr) throw signInErr;

  return {
    id: userId,
    email,
    password,
    token: sessionData.session.access_token,
  };
}

export async function cleanupTestUsers(users = []) {
  for (const u of users) {
    try {
      await supabaseAdmin.from('profiles').delete().eq('id', u.id);
      await supabaseAdmin.auth.admin.deleteUser(u.id, true);
    } catch (_) {
      // ignore
    }
  }
}

export default {
  supabase,
  supabaseAdmin,
  createTestUser,
  cleanupTestUsers,
};
