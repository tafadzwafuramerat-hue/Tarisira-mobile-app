begin;

alter table public.debtors add column if not exists due_at timestamptz;
alter table public.debtors add column if not exists owner_approved_reminders boolean not null default false;
alter table public.debtors add column if not exists customer_sms_opt_in boolean not null default false;
alter table public.debtors add column if not exists customer_whatsapp_opt_in boolean not null default false;

update public.debtors
set due_at = ((created_at at time zone 'Africa/Harare')::date + due_in_days + time '09:00') at time zone 'Africa/Harare'
where due_at is null;

create or replace function public.set_debtor_due_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.due_at is null then
    new.due_at := ((now() at time zone 'Africa/Harare')::date + new.due_in_days + time '09:00') at time zone 'Africa/Harare';
  end if;
  return new;
end;
$$;

drop trigger if exists debtors_set_due_at on public.debtors;
create trigger debtors_set_due_at
before insert or update of due_in_days on public.debtors
for each row execute function public.set_debtor_due_at();

create table if not exists public.automatic_debt_reminders (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  debtor_id uuid not null references public.debtors(id) on delete cascade,
  due_at timestamptz not null,
  scheduled_for timestamptz not null,
  status text not null default 'pending' check (status in ('pending', 'sending', 'sent', 'failed', 'cancelled')),
  sms_sent_at timestamptz,
  whatsapp_sent_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (debtor_id, due_at)
);

create index if not exists automatic_debt_reminders_due_idx
  on public.automatic_debt_reminders(scheduled_for) where status in ('pending', 'failed');

alter table public.automatic_debt_reminders enable row level security;
revoke all on public.automatic_debt_reminders from anon, authenticated;
grant select, insert, update on public.automatic_debt_reminders to service_role;

create or replace function public.schedule_automatic_debt_reminder()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.owner_approved_reminders
     and new.customer_sms_opt_in
     and new.customer_whatsapp_opt_in
     and nullif(trim(new.phone), '') is not null
     and new.due_at - interval '24 hours' > now() then
    insert into public.automatic_debt_reminders (business_id, debtor_id, due_at, scheduled_for)
    values (new.business_id, new.id, new.due_at, new.due_at - interval '24 hours')
    on conflict (debtor_id, due_at) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists debtors_schedule_automatic_reminder on public.debtors;
create trigger debtors_schedule_automatic_reminder
after insert on public.debtors
for each row execute function public.schedule_automatic_debt_reminder();

insert into public.automatic_debt_reminders (business_id, debtor_id, due_at, scheduled_for)
select business_id, id, due_at, due_at - interval '24 hours'
from public.debtors
where owner_approved_reminders
  and customer_sms_opt_in
  and customer_whatsapp_opt_in
  and nullif(trim(phone), '') is not null
  and due_at - interval '24 hours' > now()
on conflict (debtor_id, due_at) do nothing;

notify pgrst, 'reload schema';

commit;
