-- (Misma definición que ejecutaste en Supabase)
begin;
create extension if not exists pgcrypto;
create table if not exists public.patients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  nombre text not null,
  edad integer not null check (edad >= 0),
  genero text not null check (genero in ('F','M','O')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_patients_user_id on public.patients(user_id);
create index if not exists idx_patients_nombre_lower on public.patients((lower(nombre)));
create index if not exists idx_patients_created_at on public.patients(created_at desc);
alter table public.patients enable row level security;
drop policy if exists "patients select own"  on public.patients;
drop policy if exists "patients insert own"  on public.patients;
drop policy if exists "patients update own"  on public.patients;
drop policy if exists "patients delete own"  on public.patients;
create policy "patients select own"  on public.patients for select to authenticated using ( user_id = auth.uid() );
create policy "patients insert own"  on public.patients for insert  to authenticated with check ( user_id = auth.uid() );
create policy "patients update own"  on public.patients for update to authenticated using ( user_id = auth.uid() );
create policy if not exists "patients delete own"  on public.patients for delete to authenticated using ( user_id = auth.uid() );
create or replace function public.set_patient_defaults() returns trigger language plpgsql security definer as $$
begin
  if tg_op = 'INSERT' then
    if new.user_id is null then new.user_id := auth.uid(); end if;
    new.updated_at := now(); return new;
  elsif tg_op = 'UPDATE' then
    new.updated_at := now(); return new;
  end if;
  return new;
end; $$;
drop trigger if exists trg_patients_defaults on public.patients;
create trigger trg_patients_defaults before insert or update on public.patients for each row execute procedure public.set_patient_defaults();
commit;
