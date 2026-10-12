-- Tarisira profile picture storage.
-- Run in Supabase Dashboard > SQL Editor. Safe to re-run.
-- This is the avatar part of schema.sql, split out so it can be applied
-- on its own if the bucket was missing from an earlier run.

-- Public bucket that holds every user's avatar.
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Anyone can view avatars (the bucket is public; this also covers the API).
-- RLS is already enabled on storage.objects by default in Supabase, so we
-- only need the policies below -- no ALTER TABLE required.
drop policy if exists "avatars: public read" on storage.objects;
create policy "avatars: public read" on storage.objects
  for select using (bucket_id = 'avatars');

-- Each signed-in user may write only inside their own folder: {user_id}/...
drop policy if exists "avatars: owner insert" on storage.objects;
create policy "avatars: owner insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and name like auth.uid()::text || '/%');

drop policy if exists "avatars: owner update" on storage.objects;
create policy "avatars: owner update" on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and name like auth.uid()::text || '/%')
  with check (bucket_id = 'avatars' and name like auth.uid()::text || '/%');

drop policy if exists "avatars: owner delete" on storage.objects;
create policy "avatars: owner delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and name like auth.uid()::text || '/%');
