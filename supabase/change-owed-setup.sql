begin;

create table if not exists public.change_owed (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  customer_name text not null check (length(trim(customer_name)) > 0),
  phone text,
  amount numeric(12,2) not null default 0 check (amount >= 0),
  settled boolean not null default false,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists change_owed_business_idx
  on public.change_owed(business_id, settled);

alter table public.change_owed enable row level security;
drop policy if exists change_owed_select_member on public.change_owed;
drop policy if exists change_owed_insert_member on public.change_owed;
drop policy if exists change_owed_update_member on public.change_owed;
drop policy if exists change_owed_delete_admin on public.change_owed;
create policy change_owed_select_member on public.change_owed for select to authenticated
  using (public.is_business_member(business_id));
create policy change_owed_insert_member on public.change_owed for insert to authenticated
  with check (public.is_business_member(business_id));
create policy change_owed_update_member on public.change_owed for update to authenticated
  using (public.is_business_member(business_id)) with check (public.is_business_member(business_id));
create policy change_owed_delete_admin on public.change_owed for delete to authenticated
  using (public.has_business_role(business_id, array['owner','admin']));

revoke all on public.change_owed from anon, authenticated;
grant select, insert, update, delete on public.change_owed to authenticated;

create or replace function public.add_change_owed(
  target_business_id uuid,
  customer_name text,
  phone text default null,
  amount numeric default 0,
  note text default null
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  new_id uuid;
begin
  if auth.uid() is null or not public.is_business_member(target_business_id) then
    raise exception 'You do not have access to this business';
  end if;
  if amount <= 0 then raise exception 'Amount must be greater than zero'; end if;

  insert into public.change_owed (business_id, customer_name, phone, amount, note)
  values (target_business_id, customer_name, phone, amount, note)
  returning id into new_id;
  return new_id;
end;
$$;

create or replace function public.settle_change_owed(
  target_business_id uuid,
  target_change_id uuid
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if auth.uid() is null or not public.is_business_member(target_business_id) then
    raise exception 'You do not have access to this business';
  end if;
  update public.change_owed set settled = true, updated_at = now()
  where id = target_change_id and business_id = target_business_id;
  if not found then raise exception 'Change record not found'; end if;
end;
$$;

revoke all on function public.add_change_owed(uuid, text, text, numeric, text) from public, anon;
revoke all on function public.settle_change_owed(uuid, uuid) from public, anon;
grant execute on function public.add_change_owed(uuid, text, text, numeric, text) to authenticated;
grant execute on function public.settle_change_owed(uuid, uuid) to authenticated;

notify pgrst, 'reload schema';

commit;
