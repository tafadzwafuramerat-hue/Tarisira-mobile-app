-- Tarisira initial backend schema: one private business-state document per user.
-- Run this in Supabase Dashboard > SQL Editor.
create table if not exists public.app_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.app_state enable row level security;

create policy "Users can read their own app state"
  on public.app_state for select
  using (auth.uid() = user_id);

create policy "Users can create their own app state"
  on public.app_state for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own app state"
  on public.app_state for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own app state"
  on public.app_state for delete
  using (auth.uid() = user_id);
