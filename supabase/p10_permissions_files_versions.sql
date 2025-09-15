-- ======================================================
-- P10: Permisos finos por PACIENTE + Versionado de archivos + Bitácora
-- ======================================================

-- 1) Permisos por paciente (adicional a dueños/org/tag ACL/shares)
create table if not exists public.patient_permissions (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  user_id uuid not null,
  can_read boolean not null default true,
  can_edit_notes boolean not null default false,
  can_manage_files boolean not null default false,
  can_share boolean not null default false,
  created_by uuid null,
  created_at timestamptz not null default now(),
  unique (patient_id, user_id)
);
alter table public.patient_permissions enable row level security;

drop policy if exists pp_select on public.patient_permissions;
create policy pp_select on public.patient_permissions for select
using ( user_id = auth.uid() or exists (select 1 from public.patients p where p.id = patient_id and p.user_id = auth.uid()) );

drop policy if exists pp_modify on public.patient_permissions;
create policy pp_modify on public.patient_permissions for all
using (
  -- dueños del paciente o admins de la org del paciente
  exists (
    select 1 from public.patients p
    where p.id = patient_permissions.patient_id
      and (p.user_id = auth.uid() or (p.org_id is not null and public.is_member_of_org(p.org_id, 'admin')))
  )
)
with check (
  exists (
    select 1 from public.patients p
    where p.id = patient_permissions.patient_id
      and (p.user_id = auth.uid() or (p.org_id is not null and public.is_member_of_org(p.org_id, 'admin')))
  )
);

-- Helper: ¿el usuario tiene permiso explícito por paciente?
create or replace function public.patient_has_explicit_permission(p_patient_id uuid, p_kind text)
returns boolean
language sql
stable
as $$
  select exists(
    select 1 from public.patient_permissions pp
    where pp.patient_id = p_patient_id
      and pp.user_id = auth.uid()
      and (
        (p_kind = 'read'        and pp.can_read = true) or
        (p_kind = 'edit_notes'  and pp.can_edit_notes = true) or
        (p_kind = 'manage_files'and pp.can_manage_files = true) or
        (p_kind = 'share'       and pp.can_share = true)
      )
  );
$$;

-- Políticas adicionales en pacientes y notas (sumatoria OR a lo existente)
create policy if not exists patients_select_by_explicit on public.patients
for select using ( public.patient_has_explicit_permission(id, 'read') );

create policy if not exists patients_update_by_explicit on public.patients
for update
using ( public.patient_has_explicit_permission(id, 'edit_notes') )
with check ( public.patient_has_explicit_permission(id, 'edit_notes') );

create policy if not exists notes_select_by_explicit on public.patient_notes
for select using ( public.patient_has_explicit_permission(patient_id, 'read') );

create policy if not exists notes_insert_by_explicit on public.patient_notes
for insert with check ( public.patient_has_explicit_permission(patient_id, 'edit_notes') );

create policy if not exists notes_update_by_explicit on public.patient_notes
for update
using ( public.patient_has_explicit_permission(patient_id, 'edit_notes') )
with check ( public.patient_has_explicit_permission(patient_id, 'edit_notes') );

create policy if not exists notes_delete_by_explicit on public.patient_notes
for delete using ( public.patient_has_explicit_permission(patient_id, 'edit_notes') );

-- 2) Versionado de archivos
-- Agrupamos versiones por (patient_id + group_key). group_key = nombre lógico (filename normalizado).
create table if not exists public.patient_file_versions (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  group_key text not null,               -- p.ej. "informe.pdf"
  version int not null,                  -- 1..N
  name text not null,                    -- nombre mostrado (puede coincidir con group_key)
  path text not null,                    -- ruta en Storage (única por versión)
  size_bytes bigint not null default 0,
  checksum_sha256 text null,
  uploaded_by uuid null,
  created_at timestamptz not null default now(),
  unique (patient_id, group_key, version)
);
create index if not exists idx_pfvers_pt_key_version on public.patient_file_versions(patient_id, group_key, version desc);
alter table public.patient_file_versions enable row level security;

