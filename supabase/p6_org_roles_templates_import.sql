-- ======================================================
-- P6: Organizaciones + Roles + RLS + Plantillas de notas
-- ======================================================

-- 1) Organizaciones y membresías
create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.organization_members (
  org_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null,
  role text not null check (role in ('owner','admin','member')),
  created_at timestamptz not null default now(),
  primary key (org_id, user_id)
);

create index if not exists idx_org_owner on public.organizations(owner_user_id);
create index if not exists idx_orgm_user on public.organization_members(user_id);
create index if not exists idx_orgm_role on public.organization_members(role);

alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;

-- RLS: ver orgs donde soy owner o miembro; modificar sólo si soy owner/admin (según tabla members)
drop policy if exists org_select on public.organizations;
create policy org_select on public.organizations for select
using (
  owner_user_id = auth.uid()
  or exists (select 1 from public.organization_members m where m.org_id = organizations.id and m.user_id = auth.uid())
);

drop policy if exists org_insert on public.organizations;
create policy org_insert on public.organizations for insert
with check ( owner_user_id = auth.uid() );

drop policy if exists org_update on public.organizations;
create policy org_update on public.organizations for update
using (
  owner_user_id = auth.uid()
  or exists (
    select 1 from public.organization_members m where m.org_id = organizations.id and m.user_id = auth.uid() and m.role in ('owner','admin')
  )
)
with check (
  owner_user_id = auth.uid()
  or exists (
    select 1 from public.organization_members m where m.org_id = organizations.id and m.user_id = auth.uid() and m.role in ('owner','admin')
  )
);

drop policy if exists org_delete on public.organizations;
create policy org_delete on public.organizations for delete
using (
  owner_user_id = auth.uid()
);

-- organization_members: ver los de mis orgs; insertar/actualizar/borrar si soy owner/admin
drop policy if exists orgm_select on public.organization_members;
create policy orgm_select on public.organization_members for select
using (
  exists (select 1 from public.organization_members m2 where m2.org_id = organization_members.org_id and m2.user_id = auth.uid())
  or exists (select 1 from public.organizations o where o.id = organization_members.org_id and o.owner_user_id = auth.uid())
);

drop policy if exists orgm_insert on public.organization_members;
create policy orgm_insert on public.organization_members for insert
with check (
  exists (select 1 from public.organization_members m2 where m2.org_id = organization_members.org_id and m2.user_id = auth.uid() and m2.role in ('owner','admin'))
  or exists (select 1 from public.organizations o where o.id = organization_members.org_id and o.owner_user_id = auth.uid())
);

drop policy if exists orgm_update on public.organization_members;
create policy orgm_update on public.organization_members for update
using (
  exists (select 1 from public.organization_members m2 where m2.org_id = organization_members.org_id and m2.user_id = auth.uid() and m2.role in ('owner','admin'))
  or exists (select 1 from public.organizations o where o.id = organization_members.org_id and o.owner_user_id = auth.uid())
)
with check (
  exists (select 1 from public.organization_members m2 where m2.org_id = organization_members.org_id and m2.user_id = auth.uid() and m2.role in ('owner','admin'))
  or exists (select 1 from public.organizations o where o.id = organization_members.org_id and o.owner_user_id = auth.uid())
);

drop policy if exists orgm_delete on public.organization_members;
create policy orgm_delete on public.organization_members for delete
using (
  exists (select 1 from public.organization_members m2 where m2.org_id = organization_members.org_id and m2.user_id = auth.uid() and m2.role in ('owner','admin'))
  or exists (select 1 from public.organizations o where o.id = organization_members.org_id and o.owner_user_id = auth.uid())
);

-- 2) Helper: ¿soy miembro de org con rol mínimo?
create or replace function public.is_member_of_org(p_org uuid, p_min_role text default 'member')
returns boolean
language sql
stable
as $$
  with me as (
    select coalesce(
      (select role from public.organization_members where org_id = p_org and user_id = auth.uid()),
      (select 'owner'::text from public.organizations where id = p_org and owner_user_id = auth.uid())
    ) as role
  )
  select case
    when (select role from me) is null then false
    when p_min_role = 'member' then true
    when p_min_role = 'admin' then (select role in ('admin','owner') from me)
    when p_min_role = 'owner' then (select role = 'owner' from me)
    else false
  end;
$$;

-- 3) Pacientes: columna org_id y políticas extra por membresía
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='patients' and column_name='org_id'
  ) then
    alter table public.patients add column org_id uuid null references public.organizations(id);
    create index idx_patients_org on public.patients(org_id);
  end if;
