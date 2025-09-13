-- ============================================
-- P2: Soft-delete + filtros + auditoría ampliada
-- ============================================

-- 1) Columnas de soft-delete
alter table public.patients
  add column if not exists deleted_at timestamptz;

create index if not exists idx_patients_deleted_at on public.patients(deleted_at);

alter table public.patient_notes
  add column if not exists deleted_at timestamptz;

create index if not exists idx_notes_deleted_at on public.patient_notes(deleted_at);

-- 2) Políticas: visibilidad de pacientes
--    - El DUEÑO siempre puede ver el paciente (incluso si deleted_at no es null) para poder restaurar.
--    - Usuarios compartidos sólo ven si deleted_at es null.
drop policy if exists patients_select_own_or_shared on public.patients;
create policy patients_select_own_or_shared
on public.patients for select
using (
  user_id = auth.uid()
  or (
    deleted_at is null
    and exists (
      select 1 from public.patient_shares s
      where s.patient_id = patients.id
        and (
          s.shared_with_user_id = auth.uid()
          or s.shared_with_email = (auth.jwt()->>'email')
        )
    )
  )
);

-- Insert/Update/Delete (hard) se mantienen como dueño
drop policy if exists patients_insert_own on public.patients;
create policy patients_insert_own
on public.patients for insert
with check (user_id = auth.uid());

drop policy if exists patients_update_own on public.patients;
create policy patients_update_own
on public.patients for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists patients_delete_own on public.patients;
create policy patients_delete_own
on public.patients for delete
using (user_id = auth.uid());

-- 3) Políticas de notas con soft-delete
-- Select: autor o dueño; compartidos sólo si el paciente NO está borrado
drop policy if exists notes_select_own_or_shared on public.patient_notes;
create policy notes_select_own_or_shared
on public.patient_notes for select
using (
  user_id = auth.uid()
  or exists (
    select 1
    from public.patients p
    left join public.patient_shares s on s.patient_id = p.id
    where p.id = patient_notes.patient_id
      and (
        p.user_id = auth.uid()
        or (
          p.deleted_at is null
          and (
            s.shared_with_user_id = auth.uid()
            or s.shared_with_email = (auth.jwt()->>'email')
          )
        )
      )
  )
);

-- Insert: autor=auth.uid() y el paciente NO está borrado; dueño o share(write)
drop policy if exists notes_insert_owned_with_access on public.patient_notes;
create policy notes_insert_owned_with_access
on public.patient_notes for insert
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.patients p
    left join public.patient_shares s on s.patient_id = p.id
    where p.id = patient_notes.patient_id
      and p.deleted_at is null
      and (
        p.user_id = auth.uid()
        or (
          (s.shared_with_user_id = auth.uid() or s.shared_with_email = (auth.jwt()->>'email'))
          and s.permission in ('write','read')
        )
      )
  )
);

-- Update/Delete de notas: autor o dueño del paciente, y paciente no borrado para modificar
drop policy if exists notes_update_author_or_owner on public.patient_notes;
create policy notes_update_author_or_owner
on public.patient_notes for update
using (
  (
    user_id = auth.uid()
    or exists (select 1 from public.patients p where p.id = patient_notes.patient_id and p.user_id = auth.uid())
  )
  and exists (select 1 from public.patients p where p.id = patient_notes.patient_id and p.deleted_at is null)
)
with check (
  (
    user_id = auth.uid()
    or exists (select 1 from public.patients p where p.id = patient_notes.patient_id and p.user_id = auth.uid())
  )
  and exists (select 1 from public.patients p where p.id = patient_notes.patient_id and p.deleted_at is null)
);

drop policy if exists notes_delete_author_or_owner on public.patient_notes;
create policy notes_delete_author_or_owner
on public.patient_notes for delete
using (
  (
    user_id = auth.uid()
    or exists (select 1 from public.patients p where p.id = patient_notes.patient_id and p.user_id = auth.uid())
  )
  and exists (select 1 from public.patients p where p.id = patient_notes.patient_id and p.deleted_at is null)
);

-- 4) Shares: permitir crear sólo si el paciente NO está borrado
drop policy if exists shares_insert_owner on public.patient_shares;
create policy shares_insert_owner
on public.patient_shares for insert
with check (
  owner_id = auth.uid()
  and exists (select 1 from public.patients p where p.id = patient_shares.patient_id and p.deleted_at is null)
);

-- 5) Auditoría: permitir nuevas acciones
alter table public.audit_entries
  drop constraint if exists audit_entries_action_check;

alter table public.audit_entries
  add constraint audit_entries_action_check
  check (action in ('create','update','delete','share','unshare','soft_delete','restore'));

-- 6) Triggers de auditoría para soft_delete / restore

-- Patients: si cambia deleted_at NULL→valor => soft_delete; valor→NULL => restore; otro => update
create or replace function public.trg_audit_patients_upd() returns trigger as $$
begin
  if (old.deleted_at is null and new.deleted_at is not null) then
    perform public.log_audit('patient','soft_delete', new.id, jsonb_build_object('patient_id', new.id, 'nombre', new.nombre));
  elsif (old.deleted_at is not null and new.deleted_at is null) then
    perform public.log_audit('patient','restore', new.id, jsonb_build_object('patient_id', new.id, 'nombre', new.nombre));
  else
    perform public.log_audit('patient','update', new.id, jsonb_build_object('patient_id', new.id, 'nombre', new.nombre));
  end if;
  return new;
end;
$$ language plpgsql;

-- Notes: igual que arriba
create or replace function public.trg_audit_notes_upd() returns trigger as $$
begin
  if (old.deleted_at is null and new.deleted_at is not null) then
    perform public.log_audit('note','soft_delete', new.id, jsonb_build_object('patient_id', new.patient_id, 'titulo', new.titulo));
  elsif (old.deleted_at is not null and new.deleted_at is null) then
    perform public.log_audit('note','restore', new.id, jsonb_build_object('patient_id', new.patient_id, 'titulo', new.titulo));
  else
    perform public.log_audit('note','update', new.id, jsonb_build_object('patient_id', new.patient_id, 'titulo', new.titulo));
  end if;
  return new;
end;
$$ language plpgsql;
