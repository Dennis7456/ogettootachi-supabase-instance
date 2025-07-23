import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://127.0.0.1:54321';
const anonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
const serviceKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const pub = createClient(supabaseUrl, anonKey);
const srv = createClient(supabaseUrl, serviceKey);

const rand = Math.random().toString(36).substring(2, 10);
const post = {
  title: `Post ${rand}`,
  content: '<p>body</p>',
  author: 'Test',
  status: 'published',
};
let id: string;

describe('blog_posts RLS', () => {
  beforeAll(async () => {
    const { data } = await srv.from('blog_posts').insert(post).select('id').single();
    id = data.id;
  });
  afterAll(async () => { if (id) await srv.from('blog_posts').delete().eq('id', id); });

  it('anon can select published', async () => {
    const { data } = await pub.from('blog_posts').select('*').eq('id', id).single();
    expect(data.id).toBe(id);
  });
  it('anon cannot insert', async () => {
    const { error } = await pub.from('blog_posts').insert({ title: 'x', content: 'y', author: 'z' });
    expect(error).not.toBeNull();
  });
});
