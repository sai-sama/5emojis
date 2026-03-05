-- ─── Allow users to delete their own profile ────────────────────────
drop policy if exists "Users can delete their own profile" on public.profiles;
create policy "Users can delete their own profile"
  on public.profiles for delete
  to authenticated
  using (id = auth.uid());

-- ─── RPC to fully delete account (profile + auth user) ─────────────
-- Uses security definer to access auth.users which clients can't touch
create or replace function public.delete_own_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Delete profile first (cascades to all related tables)
  delete from public.profiles where id = auth.uid();
  -- Delete the auth user entry so they can't sign back in
  delete from auth.users where id = auth.uid();
end;
$$;

-- Only authenticated users can call this
revoke all on function public.delete_own_account() from anon;
grant execute on function public.delete_own_account() to authenticated;
