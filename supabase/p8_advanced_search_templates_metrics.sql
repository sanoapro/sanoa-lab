-- ======================================================
-- P8: Búsqueda avanzada + Búsquedas guardadas + Plantillas de export + Métricas
-- ======================================================

-- 1) Búsquedas guardadas
create table if not exists public.saved_searches (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  org_id uuid null references public.organizations(id),
  name text not null,
  payload jsonb not null, -- { q, tagsAny, tagsAll, genero, from, to, onlyOrg }
  created_at timestamptz not null default now(),
  unique (owner_id, org_id, name)
);
alter table public.saved_searches enable row level security;

drop policy if exists ss_select on public.saved_searches;
create policy ss_select on public.saved_searches for select
using (
  owner_id = auth.uid() or (org_id is not null and public.is_member_of_org(org_id, 'member'))
);

drop policy if exists ss_insert on public.saved_searches;
create policy ss_insert on public.saved_searches for insert
with check (
  owner_id = auth.uid() or (org_id is not null and public.is_member_of_org(org_id, 'admin'))
);

drop policy if exists ss_update on public.saved_searches;
create policy ss_update on public.saved_searches for update
using (
  owner_id = auth.uid() or (org_id is not null and public.is_member_of_org(org_id, 'admin'))
)
with check (
  owner_id = auth.uid() or (org_id is not null and public.is_member_of_org(org_id, 'admin'))
);

drop policy if exists ss_delete on public.saved_searches;
create policy ss_delete on public.saved_searches for delete
using (
  owner_id = auth.uid() or (org_id is not null and public.is_member_of_org(org_id, 'admin'))
);

-- 2) Plantillas de export (branding de PDF)
create table if not exists public.export_templates (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  org_id uuid null references public.organizations(id),
  name text not null,
  cover_title text not null,
  cover_subtitle text null,
  logo_url text null,
  brand_hex text null check (brand_hex ~* '^#?[0-9a-f]{6}$'),
  created_at timestamptz not null default now(),
  unique (owner_id, org_id, name)
);
alter table public.export_templates enable row level security;

drop policy if exists et_select on public.export_templates;
create policy et_select on public.export_templates for select
using (
  owner_id = auth.uid() or (org_id is not null and public.is_member_of_org(org_id, 'member'))
);

drop policy if exists et_insert on public.export_templates;
create policy et_insert on public.export_templates for insert
with check (
  owner_id = auth.uid() or (org_id is not null and public.is_member_of_org(org_id, 'admin'))
);

drop policy if exists et_update on public.export_templates;
create policy et_update on public.export_templates for update
using (
  owner_id = auth.uid() or (org_id is not null and public.is_member_of_org(org_id, 'admin'))
)
with check (
  owner_id = auth.uid() or (org_id is not null and public.is_member_of_org(org_id, 'admin'))
);

drop policy if exists et_delete on public.export_templates;
create policy et_delete on public.export_templates for delete
using (
  owner_id = auth.uid() or (org_id is not null and public.is_member_of_org(org_id, 'admin'))
);

-- 3) Búsqueda unificada con filtros adicionales
-- NOTA: Para filtrar por etiquetas recibimos p_patient_ids (ya resueltas en el cliente con RPC existente patients_ids_by_tags).
create or replace function public.search_all_plus(
  q text,
  p_org uuid default null,
  p_patient_ids uuid[] default null,
  p_from timestamptz default null,
  p_to timestamptz default null,
  p_genero text default null,
  p_limit int default 40,
  p_offset int default 0
)
returns table(kind text, id uuid, patient_id uuid, title text, snippet text, rank double precision, created_at timestamptz)
language sql
stable
as $$
  with ts as (select plainto_tsquery('spanish', coalesce(q,'')) q),
  pts as (
    select 'patient'::text as kind,
           p.id as id,
           p.id as patient_id,
           p.nombre as title,
           null::text as snippet,
           ts_rank(p.search, (select q from ts)) as rank,
           p.created_at
      from public.patients p
     where (select q from ts) @@ p.search
       and (p_org is null or p.org_id = p_org)
       and (p_patient_ids is null or p.id = any(p_patient_ids))
       and (p_from is null or p.created_at >= p_from)
       and (p_to is null or p.created_at <= p_to)
       and (p_genero is null or p.genero = p_genero)
  ),
  nts as (
    select 'note'::text as kind,
           n.id as id,
           n.patient_id,
           coalesce(n.titulo,'(Sin título)') as title,
           left(coalesce(n.contenido,''), 240) as snippet,
           ts_rank(n.search, (select q from ts)) as rank,
           n.created_at
      from public.patient_notes n
      join public.patients p on p.id = n.patient_id
     where n.deleted_at is null
       and (select q from ts) @@ n.search
       and (p_org is null or p.org_id = p_org)
       and (p_patient_ids is null or n.patient_id = any(p_patient_ids))
       and (p_from is null or n.created_at >= p_from)
       and (p_to is null or n.created_at <= p_to)
       and (p_genero is null or p.genero = p_genero)
  )
  select * from (
    select * from pts
    union all
    select * from nts
  ) u
  order by rank desc nulls last, created_at desc
  offset greatest(0, p_offset) limit greatest(1, p_limit);
$$;

-- 4) Métricas: pacientes por etiqueta en rango
create or replace function public.metrics_patients_by_tag(
  p_org uuid default null,
  p_from timestamptz default null,
  p_to timestamptz default null
)
returns table(tag_id uuid, tag_name text, total bigint)
language sql
stable
as $$
  select t.id as tag_id, t.name as tag_name, count(distinct p.id) as total
    from public.patients p
    join public.patient_tags pt on pt.patient_id = p.id
    join public.tags t on t.id = pt.tag_id
   where (p_org is null or p.org_id = p_org)
     and (p_from is null or p.created_at >= p_from)
     and (p_to is null or p.created_at <= p_to)
   group by t.id, t.name
   order by total desc, t.name asc;
$$;

-- 5) Métricas: pacientes nuevos por mes (últimos N meses desde ahora)
create or replace function public.metrics_new_patients_by_month(
  p_org uuid default null,
  months int default 12
)
returns table(month_start date, total bigint)
language sql
stable
as $$
  with series as (
    select date_trunc('month', now())::date - (i || ' months')::interval as month_start
      from generate_series(0, greatest(1, months)-1) g(i)
  )
  select s.month_start::date as month_start,
         count(p.id) as total
    from series s
    left join public.patients p
      on date_trunc('month', p.created_at) = s.month_start
     and (p_org is null or p.org_id = p_org)
   group by s.month_start
   order by s.month_start asc;
$$;

-- 6) Métricas: notas por mes (últimos N meses)
create or replace function public.metrics_notes_by_month(
  p_org uuid default null,
  months int default 12
)
returns table(month_start date, total bigint)
language sql
stable
as $$
  with series as (
    select date_trunc('month', now())::date - (i || ' months')::interval as month_start
      from generate_series(0, greatest(1, months)-1) g(i)
  )
  select s.month_start::date as month_start,
         count(n.id) as total
    from series s
    left join public.patient_notes n
      on date_trunc('month', n.created_at) = s.month_start
     and n.deleted_at is null
     and exists (select 1 from public.patients p where p.id = n.patient_id and (p_org is null or p.org_id = p_org))
   group by s.month_start
   order by s.month_start asc;
$$;
