-- ============================================
-- P4: Webhooks Cal.com + sincronización mínima
-- ============================================

-- 1) Bandeja cruda de webhooks (último estado por UID)
create table if not exists public.cal_bookings_raw (
  cal_uid         text primary key,
  trigger_event   text not null,
  status          text,
  start           timestamptz,
  "end"           timestamptz,
  attendee_email  text,
  attendee_name   text,
  payload         jsonb not null,
  inserted_at     timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_cal_raw_status on public.cal_bookings_raw(status);
create index if not exists idx_cal_raw_start  on public.cal_bookings_raw(start);

alter table public.cal_bookings_raw enable row level security;

-- 2) Ampliamos patient_appointments para reflejar estado y timestamps de sync
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'patient_appointments' and column_name = 'status'
  ) then
    alter table public.patient_appointments add column status text;
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'patient_appointments' and column_name = 'last_webhook_at'
  ) then
    alter table public.patient_appointments add column last_webhook_at timestamptz;
  end if;
end$$;

create index if not exists idx_pa_status on public.patient_appointments(status);

-- 3) RLS cal_bookings_raw:
-- Permite SELECT a dueños del paciente y compartidos por email (modelo actual con grantee_email)
drop policy if exists cal_raw_select_via_pa on public.cal_bookings_raw;

create policy cal_raw_select_via_pa
on public.cal_bookings_raw for select
using (
  exists (
    select 1
    from public.patient_appointments pa
    join public.patients p on p.id = pa.patient_id
    left join public.patient_shares s on s.patient_id = p.id
    where pa.cal_uid = cal_bookings_raw.cal_uid
      and (
        p.user_id = auth.uid()
        or (
          p.deleted_at is null
          and s.grantee_email = (auth.jwt()->>'email')
        )
      )
  )
);

-- 4) Helper trigger: updated_at
create or replace function public.set_updated_at() returns trigger as $$
begin
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_cal_raw_updated on public.cal_bookings_raw;

create trigger trg_cal_raw_updated
before update on public.cal_bookings_raw
for each row execute function public.set_updated_at();