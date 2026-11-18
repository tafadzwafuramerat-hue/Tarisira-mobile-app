begin;

create table if not exists public.phone_password_reset_tokens (
  user_id uuid primary key references auth.users(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  requested_at timestamptz not null default now(),
  consumed_at timestamptz
);

alter table public.phone_password_reset_tokens enable row level security;
revoke all on public.phone_password_reset_tokens from public, anon, authenticated;
grant all on public.phone_password_reset_tokens to service_role;

create or replace function public.find_verified_auth_user_id_by_phone(phone_to_find text)
returns uuid
language sql
security definer
set search_path = ''
as $$
  select id
  from auth.users
  where (phone = phone_to_find and phone_confirmed_at is not null)
     or (raw_user_meta_data ->> 'phone' = phone_to_find)
  limit 1
$$;

revoke all on function public.find_verified_auth_user_id_by_phone(text) from public, anon, authenticated;
grant execute on function public.find_verified_auth_user_id_by_phone(text) to service_role;

notify pgrst, 'reload schema';

commit;
