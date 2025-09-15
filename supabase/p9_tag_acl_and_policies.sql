-- ======================================================
-- P9: Permisos finos por etiqueta y organización
-- ======================================================

-- ACL por etiqueta (quién puede leer/escribir pacientes con esa etiqueta dentro de una org)
create table if not exists public.tag_permissions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  role text not null check (role in ('admin','member','viewer')), -- roles de la org
  can_read boolean not null default true,
  can_write boolean not null default false,
  created_at timestamptz not null default now(),
  unique (org_id, tag_id, role)
);
alter table public.tag_permissions enable row level security;

-- RLS: lectura para miembros; cambios sólo admins
drop policy if exists tp_select on public.tag_permissions;
create policy tp_select on public.tag_permissions for select
using ( public.is_member_of_org(org_id, 'member') );

drop policy if exists tp_modify on public.tag_permissions;
create policy tp_modify on public.tag_permissions for all
using ( public.is_member_of_org(org_id, 'admin') )
with check ( public.is_member_of_org(org_id, 'admin') );

-- Función: ¿tengo permiso por etiqueta sobre este paciente? (read|write)
create or replace function public.patient_has_tag_permission(p_patient_id uuid, p_kind text)
returns boolean
language sql
stable
as $$
  select exists(
    select 1
    from public.patients p
    join public.patient_tags pt on pt.patient_id = p.id
    join public.tag_permissions tp on tp.tag_id = pt.tag_id and tp.org_id = p.org_id
    where p.id = p_patient_id
      and (
        (tp.role = 'admin'  and public.is_member_of_org(p.org_id, 'admin')) or
        (tp.role = 'member' and public.is_member_of_org(p.org_id, 'member')) or
        (tp.role = 'viewer' and public.is_member_of_org(p.org_id, 'member'))
      )
      and (
        (p_kind = 'read'  and tp.can_read = true) or
        (p_kind = 'write' and tp.can_write = true)
      )
  );
$$;

-- Permiso extra por ETIQUETA sobre PACIENTES (SELECT/UPDATE)
-- (Se suman a tus políticas existentes: dueños, miembros org, shares, etc.)
create policy if not exists patients_select_by_tag on public.patients
for select
using ( public.patient_has_tag_permission(id, 'read') );

create policy if not exists patients_update_by_tag on public.patients
for update
using ( public.patient_has_tag_permission(id, 'write') )
with check ( public.patient_has_tag_permission(id, 'write') );

-- Permiso extra por ETIQUETA sobre NOTAS (SELECT/INSERT/UPDATE/DELETE)
create policy if not exists notes_select_by_tag on public.patient_notes
for select
using ( public.patient_has_tag_permission(patient_id, 'read') );

create policy if not exists notes_insert_by_tag on public.patient_notes
for insert
with check ( public.patient_has_tag_permission(patient_id, 'write') );

create policy if not exists notes_update_by_tag on public.patient_notes
for update
using ( public.patient_has_tag_permission(patient_id, 'write') )
with check ( public.patient_has_tag_permission(patient_id, 'write') );

create policy if not exists notes_delete_by_tag on public.patient_notes
for delete
using ( public.patient_has_tag_permission(patient_id, 'write') );