-- RLS: leer versiones si puedo leer el paciente; crear/borrar si puedo gestionar archivos
drop policy if exists pfv_select on public.patient_file_versions;
create policy pfv_select on public.patient_file_versions for select
using (
  public.patient_has_explicit_permission(patient_id, 'read')
  or exists (select 1 from public.patients p where p.id = patient_file_versions.patient_id
             and (p.user_id = auth.uid() or (p.org_id is not null and public.is_member_of_org(p.org_id, 'member'))))
  or public.patient_has_tag_permission(patient_id, 'read')
);

drop policy if exists pfv_insert on public.patient_file_versions;
create policy pfv_insert on public.patient_file_versions for insert
with check (
  public.patient_has_explicit_permission(patient_id, 'manage_files')
  or exists (select 1 from public.patients p where p.id = patient_file_versions.patient_id
             and (p.user_id = auth.uid() or (p.org_id is not null and public.is_member_of_org(p.org_id, 'admin'))))
  or public.patient_has_tag_permission(patient_id, 'write')
);

drop policy if exists pfv_delete on public.patient_file_versions;
create policy pfv_delete on public.patient_file_versions for delete
using (
  public.patient_has_explicit_permission(patient_id, 'manage_files')
  or exists (select 1 from public.patients p where p.id = patient_file_versions.patient_id
             and (p.user_id = auth.uid() or (p.org_id is not null and public.is_member_of_org(p.org_id, 'admin'))))
  or public.patient_has_tag_permission(patient_id, 'write')
);

-- RPC: siguiente versión
create or replace function public.next_file_version(p_patient_id uuid, p_group_key text)
returns int
language sql
stable
as $$
  select coalesce(max(version), 0) + 1
  from public.patient_file_versions
  where patient_id = p_patient_id and group_key = p_group_key;
$$;

-- RPC: lista últimas versiones (una por group_key)
create or replace function public.list_latest_files(p_patient_id uuid)
returns table(group_key text, version int, name text, path text, size_bytes bigint, created_at timestamptz)
language sql
stable
as $$
  select distinct on (group_key)
    v.group_key, v.version, v.name, v.path, v.size_bytes, v.created_at
  from public.patient_file_versions v
  where v.patient_id = p_patient_id
  order by v.group_key, v.version desc;
$$;

-- RPC: lista todas las versiones de un archivo lógico
create or replace function public.list_file_versions(p_patient_id uuid, p_group_key text)
returns table(version int, name text, path text, size_bytes bigint, created_at timestamptz, checksum_sha256 text)
language sql
stable
as $$
  select version, name, path, size_bytes, created_at, checksum_sha256
  from public.patient_file_versions
  where patient_id = p_patient_id and group_key = p_group_key
  order by version desc;
$$;

-- 3) Bitácora de acceso a archivos
create table if not exists public.patient_file_access_log (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  path text not null,
  action text not null check (action in ('view','download','upload','delete')),
  by_user uuid null,
  ip text null,
  user_agent text null,
  created_at timestamptz not null default now()
);
alter table public.patient_file_access_log enable row level security;

-- Lectura: dueño, miembro org del paciente o permisos explícitos/tag ACL
drop policy if exists pfal_select on public.patient_file_access_log;
create policy pfal_select on public.patient_file_access_log for select
using (
  exists (select 1 from public.patients p where p.id = patient_id and
          (p.user_id = auth.uid() or (p.org_id is not null and public.is_member_of_org(p.org_id, 'member'))))
  or public.patient_has_explicit_permission(patient_id, 'read')
  or public.patient_has_tag_permission(patient_id, 'read')
);

-- Inserción: cualquiera con permiso de usar el archivo (gestionar o leer según caso); se hace vía servidor
drop policy if exists pfal_insert on public.patient_file_access_log;
create policy pfal_insert on public.patient_file_access_log for insert
with check ( true );

-- RPC: registrar evento de acceso
create or replace function public.log_file_access(p_patient_id uuid, p_path text, p_action text, p_ip text, p_ua text)
returns void
language plpgsql
security definer
as $$
begin
  if p_action not in ('view','download','upload','delete') then
    raise exception 'Acción inválida';
  end if;
  insert into public.patient_file_access_log(patient_id, path, action, by_user, ip, user_agent)
  values (p_patient_id, p_path, p_action, auth.uid(), p_ip, p_ua);
end;
$$;

