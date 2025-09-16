-- patient_shares: compat v2 (unificar emails + owner + permission)
create extension if not exists pgcrypto;
do $$
begin
  if not exists (select 1 from pg_type where typname='permission_level') then
    create type public.permission_level as enum ('read','write');
  end if;
end $$;
alter table public.patient_shares
  add column if not exists owner_id uuid,
  add column if not exists patient_id uuid,
  add column if not exists shared_with_user_id uuid,
  add column if not exists shared_with_email text,
  add column if not exists grantee_email text,
  add column if not exists permission public.permission_level;
update public.patient_shares set permission='read' where permission is null;
alter table public.patient_shares alter column permission set default 'read';
alter table public.patient_shares alter column permission set not null;
do $$
begin
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='patient_shares' and column_name='grantee_email') then
    execute 'alter table public.patient_shares alter column grantee_email drop not null';
  end if;
end $$;
update public.patient_shares set shared_with_email = lower(grantee_email)
where shared_with_email is null and grantee_email is not null;
update public.patient_shares set grantee_email = lower(shared_with_email)
where grantee_email is null and shared_with_email is not null;
update public.patient_shares s
set owner_id = p.user_id
from public.patients p
where s.patient_id = p.id and s.owner_id is null;
create or replace function public.trg_ps_sync_emails()
returns trigger language plpgsql as $$
begin
  if new.shared_with_email is null and new.grantee_email is not null then
    new.shared_with_email := lower(new.grantee_email);
  elsif new.shared_with_email is not null and new.grantee_email is null then
    new.grantee_email := lower(new.shared_with_email);
  elsif new.shared_with_email is not null and new.grantee_email is not null then
    new.shared_with_email := lower(new.shared_with_email);
    new.grantee_email := lower(new.grantee_email);
  end if;
  return new;
end; $$;
drop trigger if exists sync_emails on public.patient_shares;
create trigger sync_emails before insert or update on public.patient_shares
for each row execute function public.trg_ps_sync_emails();
create or replace function public.trg_ps_set_owner_id()
returns trigger language plpgsql as $$
begin
  if new.owner_id is null then
    select user_id into new.owner_id from public.patients where id = new.patient_id;
  end if;
  return new;
end; $$;
drop trigger if exists set_owner_id on public.patient_shares;
create trigger set_owner_id before insert on public.patient_shares
for each row execute function public.trg_ps_set_owner_id();
create index if not exists idx_ps_owner           on public.patient_shares(owner_id);
create index if not exists idx_ps_patient_owner   on public.patient_shares(patient_id, owner_id);
create index if not exists idx_ps_shared_email_l  on public.patient_shares((lower(shared_with_email)));
create index if not exists idx_ps_grantee_email_l on public.patient_shares((lower(grantee_email)));
create or replace function public.auth_email()
returns text language sql stable as $$
  select nullif(lower((auth.jwt()->>'email')::text), '')
$$;
create or replace function public.patient_share_allows(p_patient uuid, p_action text)
returns boolean language sql stable as $$
  with me as (select auth.uid() as uid, public.auth_email() as email)
  select exists (
    select 1 from public.patient_shares s, me
    where s.patient_id = p_patient and s.revoked_at is null
      and (
        (s.shared_with_user_id is not null and s.shared_with_user_id = me.uid) or
        (s.shared_with_email  is not null and lower(s.shared_with_email)  = me.email) or
        (s.grantee_email      is not null and lower(s.grantee_email)      = me.email)
      )
      and (
        case
          when lower(coalesce(p_action,'')) = 'read'  then s.permission in ('read','write')
          when lower(coalesce(p_action,'')) = 'write' then s.permission = 'write'
          else false
        end
      )
  );
$$;