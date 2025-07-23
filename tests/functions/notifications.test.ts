import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
const supabaseServiceKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, supabaseAnonKey);
const supabaseService = createClient(supabaseUrl, supabaseServiceKey);

const rand = Math.random().toString(36).substring(2, 10);
const userA = { email: `notify-userA-${rand}@test.com`, password: 'TestPassword123!' };
const userB = { email: `notify-userB-${rand}@test.com`, password: 'TestPassword123!' };

let userAId: string; let userBId: string; let notificationId: string;

async function cleanUpUser(id?: string) {
  if (!id) return;
  await supabaseService.from('profiles').delete().eq('id', id);
  try { await supabaseService.auth.admin.deleteUser(id); } catch (_) {/* ignore */}
}

describe('Notifications RLS', () => {
  beforeAll(async () => {
    await new Promise(r => setTimeout(r, 1500));
    const { data: { user: ua } } = await supabase.auth.signUp(userA); userAId = ua!.id;
    const { data: { user: ub } } = await supabase.auth.signUp(userB); userBId = ub!.id;
    const { data, error } = await supabaseService.rpc('create_notification', {
      target_user_id: userAId,
      notification_type: 'info',
      notification_title: 'Automated',
      notification_message: 'Hello',
      notification_data: {}
    });
    if (error) throw error; notificationId = data as string;
  });

  afterAll(async () => {
    if (notificationId) await supabaseService.from('notifications').delete().eq('id', notificationId);
    await cleanUpUser(userAId); await cleanUpUser(userBId);
  });

  it('User A sees their notification', async () => {
    await supabase.auth.signInWithPassword(userA);
    const { data, error } = await supabase.from('notifications').select('*');
    expect(error).toBeNull(); expect(data.length).toBe(1);
  });

  it('User B cannot see it', async () => {
    await supabase.auth.signInWithPassword(userB);
    const { data } = await supabase.from('notifications').select('*');
    expect(data.length).toBe(0);
  });

  it('Mark as read RPC works', async () => {
    await supabase.auth.signInWithPassword(userA);
    const { data, error } = await supabase.rpc('mark_notifications_as_read', {
      user_uuid: userAId,
      notification_ids: [notificationId]
    });
    expect(error).toBeNull(); expect(data).toBe(1);
    const { data: after } = await supabase.from('notifications').select('read').eq('id', notificationId).single();
    expect(after.read).toBe(true);
  });
});