end$$;

-- Políticas adicionales para permitir acceso por organización (no removemos las ya existentes de dueño/compartidos)
drop policy if exists patients_select_org on public.patients;
create policy patients_select_org
on public.patients for select
using (
  org_id is not null and public.is_member_of_org(org_id, 'member')
);

drop policy if exists patients_insert_org on public.patients;
create policy patients_insert_org
on public.patients for insert
with check (
  user_id = auth.uid()
  and (new.org_id is null or public.is_member_of_org(new.org_id, 'member'))
);

drop policy if exists patients_update_org on public.patients;
create policy patients_update_org
on public.patients for update
using (
  (org_id is not null and public.is_member_of_org(org_id, 'admin'))
  or (user_id = auth.uid())
)
with check (
  (new.org_id is not null and public.is_member_of_org(new.org_id, 'admin'))
  or (new.user_id = auth.uid())
);

drop policy if exists patients_delete_org on public.patients;
create policy patients_delete_org
on public.patients for delete
using (
  (org_id is not null and public.is_member_of_org(org_id, 'admin'))
  or (user_id = auth.uid())
);

-- 4) Tags: permitir scope por organización (columna org_id opcional)
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='tags' and column_name='org_id'
  ) then
    alter table public.tags add column org_id uuid null references public.organizations(id);
  end if;
end$$;

-- Unicidad por (owner_id, org_id, name) para soportar tags de org
do $$
begin
  if exists (select 1 from pg_indexes where schemaname='public' and indexname='tags_owner_id_name_key') then
    -- nada
    null;
  end if;
exception when others then
  null;
end$$;

-- Intentamos recrear unique de forma segura
do $$
begin
  perform 1
  from pg_constraint
  where conname = 'tags_owner_org_name_key';
  if not found then
    -- quitamos posibles uniques previos conflictivos
    begin
      alter table public.tags drop constraint if exists tags_owner_id_name_key;
    exception when others then null;
    end;
    alter table public.tags add constraint tags_owner_org_name_key unique (owner_id, org_id, name);
  end if;
end$$;

-- RLS de tags: dueñas o miembros de la org
drop policy if exists tags_select_org on public.tags;
create policy tags_select_org
on public.tags for select
using (
  owner_id = auth.uid() or (org_id is not null and public.is_member_of_org(org_id, 'member'))
);

drop policy if exists tags_insert_org on public.tags;
create policy tags_insert_org
on public.tags for insert
with check (
  owner_id = auth.uid() or (org_id is not null and public.is_member_of_org(org_id, 'admin'))
);

drop policy if exists tags_update_org on public.tags;
create policy tags_update_org
on public.tags for update
using (
  owner_id = auth.uid() or (org_id is not null and public.is_member_of_org(org_id, 'admin'))
)
with check (
  owner_id = auth.uid() or (org_id is not null and public.is_member_of_org(org_id, 'admin'))
);

drop policy if exists tags_delete_org on public.tags;
create policy tags_delete_org
on public.tags for delete
using (
  owner_id = auth.uid() or (org_id is not null and public.is_member_of_org(org_id, 'admin'))
);

-- 5) Plantillas de notas (opcionales por org)
create table if not exists public.note_templates (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  org_id uuid null references public.organizations(id),
  name text not null,
  body text not null,
  created_at timestamptz not null default now(),
  unique (owner_id, org_id, name)
);

alter table public.note_templates enable row level security;

drop policy if exists nt_select on public.note_templates;
create policy nt_select on public.note_templates for select
using (
  owner_id = auth.uid() or (org_id is not null and public.is_member_of_org(org_id, 'member'))
);

drop policy if exists nt_insert on public.note_templates;
create policy nt_insert on public.note_templates for insert
with check (
  owner_id = auth.uid() or (org_id is not null and public.is_member_of_org(org_id, 'admin'))
);

drop policy if exists nt_update on public.note_templates;
create policy nt_update on public.note_templates for update
using (
  owner_id = auth.uid() or (org_id is not null and public.is_member_of_org(org_id, 'admin'))
)
with check (
  owner_id = auth.uid() or (org_id is not null and public.is_member_of_org(org_id, 'admin'))
);

drop policy if exists nt_delete on public.note_templates;
create policy nt_delete on public.note_templates for delete
using (
  owner_id = auth.uid() or (org_id is not null and public.is_member_of_org(org_id, 'admin'))
);
