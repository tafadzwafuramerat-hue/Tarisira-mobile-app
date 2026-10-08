-- Tarisira normalized multi-business schema.
-- Run in Supabase Dashboard > SQL Editor. Safe to re-run.
-- RLS is the tenant boundary: a user can only access businesses they belong to.

begin;

create extension if not exists pgcrypto;

-- Businesses are isolated tenants. The creator becomes owner through membership.
create table if not exists public.businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) > 0),
  business_type text,
  location text,
  phone text,
  currency_codes text[] not null default array['USD']::text[],
  created_by uuid not null default auth.uid() references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.business_members (
  business_id uuid not null references public.businesses(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'owner' check (role in ('owner', 'admin', 'member')),
  created_at timestamptz not null default now(),
  primary key (business_id, user_id)
);

-- Security-definer helpers avoid recursive RLS lookups on business_members.
create or replace function public.is_business_member(target_business_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.business_members bm
    where bm.business_id = target_business_id
      and bm.user_id = (select auth.uid())
  );
$$;

create or replace function public.has_business_role(target_business_id uuid, allowed_roles text[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.business_members bm
    where bm.business_id = target_business_id
      and bm.user_id = (select auth.uid())
      and bm.role = any(allowed_roles)
  );
$$;

revoke all on function public.is_business_member(uuid) from public;
revoke all on function public.has_business_role(uuid, text[]) from public;
grant execute on function public.is_business_member(uuid) to authenticated;
grant execute on function public.has_business_role(uuid, text[]) to authenticated;

-- Create a business and its owner membership atomically from an authenticated client.
create or replace function public.create_business(
  business_name text,
  business_type text default null,
  business_location text default null,
  business_phone text default null,
  currencies text[] default array['USD']::text[]
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_business_id uuid;
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'Sign-in is required to create a business';
  end if;
  if business_name is null or length(trim(business_name)) = 0 then
    raise exception 'Business name is required';
  end if;

  insert into public.businesses (name, business_type, location, phone, currency_codes, created_by)
  values (trim(business_name), business_type, business_location, business_phone, coalesce(currencies, array['USD']::text[]), current_user_id)
  returning id into new_business_id;

  insert into public.business_members (business_id, user_id, role)
  values (new_business_id, current_user_id, 'owner');

  return new_business_id;
end;
$$;

grant execute on function public.create_business(text, text, text, text, text[]) to authenticated;
revoke all on function public.create_business(text, text, text, text, text[]) from public, anon;

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  category text not null default 'Other',
  price numeric(12,2) not null check (price >= 0),
  cost numeric(12,2) not null default 0 check (cost >= 0),
  quantity integer not null default 0 check (quantity >= 0),
  reorder_at integer not null default 10 check (reorder_at >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, id)
);

create table if not exists public.sales (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  customer_name text,
  payment_method text not null default 'Cash',
  total numeric(12,2) not null default 0 check (total >= 0),
  sold_at timestamptz not null default now(),
  created_by uuid not null default auth.uid() references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (business_id, id)
);

create table if not exists public.sale_items (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null,
  sale_id uuid not null,
  product_id uuid not null,
  product_name text not null,
  category text not null default 'Other',
  quantity integer not null check (quantity > 0),
  unit_price numeric(12,2) not null check (unit_price >= 0),
  line_total numeric(12,2) generated always as (quantity * unit_price) stored,
  created_at timestamptz not null default now(),
  foreign key (business_id, sale_id) references public.sales(business_id, id) on delete cascade,
  foreign key (business_id, product_id) references public.products(business_id, id) on delete restrict
);
alter table public.sale_items add column if not exists category text not null default 'Other';

create table if not exists public.debtors (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  phone text,
  opening_balance numeric(12,2) not null default 0 check (opening_balance >= 0),
  current_balance numeric(12,2) not null default 0 check (current_balance >= 0),
  due_in_days integer not null default 7 check (due_in_days >= 0),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, id)
);
alter table public.debtors add column if not exists current_balance numeric(12,2) not null default 0 check (current_balance >= 0);
alter table public.debtors add column if not exists due_in_days integer not null default 7 check (due_in_days >= 0);
alter table public.debtors add column if not exists item_owed text;

create table if not exists public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null,
  product_id uuid not null,
  label text not null,
  delta integer not null,
  occurred_at text not null default to_char(now(), 'DD Mon'),
  created_at timestamptz not null default now(),
  foreign key (business_id, product_id) references public.products(business_id, id) on delete cascade
);

