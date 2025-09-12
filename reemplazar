-- ===========================
-- Sanoa Lab - P1 CRUD Schema
-- Pacientes, Notas, Shares + RLS
-- ===========================

-- Tipos
do $$ begin
  if not exists (select 1 from pg_type where typname = 'permission_level') then
    create type permission_level as enum ('read','write');
  end if;
end $$;

-- Tabla de pacientes (dueño = user_id)
create table if not exists public.patients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,                             -- propietario
  nombre text not null,
  edad int,
  genero char(1) check (genero in ('F','M','O')) default 'O',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_patients_user_id on public.patients(user_id);
create index if not exists idx_patients_created_at on public.patients(created_at desc);

-- Trigger updated_at
create or replace function public.set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_patients_updated_at on public.patients;
create trigger trg_patients_updated_at
before update on public.patients
for each row execute function public.set_updated_at();

-- Notas del paciente
create table if not exists public.patient_notes (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  user_id uuid not null,                -- autor/propietario
  titulo text,
  contenido text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_notes_patient_id on public.patient_notes(patient_id);
create index if not exists idx_notes_user_id on public.patient_notes(user_id);

drop trigger if exists trg_notes_updated_at on public.patient_notes;
create trigger trg_notes_updated_at
before update on public.patient_notes
for each row execute function public.set_updated_at();

-- Compartir pacientes por email o por user_id
create table if not exists public.patient_shares (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  owner_id uuid not null,                 -- siempre = patients.user_id
  shared_with_email text,                 -- alternativa 1: por email
  shared_with_user_id uuid,               -- alternativa 2: por user_id
  permission permission_level not null default 'read',
  created_at timestamptz not null default now(),
  constraint share_receiver_check
    check ((shared_with_email is not null) or (shared_with_user_id is not null))
);

create index if not exists idx_shares_patient_id on public.patient_shares(patient_id);
create index if not exists idx_shares_receiver_email on public.patient_shares(shared_with_email);
create index if not exists idx_shares_receiver_user on public.patient_shares(shared_with_user_id);

-- ===========================
-- RLS
-- ===========================
alter table public.patients enable row level security;
alter table public.patient_notes enable row level security;
alter table public.patient_shares enable row level security;

-- Pacientes
-- Seleccionar: dueño o compartido (por email o user_id)
create policy if not exists patients_select_own_or_shared
on public.patients for select
using (
  user_id = auth.uid()
  or exists (
    select 1 from public.patient_shares s
    where s.patient_id = patients.id
      and (
        (s.shared_with_user_id is not null and s.shared_with_user_id = auth.uid())
        or (s.shared_with_email is not null and s.shared_with_email = auth.email())
      )
  )
);

-- Insertar: sólo el dueño (user_id debe coincidir)
create policy if not exists patients_insert_own
on public.patients for insert
with check (user_id = auth.uid());

-- Actualizar/Borrar: sólo el dueño
create policy if not exists patients_update_own
on public.patients for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy if not exists patients_delete_own
on public.patients for delete
using (user_id = auth.uid());

-- Notas: visible si puedes ver al paciente.
create policy if not exists notes_select_own_or_shared
on public.patient_notes for select
using (
  user_id = auth.uid()
  or exists (
    select 1 from public.patients p
    left join public.patient_shares s on s.patient_id = p.id
    where p.id = patient_notes.patient_id
      and (
        p.user_id = auth.uid()
        or (s.shared_with_user_id = auth.uid())
        or (s.shared_with_email = auth.email())
      )
  )
);

-- Insertar: autor debe ser auth.uid() y debe tener permiso sobre el paciente (dueño o compartido con write)
create policy if not exists notes_insert_owned_with_access
on public.patient_notes for insert
with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.patients p
    left join public.patient_shares s on s.patient_id = p.id
    where p.id = patient_notes.patient_id
      and (
        p.user_id = auth.uid()
        or (
          (s.shared_with_user_id = auth.uid()
            or s.shared_with_email = auth.email())
          and s.permission in ('write','read') -- permitir crear si tienes acceso (puedes cambiar a sólo write)
        )
      )
  )
);

-- Actualizar/Borrar: autor o dueño del paciente
create policy if not exists notes_update_author_or_owner
on public.patient_notes for update
using (
  user_id = auth.uid()
  or exists (select 1 from public.patients p where p.id = patient_notes.patient_id and p.user_id = auth.uid())
)
with check (
  user_id = auth.uid()
  or exists (select 1 from public.patients p where p.id = patient_notes.patient_id and p.user_id = auth.uid())
);

create policy if not exists notes_delete_author_or_owner
on public.patient_notes for delete
using (
  user_id = auth.uid()
  or exists (select 1 from public.patients p where p.id = patient_notes.patient_id and p.user_id = auth.uid())
);

-- Shares: sólo el dueño puede ver/crear/borrar
create policy if not exists shares_select_owner
on public.patient_shares for select
using (owner_id = auth.uid());

create policy if not exists shares_insert_owner
on public.patient_shares for insert
with check (owner_id = auth.uid());

create policy if not exists shares_delete_owner
on public.patient_shares for delete
using (owner_id = auth.uid());
