-- ======================================================
-- P7: Auditoría avanzada (versiones + motivo), FTS y búsqueda
-- ======================================================

-- 1) Tabla de versiones de notas
create table if not exists public.patient_note_versions (
  id uuid primary key default gen_random_uuid(),
  note_id uuid not null references public.patient_notes(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  action text not null check (action in ('insert','update','delete')),
  edited_by uuid null,
  reason text null,
  before_titulo text null,
  after_titulo text null,
  before_contenido text null,
  after_contenido text null,
  created_at timestamptz not null default now()
);

alter table public.patient_note_versions enable row level security;

-- Política de lectura: ver versiones sólo si el usuario puede ver el paciente (dueño o miembro de la org o comparte por user_id)
drop policy if exists pnv_select on public.patient_note_versions;
create policy pnv_select on public.patient_note_versions for select
using (
  exists (
    select 1
    from public.patients p
    left join public.patient_shares s on s.patient_id = p.id and s.revoked_at is null
    where p.id = patient_note_versions.patient_id
      and (
        p.user_id = auth.uid()
        or (p.org_id is not null and public.is_member_of_org(p.org_id, 'member'))
        or s.shared_with_user_id = auth.uid()
      )
  )
);

-- 2) Trigger para registrar versiones y motivo (vía current_setting('app.change_reason'))
create or replace function public.log_note_version()
returns trigger
language plpgsql
security definer
as $$
declare
  v_reason text := nullif(current_setting('app.change_reason', true), '');
begin
  if (tg_op = 'INSERT') then
    insert into public.patient_note_versions(note_id, patient_id, action, edited_by, reason,
      before_titulo, before_contenido, after_titulo, after_contenido)
    values (new.id, new.patient_id, 'insert', auth.uid(), v_reason,
      null, null, new.titulo, new.contenido);
    return new;
  elsif (tg_op = 'UPDATE') then
    if new.titulo is distinct from old.titulo
       or new.contenido is distinct from old.contenido
       or new.deleted_at is distinct from old.deleted_at then
      insert into public.patient_note_versions(note_id, patient_id, action, edited_by, reason,
        before_titulo, before_contenido, after_titulo, after_contenido)
      values (new.id, new.patient_id, 'update', auth.uid(), v_reason,
        old.titulo, old.contenido, new.titulo, new.contenido);
    end if;
    return new;
  elsif (tg_op = 'DELETE') then
    insert into public.patient_note_versions(note_id, patient_id, action, edited_by, reason,
      before_titulo, before_contenido, after_titulo, after_contenido)
    values (old.id, old.patient_id, 'delete', auth.uid(), v_reason,
      old.titulo, old.contenido, null, null);
    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists trg_patient_notes_version_insert on public.patient_notes;
create trigger trg_patient_notes_version_insert
after insert on public.patient_notes
for each row execute function public.log_note_version();

drop trigger if exists trg_patient_notes_version_update on public.patient_notes;
create trigger trg_patient_notes_version_update
after update on public.patient_notes
for each row execute function public.log_note_version();

drop trigger if exists trg_patient_notes_version_delete on public.patient_notes;
create trigger trg_patient_notes_version_delete
after delete on public.patient_notes
for each row execute function public.log_note_version();

-- 3) RPC: actualizar/eliminar nota con "motivo" (set_config + UPDATE)
create or replace function public.update_note_with_reason(p_note_id uuid, p_titulo text, p_contenido text, p_reason text default null)
returns public.patient_notes
language plpgsql
security definer
as $$
declare
  v_row public.patient_notes;
begin
  perform set_config('app.change_reason', coalesce(p_reason,''), true);
  update public.patient_notes
     set titulo = p_titulo,
         contenido = p_contenido,
         updated_at = now()
   where id = p_note_id
   returning * into v_row;
  return v_row;
end;
$$;

create or replace function public.delete_note_with_reason(p_note_id uuid, p_reason text default null)
returns void
language plpgsql
security definer
as $$
begin
  perform set_config('app.change_reason', coalesce(p_reason,''), true);
  update public.patient_notes
     set deleted_at = now()
   where id = p_note_id;
end;
$$;

-- 4) Full-Text Search (español) — columnas generadas + índices
do $$
begin
  if not exists (
    select 1 from information_schema.columns
     where table_schema='public' and table_name='patients' and column_name='search'
  ) then
    alter table public.patients
      add column search tsvector
      generated always as (to_tsvector('spanish', coalesce(nombre,''))) stored;
    create index if not exists idx_patients_search on public.patients using gin (search);
  end if;
end$$;

do $$
begin
  if not exists (
    select 1 from information_schema.columns
     where table_schema='public' and table_name='patient_notes' and column_name='search'
  ) then
    alter table public.patient_notes
      add column search tsvector
      generated always as (to_tsvector('spanish', coalesce(titulo,'') || ' ' || coalesce(contenido,''))) stored;
    create index if not exists idx_patient_notes_search on public.patient_notes using gin (search);
  end if;
end$$;

-- 5) RPC de búsqueda unificada (pacientes + notas) con ranking y filtro opcional por org
create or replace function public.search_all(q text, p_org uuid default null, p_limit int default 20, p_offset int default 0)
returns table(kind text, id uuid, patient_id uuid, title text, snippet text, rank double precision)
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
           ts_rank(p.search, (select q from ts)) as rank
      from public.patients p
     where (select q from ts) @@ p.search
       and (p_org is null or p.org_id = p_org)
  ),
  nts as (
    select 'note'::text as kind,
           n.id as id,
           n.patient_id,
           coalesce(n.titulo,'(Sin título)') as title,
           left(coalesce(n.contenido,''), 240) as snippet,
           ts_rank(n.search, (select q from ts)) as rank
      from public.patient_notes n
      join public.patients p on p.id = n.patient_id
     where (select q from ts) @@ n.search
       and n.deleted_at is null
       and (p_org is null or p.org_id = p_org)
  )
  select * from (
    select * from pts
    union all
    select * from nts
  ) U
  order by rank desc nulls last, title asc
  offset greatest(0, p_offset) limit greatest(1, p_limit);
$$;