create table if not exists public.debtor_payments (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null,
  debtor_id uuid not null,
  amount numeric(12,2) not null check (amount > 0),
  payment_method text not null default 'Cash',
  note text,
  paid_at timestamptz not null default now(),
  recorded_by uuid not null default auth.uid() references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  foreign key (business_id, debtor_id) references public.debtors(business_id, id) on delete cascade
);

create table if not exists public.reminders (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null,
  debtor_id uuid not null,
  message text,
  scheduled_for timestamptz not null,
  status text not null default 'scheduled' check (status in ('scheduled', 'sent', 'cancelled', 'failed')),
  sent_at timestamptz,
  created_by uuid not null default auth.uid() references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  foreign key (business_id, debtor_id) references public.debtors(business_id, id) on delete cascade
);

-- Atomically record one sale line and decrement its product stock.
create or replace function public.record_business_sale(
  target_business_id uuid,
  target_product_id uuid,
  sold_quantity integer,
  customer text default null,
  method text default 'Cash'
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  selected_product public.products%rowtype;
  new_sale_id uuid;
  sale_total numeric(12,2);
begin
  if current_user_id is null or not public.is_business_member(target_business_id) then
    raise exception 'You do not have access to this business';
  end if;
  if sold_quantity <= 0 then raise exception 'Quantity must be greater than zero'; end if;

  select * into selected_product
  from public.products
  where id = target_product_id and business_id = target_business_id
  for update;
  if not found then raise exception 'Product not found'; end if;
  if selected_product.quantity < sold_quantity then raise exception 'Not enough stock'; end if;

  sale_total := round(selected_product.price * sold_quantity, 2);
  insert into public.sales (business_id, customer_name, payment_method, total, created_by)
  values (target_business_id, nullif(trim(customer), ''), coalesce(nullif(trim(method), ''), 'Cash'), sale_total, current_user_id)
  returning id into new_sale_id;

  insert into public.sale_items (business_id, sale_id, product_id, product_name, category, quantity, unit_price)
  values (target_business_id, new_sale_id, selected_product.id, selected_product.name, selected_product.category, sold_quantity, selected_product.price);

  update public.products set quantity = quantity - sold_quantity, updated_at = now()
  where id = selected_product.id and business_id = target_business_id;

  insert into public.stock_movements (business_id, product_id, label, delta)
  values (target_business_id, selected_product.id, 'Sale', -sold_quantity);

  return new_sale_id;
end;
$$;

create or replace function public.record_debtor_payment(
  target_business_id uuid,
  target_debtor_id uuid,
  payment_amount numeric,
  payment_note text default null,
  method text default 'Cash'
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  new_payment_id uuid;
begin
  if current_user_id is null or not public.is_business_member(target_business_id) then
    raise exception 'You do not have access to this business';
  end if;
  if payment_amount <= 0 then raise exception 'Payment must be greater than zero'; end if;

  update public.debtors
  set current_balance = greatest(0, current_balance - payment_amount), updated_at = now()
  where id = target_debtor_id and business_id = target_business_id;
  if not found then raise exception 'Debtor not found'; end if;

  insert into public.debtor_payments (business_id, debtor_id, amount, payment_method, note, recorded_by)
  values (target_business_id, target_debtor_id, payment_amount, coalesce(nullif(trim(method), ''), 'Cash'), payment_note, current_user_id)
  returning id into new_payment_id;

  return new_payment_id;
end;
$$;

create or replace function public.adjust_business_stock(
  target_business_id uuid,
  target_product_id uuid,
  stock_delta integer,
  movement_label text
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  updated_product public.products%rowtype;
  movement_id uuid;
begin
  if current_user_id is null or not public.is_business_member(target_business_id) then
    raise exception 'You do not have access to this business';
  end if;

  update public.products
  set quantity = quantity + stock_delta, updated_at = now()
  where id = target_product_id and business_id = target_business_id
    and quantity + stock_delta >= 0
  returning * into updated_product;
  if not found then raise exception 'Product not found or stock cannot be negative'; end if;

  insert into public.stock_movements (business_id, product_id, label, delta)
  values (target_business_id, target_product_id, movement_label, stock_delta)
  returning id into movement_id;

  return movement_id;
end;
$$;

revoke all on function public.record_business_sale(uuid, uuid, integer, text, text) from public, anon;
revoke all on function public.record_debtor_payment(uuid, uuid, numeric, text, text) from public, anon;
revoke all on function public.adjust_business_stock(uuid, uuid, integer, text) from public, anon;
grant execute on function public.record_business_sale(uuid, uuid, integer, text, text) to authenticated;
grant execute on function public.record_debtor_payment(uuid, uuid, numeric, text, text) to authenticated;
grant execute on function public.adjust_business_stock(uuid, uuid, integer, text) to authenticated;

-- Indexes support tenant-filtered reads and reporting queries.
create index if not exists business_members_user_idx on public.business_members(user_id, business_id);
create index if not exists products_business_name_idx on public.products(business_id, name);
create index if not exists stock_movements_product_idx on public.stock_movements(business_id, product_id, created_at desc);
create index if not exists sales_business_date_idx on public.sales(business_id, sold_at desc);
create index if not exists sale_items_business_sale_idx on public.sale_items(business_id, sale_id);
create index if not exists debtors_business_name_idx on public.debtors(business_id, name);
create index if not exists debtor_payments_business_debtor_idx on public.debtor_payments(business_id, debtor_id, paid_at desc);
create index if not exists reminders_business_due_idx on public.reminders(business_id, scheduled_for) where status = 'scheduled';

-- Enable RLS on every tenant table.
alter table public.businesses enable row level security;
alter table public.business_members enable row level security;
alter table public.products enable row level security;
alter table public.stock_movements enable row level security;
alter table public.sales enable row level security;
alter table public.sale_items enable row level security;
alter table public.debtors enable row level security;
alter table public.debtor_payments enable row level security;
alter table public.reminders enable row level security;

-- Policies are dropped first so this script can be run more than once.
drop policy if exists businesses_select_member on public.businesses;
drop policy if exists businesses_update_admin on public.businesses;
drop policy if exists businesses_delete_owner on public.businesses;
drop policy if exists members_select_same_business on public.business_members;
drop policy if exists members_insert_owner on public.business_members;
drop policy if exists members_update_owner on public.business_members;
drop policy if exists members_delete_owner on public.business_members;
drop policy if exists products_select_member on public.products;
drop policy if exists products_insert_member on public.products;
drop policy if exists products_update_member on public.products;
drop policy if exists products_delete_admin on public.products;
drop policy if exists stock_movements_select_member on public.stock_movements;
drop policy if exists stock_movements_insert_member on public.stock_movements;
drop policy if exists stock_movements_update_admin on public.stock_movements;
drop policy if exists stock_movements_delete_admin on public.stock_movements;
drop policy if exists sales_select_member on public.sales;
drop policy if exists sales_insert_member on public.sales;
drop policy if exists sales_update_admin on public.sales;
drop policy if exists sales_delete_admin on public.sales;
drop policy if exists sale_items_select_member on public.sale_items;
drop policy if exists sale_items_insert_member on public.sale_items;
drop policy if exists sale_items_update_admin on public.sale_items;
drop policy if exists sale_items_delete_admin on public.sale_items;
drop policy if exists debtors_select_member on public.debtors;
drop policy if exists debtors_insert_member on public.debtors;
drop policy if exists debtors_update_member on public.debtors;
drop policy if exists debtors_delete_admin on public.debtors;
drop policy if exists debtor_payments_select_member on public.debtor_payments;
drop policy if exists debtor_payments_insert_member on public.debtor_payments;
drop policy if exists debtor_payments_update_admin on public.debtor_payments;
drop policy if exists debtor_payments_delete_admin on public.debtor_payments;
drop policy if exists reminders_select_member on public.reminders;
drop policy if exists reminders_insert_member on public.reminders;
drop policy if exists reminders_update_member on public.reminders;
drop policy if exists reminders_delete_admin on public.reminders;

-- Businesses and membership: the create_business RPC creates initial owner membership.
create policy businesses_select_member on public.businesses
  for select to authenticated using (public.is_business_member(id));
create policy businesses_update_admin on public.businesses
  for update to authenticated using (public.has_business_role(id, array['owner','admin']))
  with check (public.has_business_role(id, array['owner','admin']));
create policy businesses_delete_owner on public.businesses
  for delete to authenticated using (public.has_business_role(id, array['owner']));

create policy members_select_same_business on public.business_members
  for select to authenticated using (public.is_business_member(business_id));
create policy members_insert_owner on public.business_members
  for insert to authenticated with check (public.has_business_role(business_id, array['owner']));
create policy members_update_owner on public.business_members
  for update to authenticated using (public.has_business_role(business_id, array['owner']))
  with check (public.has_business_role(business_id, array['owner']));
create policy members_delete_owner on public.business_members
  for delete to authenticated using (public.has_business_role(business_id, array['owner']));

-- Members may manage operational records only within their own business.
create policy products_select_member on public.products for select to authenticated
  using (public.is_business_member(business_id));
create policy products_insert_member on public.products for insert to authenticated
  with check (public.is_business_member(business_id));
create policy products_update_member on public.products for update to authenticated
  using (public.is_business_member(business_id)) with check (public.is_business_member(business_id));
create policy products_delete_admin on public.products for delete to authenticated
  using (public.has_business_role(business_id, array['owner','admin']));

create policy stock_movements_select_member on public.stock_movements for select to authenticated
  using (public.is_business_member(business_id));
create policy stock_movements_insert_member on public.stock_movements for insert to authenticated
  with check (public.is_business_member(business_id));
create policy stock_movements_update_admin on public.stock_movements for update to authenticated
  using (public.has_business_role(business_id, array['owner','admin']))
  with check (public.has_business_role(business_id, array['owner','admin']));
create policy stock_movements_delete_admin on public.stock_movements for delete to authenticated
  using (public.has_business_role(business_id, array['owner','admin']));

create policy sales_select_member on public.sales for select to authenticated
  using (public.is_business_member(business_id));
create policy sales_insert_member on public.sales for insert to authenticated
  with check (public.is_business_member(business_id) and created_by = (select auth.uid()));
create policy sales_update_admin on public.sales for update to authenticated
  using (public.has_business_role(business_id, array['owner','admin']))
  with check (public.has_business_role(business_id, array['owner','admin']));
create policy sales_delete_admin on public.sales for delete to authenticated
  using (public.has_business_role(business_id, array['owner','admin']));

create policy sale_items_select_member on public.sale_items for select to authenticated
  using (public.is_business_member(business_id));
create policy sale_items_insert_member on public.sale_items for insert to authenticated
  with check (public.is_business_member(business_id));
create policy sale_items_update_admin on public.sale_items for update to authenticated
  using (public.has_business_role(business_id, array['owner','admin']))
  with check (public.has_business_role(business_id, array['owner','admin']));
create policy sale_items_delete_admin on public.sale_items for delete to authenticated
  using (public.has_business_role(business_id, array['owner','admin']));

create policy debtors_select_member on public.debtors for select to authenticated
  using (public.is_business_member(business_id));
create policy debtors_insert_member on public.debtors for insert to authenticated
  with check (public.is_business_member(business_id));
create policy debtors_update_member on public.debtors for update to authenticated
  using (public.is_business_member(business_id)) with check (public.is_business_member(business_id));
create policy debtors_delete_admin on public.debtors for delete to authenticated
  using (public.has_business_role(business_id, array['owner','admin']));

create policy debtor_payments_select_member on public.debtor_payments for select to authenticated
  using (public.is_business_member(business_id));
create policy debtor_payments_insert_member on public.debtor_payments for insert to authenticated
  with check (public.is_business_member(business_id) and recorded_by = (select auth.uid()));
create policy debtor_payments_update_admin on public.debtor_payments for update to authenticated
  using (public.has_business_role(business_id, array['owner','admin']))
  with check (public.has_business_role(business_id, array['owner','admin']));
create policy debtor_payments_delete_admin on public.debtor_payments for delete to authenticated
  using (public.has_business_role(business_id, array['owner','admin']));

create policy reminders_select_member on public.reminders for select to authenticated
  using (public.is_business_member(business_id));
create policy reminders_insert_member on public.reminders for insert to authenticated
  with check (public.is_business_member(business_id) and created_by = (select auth.uid()));
create policy reminders_update_member on public.reminders for update to authenticated
  using (public.is_business_member(business_id)) with check (public.is_business_member(business_id));
create policy reminders_delete_admin on public.reminders for delete to authenticated
  using (public.has_business_role(business_id, array['owner','admin']));

-- Keep access explicit. RLS still decides which rows are visible/mutable.
revoke all on public.businesses, public.business_members, public.products, public.stock_movements, public.sales,
  public.sale_items, public.debtors, public.debtor_payments, public.reminders from anon, authenticated;
grant select, update, delete on public.businesses to authenticated;
grant select, insert, update, delete on public.business_members,
  public.products, public.stock_movements, public.sales, public.sale_items, public.debtors,
  public.debtor_payments, public.reminders to authenticated;

-- Preserve compatibility with the currently wired initial app-state persistence.
create table if not exists public.app_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.app_state enable row level security;
drop policy if exists "Users can read their own app state" on public.app_state;
drop policy if exists "Users can create their own app state" on public.app_state;
drop policy if exists "Users can update their own app state" on public.app_state;
drop policy if exists "Users can delete their own app state" on public.app_state;
create policy "Users can read their own app state" on public.app_state
  for select to authenticated using (auth.uid() = user_id);
create policy "Users can create their own app state" on public.app_state
  for insert to authenticated with check (auth.uid() = user_id);
create policy "Users can update their own app state" on public.app_state
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete their own app state" on public.app_state
  for delete to authenticated using (auth.uid() = user_id);
revoke all on public.app_state from anon;
grant select, insert, update, delete on public.app_state to authenticated;

commit;
