-- ============================================
-- P3: patient_appointments (vínculo booking ↔ paciente)
-- ============================================

create table if not exists public.patient_appointments (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  cal_uid text not null unique,
  title text,
  start timestamptz not null,
  "end" timestamptz not null,
  meeting_url text,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_patient_appointments_patient on public.patient_appointments(patient_id);
create index if not exists idx_patient_appointments_start on public.patient_appointments(start);

alter table public.patient_appointments enable row level security;

-- SELECT: dueño del paciente o usuarios compartidos (si el paciente no está eliminado)
drop policy if exists pa_select on public.patient_appointments;
create policy pa_select
on public.patient_appointments for select
using (
  exists (
    select 1
    from public.patients p
    left join public.patient_shares s on s.patient_id = p.id
    where p.id = patient_appointments.patient_id
      and (
        p.user_id = auth.uid()
        or (
          p.deleted_at is null and (
            s.shared_with_user_id = auth.uid()
            or s.shared_with_email = (auth.jwt()->>'email')
          )
        )
      )
  )
);

-- INSERT/UPDATE/DELETE: solo dueño del paciente y paciente no borrado
drop policy if exists pa_insert on public.patient_appointments;
create policy pa_insert
on public.patient_appointments for insert
with check (
  exists (
    select 1 from public.patients p
    where p.id = patient_appointments.patient_id
      and p.user_id = auth.uid()
      and p.deleted_at is null
  )
);

drop policy if exists pa_update on public.patient_appointments;
create policy pa_update
on public.patient_appointments for update
using (
  exists (select 1 from public.patients p where p.id = patient_appointments.patient_id and p.user_id = auth.uid() and p.deleted_at is null)
)
with check (
  exists (select 1 from public.patients p where p.id = patient_appointments.patient_id and p.user_id = auth.uid() and p.deleted_at is null)
);

drop policy if exists pa_delete on public.patient_appointments;
create policy pa_delete
on public.patient_appointments for delete
using (
  exists (select 1 from public.patients p where p.id = patient_appointments.patient_id and p.user_id = auth.uid() and p.deleted_at is null)
);
