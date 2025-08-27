-- Create RPC: get_user_messages
-- Returns recent contact messages for staff/admin users
-- Adjust as needed to match your RLS model

create or replace function public.get_user_messages(
  p_limit integer default 50,
  p_offset integer default 0
)
returns setof public.contact_messages
language sql
security definer
set search_path = public
as $$
  with caller as (
    select role from public.profiles where id = auth.uid()
  )
  select m.*
  from public.contact_messages m
  where exists (
    select 1 from caller c where c.role in ('staff','admin')
  )
  order by m.created_at desc
  limit p_limit offset p_offset;
$$;

-- Ensure only authenticated users can execute (not anon)
revoke all on function public.get_user_messages(integer, integer) from public;
grant execute on function public.get_user_messages(integer, integer) to authenticated;


