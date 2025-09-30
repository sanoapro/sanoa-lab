-- Asegura columnas y índices necesarios para patient_appointments
begin;

alter table if exists public.patient_appointments
  add column if not exists status text;

alter table if exists public.patient_appointments
  add column if not exists last_webhook_at timestamptz;

alter table if exists public.patient_appointments
  add column if not exists metadata jsonb;

create unique index if not exists idx_patient_appointments_cal_uid
  on public.patient_appointments (cal_uid);

commit;
