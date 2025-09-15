-- ============================================
-- P5: Etiquetas/Diagnósticos + Facetas de búsqueda
-- ============================================

-- 1) Taxonomía de etiquetas (scoped por dueño)
create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  name text not null,
  color text,
  kind text not null default 'tag', -- 'tag' | 'dx'
  created_at timestamptz not null default now(),
  unique (owner_id, name)
);

-- 2) Relación N:M paciente <-> tag
create table if not exists public.patient_tags (
  patient_id uuid not null references public.patients(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (patient_id, tag_id)
);

alter table public.tags enable row level security;
alter table public.patient_tags enable row level security;

-- 3) RLS
-- tags: solo dueño puede ver/crear/editar/borrar sus tags
drop policy if exists tags_select_owner on public.tags;
create policy tags_select_owner
on public.tags for select
using (owner_id = auth.uid());

drop policy if exists tags_insert_owner on public.tags;
create policy tags_insert_owner
on public.tags for insert
with check (owner_id = auth.uid());

drop policy if exists tags_update_owner on public.tags;
create policy tags_update_owner
on public.tags for update
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

drop policy if exists tags_delete_owner on public.tags;
create policy tags_delete_owner
on public.tags for delete
using (owner_id = auth.uid());

-- patient_tags:
-- SELECT: dueño del paciente o compartidos (si el paciente no está eliminado)
drop policy if exists pt_select on public.patient_tags;
create policy pt_select
on public.patient_tags for select
using (
  exists (
    select 1
    from public.patients p
    left join public.patient_shares s on s.patient_id = p.id
    where p.id = patient_tags.patient_id
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

-- INSERT/DELETE: solo el dueño del paciente y si el paciente NO está eliminado
drop policy if exists pt_insert on public.patient_tags;
create policy pt_insert
on public.patient_tags for insert
with check (
  exists (
    select 1 from public.patients p
    join public.tags t on t.id = patient_tags.tag_id
    where p.id = patient_tags.patient_id
      and p.deleted_at is null
      and p.user_id = auth.uid()
      and t.owner_id = auth.uid()
  )
);

drop policy if exists pt_delete on public.patient_tags;
create policy pt_delete
on public.patient_tags for delete
using (
  exists (
    select 1 from public.patients p
    where p.id = patient_tags.patient_id
      and p.deleted_at is null
      and p.user_id = auth.uid()
  )
);

create index if not exists idx_tags_owner on public.tags(owner_id);
create index if not exists idx_tags_kind on public.tags(kind);
create index if not exists idx_pt_patient on public.patient_tags(patient_id);
create index if not exists idx_pt_tag on public.patient_tags(tag_id);

-- 4) RPC: IDs de pacientes que coinciden con un set de tags (modo 'any' o 'all')
--    Respeta el modelo de compartidos y soft-delete (para compartidos).
create or replace function public.patients_ids_by_tags(tag_ids uuid[], mode text default 'any')
returns table (patient_id uuid)
language sql
security definer
set search_path = public
as $$
  select p.id as patient_id
  from public.patients p
  join public.patient_tags pt on pt.patient_id = p.id
  where pt.tag_id = any(tag_ids)
    and (
      p.user_id = auth.uid()
      or (
        p.deleted_at is null
        and exists (
          select 1
          from public.patient_shares s
          where s.patient_id = p.id
            and (
              s.shared_with_user_id = auth.uid()
              or s.shared_with_email = (auth.jwt()->>'email')
            )
        )
      )
    )
  group by p.id
  having case
    when mode = 'all' then count(distinct pt.tag_id) = cardinality(tag_ids)
    else count(distinct pt.tag_id) > 0
  end;
$$;

-- 5) Vista ligera para exportar pacientes con tags (solo dueños)
drop view if exists public.v_patients_export cascade;
create view public.v_patients_export as
  select
    p.id,
    p.user_id,
    p.nombre,
    p.edad,
    p.genero,
    p.created_at,
    p.deleted_at,
    coalesce(string_agg(t.name, ', ' order by t.name), '') as tags
  from public.patients p
  left join public.patient_tags pt on pt.patient_id = p.id
  left join public.tags t on t.id = pt.tag_id and t.owner_id = p.user_id
  group by p.id;

-- Nota: RLS de la vista aplica el de las tablas base (patients / patient_tags / tags).
