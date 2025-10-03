

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pg_trgm" WITH SCHEMA "public";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "unaccent" WITH SCHEMA "public";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "vector" WITH SCHEMA "public";






CREATE TYPE "public"."agreement_role" AS ENUM (
    'specialist',
    'patient',
    'platform'
);


ALTER TYPE "public"."agreement_role" OWNER TO "postgres";


CREATE TYPE "public"."agreement_status" AS ENUM (
    'pending',
    'accepted',
    'revoked'
);


ALTER TYPE "public"."agreement_status" OWNER TO "postgres";


CREATE TYPE "public"."agreement_type" AS ENUM (
    'specialist_patient',
    'specialist_platform',
    'patient_platform'
);


ALTER TYPE "public"."agreement_type" OWNER TO "postgres";


CREATE TYPE "public"."lab_status" AS ENUM (
    'requested',
    'awaiting_upload',
    'uploaded',
    'reviewed',
    'cancelled'
);


ALTER TYPE "public"."lab_status" OWNER TO "postgres";


CREATE TYPE "public"."org_role" AS ENUM (
    'owner',
    'admin',
    'member',
    'external'
);


ALTER TYPE "public"."org_role" OWNER TO "postgres";


CREATE TYPE "public"."permission_level" AS ENUM (
    'read',
    'write'
);


ALTER TYPE "public"."permission_level" OWNER TO "postgres";


CREATE TYPE "public"."work_status" AS ENUM (
    'open',
    'done'
);


ALTER TYPE "public"."work_status" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."_reminders_touch"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.updated_at := now();
  return new;
end$$;


ALTER FUNCTION "public"."_reminders_touch"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."_set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.updated_at := now();
  return new;
end;
$$;


ALTER FUNCTION "public"."_set_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."agreements_is_patient_cleared"("p_org" "uuid", "p_specialist" "uuid", "p_patient" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE
    AS $$
  select exists(
    select 1 from agreements_acceptances a
    where a.org_id = p_org
      and a.specialist_id = p_specialist
      and a.patient_id = p_patient
      and a.contract_type = 'specialist_patient'
      and a.status = 'accepted'
  );
$$;


ALTER FUNCTION "public"."agreements_is_patient_cleared"("p_org" "uuid", "p_specialist" "uuid", "p_patient" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."audit_trigger"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  insert into audit_log(org_id, table_name, row_id, action, old_data, new_data, actor)
  values (
    coalesce((case when TG_OP='INSERT' then new.org_id else old.org_id end), null),
    TG_TABLE_NAME::text,
    (case when TG_OP='INSERT' then new.id else old.id end),
    TG_OP,
    (case when TG_OP='INSERT' then null else to_jsonb(old) end),
    (case when TG_OP='DELETE' then null else to_jsonb(new) end),
    auth.uid()
  );
  return (case when TG_OP='DELETE' then old else new end);
end $$;


ALTER FUNCTION "public"."audit_trigger"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."auth_email"() RETURNS "text"
    LANGUAGE "sql" STABLE
    AS $$
  select nullif(lower((auth.jwt()->>'email')::text), '')
$$;


ALTER FUNCTION "public"."auth_email"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."bank_flow"("p_org_id" "uuid", "p_from" "date", "p_to" "date") RETURNS TABLE("month" "date", "income_cents" bigint, "expense_cents" bigint, "net_cents" bigint)
    LANGUAGE "sql" STABLE
    AS $$
  select date_trunc('month', date)::date as month,
         sum(case when amount_cents > 0 then amount_cents else 0 end) as income_cents,
         sum(case when amount_cents < 0 then -amount_cents else 0 end) as expense_cents,
         sum(amount_cents) as net_cents
  from public.bank_tx
  where org_id = p_org_id
    and date between p_from and p_to
  group by 1
  order by 1;
$$;


ALTER FUNCTION "public"."bank_flow"("p_org_id" "uuid", "p_from" "date", "p_to" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."bank_flow"("p_org_id" "uuid", "p_from" "date", "p_to" "date", "p_group" "text" DEFAULT 'month'::"text") RETURNS TABLE("period" "text", "income_cents" bigint, "expense_cents" bigint, "net_cents" bigint)
    LANGUAGE "sql" STABLE
    AS $$
  with tx as (
    select *
    from public.bank_tx
    where org_id = p_org_id
      and date between p_from and p_to
  ),
  agg as (
    select
      case
        when lower(p_group) = 'week'
          then to_char(date_trunc('week', date)::date, 'YYYY-"W"IW')  -- semana ISO
        else to_char(date_trunc('month', date)::date, 'YYYY-MM-01')   -- primer día del mes
      end as period_key,
      sum(case when amount_cents > 0 then amount_cents else 0 end) as income_cents,
      sum(case when amount_cents < 0 then -amount_cents else 0 end) as expense_cents,
      sum(amount_cents) as net_cents
    from tx
    group by 1
  )
  select period_key as period, income_cents, expense_cents, net_cents
  from agg
  order by period_key;
$$;


ALTER FUNCTION "public"."bank_flow"("p_org_id" "uuid", "p_from" "date", "p_to" "date", "p_group" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."bank_pl"("p_org_id" "uuid", "p_from" "date", "p_to" "date") RETURNS TABLE("kind" "text", "category" "text", "total_cents" bigint)
    LANGUAGE "sql" STABLE
    AS $$
  select c.kind, c.name as category, sum(t.amount_cents) as total_cents
  from public.bank_tx t
  left join public.bank_categories c on c.id = t.category_id
  where t.org_id = p_org_id
    and t.date between p_from and p_to
  group by 1, 2
  order by 1, 2;
$$;


ALTER FUNCTION "public"."bank_pl"("p_org_id" "uuid", "p_from" "date", "p_to" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."can_revoke_document"("p_doc_type" "text", "p_doc_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" STABLE
    AS $$
declare v_org uuid; v_doctor uuid; v_user uuid;
begin
  v_user := auth.uid(); if v_user is null then return false; end if;

  if p_doc_type = 'prescription' then
    select org_id, doctor_id into v_org, v_doctor from public.prescriptions where id = p_doc_id;
  elsif p_doc_type = 'referral' then
    select org_id, doctor_id into v_org, v_doctor from public.referrals where id = p_doc_id;
  elsif p_doc_type = 'discharge' then
    select org_id, doctor_id into v_org, v_doctor from public.discharges where id = p_doc_id;
  elsif p_doc_type = 'lab_request' then
    select org_id, requested_by into v_org, v_doctor from public.lab_requests where id = p_doc_id;
  else
    return false;
  end if;

  return (v_doctor = v_user) or public.has_min_role(v_org, 'admin');
end $$;


ALTER FUNCTION "public"."can_revoke_document"("p_doc_type" "text", "p_doc_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."concept_norm_trg"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.canonical_norm := public.norm_text(new.canonical);
  return new;
end $$;


ALTER FUNCTION "public"."concept_norm_trg"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."delete_note_with_reason"("p_note_id" "uuid", "p_reason" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'extensions'
    AS $$
declare
  v_prev public.patient_notes;
  v_actor uuid := null;
  v_has_deleted boolean;
begin
  select * into v_prev
  from public.patient_notes
  where id = p_note_id
  for update;

  if not found then
    raise exception 'Nota no encontrada' using errcode = 'P0002';
  end if;

  if v_prev.user_id <> auth.uid() then
    raise exception 'No autorizado' using errcode = '42501';
  end if;

  -- ¿existe columna deleted_at?
  select exists(
    select 1
    from information_schema.columns
    where table_schema='public' and table_name='patient_notes' and column_name='deleted_at'
  ) into v_has_deleted;

  if v_has_deleted then
    update public.patient_notes
       set deleted_at = now()
     where id = p_note_id;
  else
    delete from public.patient_notes where id = p_note_id;
  end if;

  begin v_actor := auth.uid(); exception when others then v_actor := null; end;

  insert into public.patient_notes_audit(note_id, action, reason, actor, diff)
  values (p_note_id, 'delete', p_reason, v_actor, null);
end
$$;


ALTER FUNCTION "public"."delete_note_with_reason"("p_note_id" "uuid", "p_reason" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."drug_norm_trg"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.name_norm := public.norm_text(new.name);
  return new;
end $$;


ALTER FUNCTION "public"."drug_norm_trg"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."document_ledger" (
    "doc_type" "text" NOT NULL,
    "doc_id" "uuid" NOT NULL,
    "folio" "text",
    "verify_code" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "revoked_at" timestamp with time zone,
    "revoked_by" "uuid",
    "revoke_reason" "text",
    CONSTRAINT "document_ledger_doc_type_check" CHECK (("doc_type" = ANY (ARRAY['prescription'::"text", 'referral'::"text", 'discharge'::"text", 'lab_request'::"text"])))
);


ALTER TABLE "public"."document_ledger" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."ensure_document_folio"("p_doc_type" "text", "p_doc_id" "uuid") RETURNS "public"."document_ledger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
declare v_row public.document_ledger;
begin
  select * into v_row from public.document_ledger where doc_type=p_doc_type and doc_id=p_doc_id;
  if found then return v_row; end if;

  insert into public.document_ledger(doc_type, doc_id, folio, verify_code)
  values (
    p_doc_type, p_doc_id,
    to_char(nextval('document_folio_seq'),'FM000000'),
    encode(digest(gen_random_uuid()::text,'sha256'),'hex')
  )
  returning * into v_row;
  return v_row;
end $$;


ALTER FUNCTION "public"."ensure_document_folio"("p_doc_type" "text", "p_doc_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."ensure_personal_org_for"("uid" "uuid", "email" "text" DEFAULT NULL::"text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare oid uuid; base text;
begin
  select id into oid from organizations where is_personal and created_by = uid limit 1;
  if oid is null then
    base := coalesce(email, 'usuario');
    insert into organizations(name, slug, is_personal, created_by)
      values ('Personal '||base, 'u-'||left(uid::text,8), true, uid)
      returning id into oid;
    insert into org_members(org_id, user_id, role)
      values (oid, uid, 'owner')
      on conflict do nothing;
  end if;
  return oid;
end $$;


ALTER FUNCTION "public"."ensure_personal_org_for"("uid" "uuid", "email" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."ensure_rx_folio"("p_org_id" "uuid", "p_id" "uuid", "p_prefix" "text" DEFAULT 'RX'::"text") RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  curr_folio text;
  ym text := to_char(now() at time zone 'UTC', 'YYYYMM');
  new_num integer;
  new_folio text;
begin
  -- Validar pertenencia
  if not public.is_member_of(p_org_id) then
    raise exception 'not a member of org %', p_org_id using errcode = '42501';
  end if;

  -- Si ya tiene folio, devolver
  select folio into curr_folio from public.prescriptions where id = p_id and org_id = p_org_id limit 1;
  if curr_folio is not null then
    return curr_folio;
  end if;

  -- Incrementar doc_folios para (org, 'rx', YYYYMM)
  insert into public.doc_folios (org_id, doc_type, year_month, last_number)
  values (p_org_id, 'rx', ym, 1)
  on conflict (org_id, doc_type, year_month)
  do update set last_number = public.doc_folios.last_number + 1
  returning last_number into new_num;

  -- Formato de folio
  new_folio := format('%s-%s-%04s', coalesce(p_prefix, 'RX'), ym, new_num);

  -- Asignar si sigue sin folio (idempotencia)
  update public.prescriptions
     set folio = new_folio
   where id = p_id and org_id = p_org_id and folio is null;

  return new_folio;
end;
$$;


ALTER FUNCTION "public"."ensure_rx_folio"("p_org_id" "uuid", "p_id" "uuid", "p_prefix" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_work_for_appointment"("p_appt" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
declare
  v record;
begin
  select a.id, a.org_id, a.patient_id, a.start_at
    into v
  from public.appointments a
  where a.id = p_appt;

  if not found then
    return;
  end if;

  insert into public.work_items(org_id, patient_id, appointment_id, title, due_at)
  values (v.org_id, v.patient_id, v.id, 'Completar nota SO/DARE', v.start_at + interval '2 hours');

  insert into public.work_items(org_id, patient_id, appointment_id, title, due_at)
  values (v.org_id, v.patient_id, v.id, 'Subir consentimiento firmado', date_trunc('day', v.start_at) + interval '20 hours');

  insert into public.work_items(org_id, patient_id, appointment_id, title, due_at)
  values (v.org_id, v.patient_id, v.id, 'Adjuntar documentos del paciente', v.start_at + interval '24 hours');
end;
$$;


ALTER FUNCTION "public"."generate_work_for_appointment"("p_appt" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."has_min_role"("p_org" "uuid", "p_min" "text") RETURNS boolean
    LANGUAGE "plpgsql" STABLE
    AS $$
begin
  return exists (
    select 1 from public.organization_members
    where org_id = p_org and user_id = auth.uid() and role in ('owner','admin')
  );
end $$;


ALTER FUNCTION "public"."has_min_role"("p_org" "uuid", "p_min" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."has_role"("roles" "text"[]) RETURNS boolean
    LANGUAGE "sql" STABLE
    AS $$
 select exists(
   select 1 from public.org_members
   where user_id = auth.uid() and role = any(roles)
 );
$$;


ALTER FUNCTION "public"."has_role"("roles" "text"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."immutable_unaccent"("text") RETURNS "text"
    LANGUAGE "sql" IMMUTABLE PARALLEL SAFE
    AS $_$
  select public.unaccent($1)
$_$;


ALTER FUNCTION "public"."immutable_unaccent"("text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_member"("org" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE
    AS $$
  select exists(
    select 1
    from public.org_members m
    where m.org_id = org and m.user_id = auth.uid()
  );
$$;


ALTER FUNCTION "public"."is_member"("org" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_member_of"("org" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE
    AS $$
 select exists(
   select 1 from public.org_members
   where org_id = org and user_id = auth.uid()
 );
$$;


ALTER FUNCTION "public"."is_member_of"("org" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_member_of_org"("p_org" "uuid", "p_min_role" "text" DEFAULT 'member'::"text") RETURNS boolean
    LANGUAGE "sql" STABLE
    AS $$
  select exists(
    select 1
    from public.organization_members om
    where om.org_id = p_org
      and om.user_id = auth.uid()
      and public.org_role_rank(om.role::text) >= public.org_role_rank(p_min_role)
  );
$$;


ALTER FUNCTION "public"."is_member_of_org"("p_org" "uuid", "p_min_role" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_member_of_org"("p_org" "uuid", "p_min_role" "public"."org_role" DEFAULT 'member'::"public"."org_role") RETURNS boolean
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare ok boolean;
begin
  select true into ok
  from public.organization_members om
  where om.org_id = p_org
    and om.user_id = auth.uid()
    and public.role_at_least(om.role, p_min_role)
  limit 1;

  return coalesce(ok,false);
end;
$$;


ALTER FUNCTION "public"."is_member_of_org"("p_org" "uuid", "p_min_role" "public"."org_role") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."jwt_email"() RETURNS "text"
    LANGUAGE "sql" STABLE
    AS $$
  select coalesce(nullif((auth.jwt() ->> 'email')::text, ''), null)
$$;


ALTER FUNCTION "public"."jwt_email"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."list_file_versions"("p_patient_id" "uuid", "p_group_key" "text") RETURNS TABLE("version" integer, "name" "text", "path" "text", "size_bytes" bigint, "created_at" timestamp with time zone, "checksum_sha256" "text")
    LANGUAGE "sql" STABLE
    AS $$
  select version, name, path, size_bytes, created_at, checksum_sha256
  from public.patient_file_versions
  where patient_id = p_patient_id and group_key = p_group_key
  order by version desc;
$$;


ALTER FUNCTION "public"."list_file_versions"("p_patient_id" "uuid", "p_group_key" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."list_latest_files"("p_patient_id" "uuid") RETURNS TABLE("group_key" "text", "version" integer, "name" "text", "path" "text", "size_bytes" bigint, "created_at" timestamp with time zone)
    LANGUAGE "sql" STABLE
    AS $$
  select distinct on (group_key)
    v.group_key, v.version, v.name, v.path, v.size_bytes, v.created_at
  from public.patient_file_versions v
  where v.patient_id = p_patient_id
  order by v.group_key, v.version desc;
$$;


ALTER FUNCTION "public"."list_latest_files"("p_patient_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_audit"("p_entity" "text", "p_action" "text", "p_entity_id" "uuid", "p_payload" "jsonb") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
begin
  insert into public.audit_entries(entity, action, entity_id, payload, actor)
  values (p_entity, p_action, p_entity_id, p_payload, auth.uid());
end; $$;


ALTER FUNCTION "public"."log_audit"("p_entity" "text", "p_action" "text", "p_entity_id" "uuid", "p_payload" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_audit"("_patient_id" "uuid", "_entity" "text", "_entity_id" "uuid", "_action" "text", "_data" "jsonb") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
begin
  insert into public.audit_log(patient_id, actor_id, actor_email, entity, entity_id, action, data)
  values (_patient_id, auth.uid(), public.jwt_email(), _entity, _entity_id, _action, _data);
end;
$$;


ALTER FUNCTION "public"."log_audit"("_patient_id" "uuid", "_entity" "text", "_entity_id" "uuid", "_action" "text", "_data" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_file_access"("p_patient_id" "uuid", "p_path" "text", "p_action" "text", "p_ip" "text", "p_ua" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
begin
  if p_action not in ('view','download','upload','delete') then
    raise exception 'Acción inválida';
  end if;
  insert into public.patient_file_access_log(patient_id, path, action, by_user, ip, user_agent)
  values (p_patient_id, p_path, p_action, auth.uid(), p_ip, p_ua);
end;
$$;


ALTER FUNCTION "public"."log_file_access"("p_patient_id" "uuid", "p_path" "text", "p_action" "text", "p_ip" "text", "p_ua" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_note_version"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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


ALTER FUNCTION "public"."log_note_version"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."metrics_new_patients_by_month"("p_org" "uuid" DEFAULT NULL::"uuid", "months" integer DEFAULT 12) RETURNS TABLE("month_start" "date", "total" bigint)
    LANGUAGE "sql" STABLE
    AS $$
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


ALTER FUNCTION "public"."metrics_new_patients_by_month"("p_org" "uuid", "months" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."metrics_notes_by_month"("p_org" "uuid" DEFAULT NULL::"uuid", "months" integer DEFAULT 12) RETURNS TABLE("month_start" "date", "total" bigint)
    LANGUAGE "sql" STABLE
    AS $$
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


ALTER FUNCTION "public"."metrics_notes_by_month"("p_org" "uuid", "months" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."metrics_patients_by_tag"("p_org" "uuid" DEFAULT NULL::"uuid", "p_from" timestamp with time zone DEFAULT NULL::timestamp with time zone, "p_to" timestamp with time zone DEFAULT NULL::timestamp with time zone) RETURNS TABLE("tag_id" "uuid", "tag_name" "text", "total" bigint)
    LANGUAGE "sql" STABLE
    AS $$
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


ALTER FUNCTION "public"."metrics_patients_by_tag"("p_org" "uuid", "p_from" timestamp with time zone, "p_to" timestamp with time zone) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."moddatetime"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
 if tg_op in ('UPDATE','INSERT') then
   begin
     new.updated_at := now();
   exception when undefined_column then
     -- si la tabla no tiene updated_at, no hacer nada
     null;
   end;
 end if;
 return new;
end$$;


ALTER FUNCTION "public"."moddatetime"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."moddatetime_org_features"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  if tg_op = 'UPDATE' then
    new.updated_at := now();
  end if;
  return new;
end$$;


ALTER FUNCTION "public"."moddatetime_org_features"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."next_file_version"("p_patient_id" "uuid", "p_group_key" "text") RETURNS integer
    LANGUAGE "sql" STABLE
    AS $$
  select coalesce(max(version), 0) + 1
  from public.patient_file_versions
  where patient_id = p_patient_id and group_key = p_group_key;
$$;


ALTER FUNCTION "public"."next_file_version"("p_patient_id" "uuid", "p_group_key" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."norm_text"("p" "text") RETURNS "text"
    LANGUAGE "sql" IMMUTABLE
    AS $$
  select regexp_replace(lower(coalesce(p,'')), '\s+', ' ', 'g')
$$;


ALTER FUNCTION "public"."norm_text"("p" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."org_role_rank"("r" "text") RETURNS integer
    LANGUAGE "sql" IMMUTABLE
    AS $$
  select case r
    when 'owner' then 3
    when 'admin' then 2
    when 'member' then 1
    when 'external' then 0
    else -1 end;
$$;


ALTER FUNCTION "public"."org_role_rank"("r" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."patient_has_explicit_permission"("p_patient_id" "uuid", "p_kind" "text") RETURNS boolean
    LANGUAGE "sql" STABLE
    AS $$
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


ALTER FUNCTION "public"."patient_has_explicit_permission"("p_patient_id" "uuid", "p_kind" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."patient_has_tag_permission"("p_patient_id" "uuid", "p_kind" "text") RETURNS boolean
    LANGUAGE "sql" STABLE
    AS $$
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


ALTER FUNCTION "public"."patient_has_tag_permission"("p_patient_id" "uuid", "p_kind" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."patient_labels_summary"("p_org_id" "uuid") RETURNS TABLE("label" "text", "total" integer)
    LANGUAGE "sql" STABLE
    AS $$
  select label, count(*)::int as total
  from public.patient_labels
  where org_id = p_org_id
  group by label
  order by total desc, label asc;
$$;


ALTER FUNCTION "public"."patient_labels_summary"("p_org_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."patient_share_access_list"("p_org_id" "uuid", "p_patient_id" "uuid", "p_limit" integer DEFAULT 50, "p_offset" integer DEFAULT 0) RETURNS TABLE("share_id" "uuid", "token" "text", "created_at" timestamp with time zone, "expires_at" timestamp with time zone, "revoked_at" timestamp with time zone, "access_at" timestamp with time zone, "ip" "text", "user_agent" "text", "status" "text", "total" bigint)
    LANGUAGE "sql" STABLE
    AS $$
  with base as (
    select
      v.share_id,
      v.token,
      v.share_created_at as created_at,
      v.expires_at,
      v.revoked_at,
      v.access_at,
      v.ip,
      v.user_agent,
      case
        when v.revoked_at is not null then 'revocado'
        when v.expires_at is not null and v.expires_at < now() then 'expirado'
        else 'vigente'
      end as status
    from public.v_patient_share_access v
    where v.org_id = p_org_id
      and v.patient_id = p_patient_id
  ),
  counted as (
    select b.*, count(*) over() as total
    from base b
    order by coalesce(b.access_at, b.created_at) desc
    limit greatest(p_limit,0)
    offset greatest(p_offset,0)
  )
  select share_id, token, created_at, expires_at, revoked_at, access_at, ip, user_agent, status, total
  from counted;
$$;


ALTER FUNCTION "public"."patient_share_access_list"("p_org_id" "uuid", "p_patient_id" "uuid", "p_limit" integer, "p_offset" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."patient_share_allows"("p_patient" "uuid", "p_action" "text") RETURNS boolean
    LANGUAGE "sql" STABLE
    AS $$
  with me as (select auth.uid() as uid, public.auth_email() as email)
  select exists (
    select 1
    from public.patient_shares s, me
    where s.patient_id = p_patient
      and s.revoked_at is null
      and (
        (s.shared_with_user_id is not null and s.shared_with_user_id = me.uid)
        or (s.shared_with_email  is not null and lower(s.shared_with_email)  = me.email)
        or (s.grantee_email      is not null and lower(s.grantee_email)      = me.email)
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


ALTER FUNCTION "public"."patient_share_allows"("p_patient" "uuid", "p_action" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."patients_autocomplete"("org" "uuid", "q" "text", "uid" "uuid", "show_org" boolean DEFAULT false) RETURNS TABLE("id" "uuid", "label" "text")
    LANGUAGE "plpgsql" STABLE
    AS $$
declare
  has_assignments boolean := false;
  has_clinician_col boolean := false;
begin
  -- Detectar estructura
  select exists (select 1 from information_schema.tables where table_schema='public' and table_name='patient_assignments') into has_assignments;
  select exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='patients' and column_name='clinician_id'
  ) into has_clinician_col;

  if show_org then
    return query
      select p.id, p.full_name as label
      from public.patients p
      where p.org_id = org
        and (p.full_name ilike '%'||q||'%' or to_jsonb(p)::text ilike '%'||q||'%')
      order by p.full_name asc
      limit 20;
  end if;

  if has_assignments then
    return query
      select p.id, p.full_name as label
      from public.patients p
      join public.patient_assignments a on a.patient_id = p.id and a.org_id = p.org_id
      where p.org_id = org and a.user_id = uid
        and (p.full_name ilike '%'||q||'%' or to_jsonb(p)::text ilike '%'||q||'%')
      order by p.full_name asc
      limit 20;
  elsif has_clinician_col then
    return query
      select p.id, p.full_name as label
      from public.patients p
      where p.org_id = org and p.clinician_id = uid
        and (p.full_name ilike '%'||q||'%' or to_jsonb(p)::text ilike '%'||q||'%')
      order by p.full_name asc
      limit 20;
  else
    -- Fallback: creados por mí (si existe la columna)
    if exists (select 1 from information_schema.columns where table_schema='public' and table_name='patients' and column_name='created_by') then
      return query
        select p.id, p.full_name as label
        from public.patients p
        where p.org_id = org and p.created_by = uid
          and (p.full_name ilike '%'||q||'%' or to_jsonb(p)::text ilike '%'||q||'%')
        order by p.full_name asc
        limit 20;
    else
      -- Último fallback: miembros de la org (puede devolver más de los propios)
      return query
        select p.id, p.full_name as label
        from public.patients p
        where p.org_id = org
          and (p.full_name ilike '%'||q||'%' or to_jsonb(p)::text ilike '%'||q||'%')
        order by p.full_name asc
        limit 20;
    end if;
  end if;
end $$;


ALTER FUNCTION "public"."patients_autocomplete"("org" "uuid", "q" "text", "uid" "uuid", "show_org" boolean) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."patients_ids_by_tags"("tag_ids" "uuid"[], "mode" "text" DEFAULT 'any'::"text") RETURNS TABLE("patient_id" "uuid")
    LANGUAGE "plpgsql"
    AS $$
begin
  if mode = 'all' then
    return query
      select pt.patient_id
      from public.patient_tags pt
      where pt.tag_id = any(tag_ids)
      group by pt.patient_id
      having count(distinct pt.tag_id) = array_length(tag_ids, 1);
  else
    return query
      select distinct pt.patient_id
      from public.patient_tags pt
      where pt.tag_id = any(tag_ids);
  end if;
end $$;


ALTER FUNCTION "public"."patients_ids_by_tags"("tag_ids" "uuid"[], "mode" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."patients_search"("p_org_id" "uuid", "p_q" "text" DEFAULT NULL::"text", "p_genero" "text" DEFAULT NULL::"text", "p_tags_any" "text"[] DEFAULT NULL::"text"[], "p_tags_all" "text"[] DEFAULT NULL::"text"[], "p_from" "date" DEFAULT NULL::"date", "p_to" "date" DEFAULT NULL::"date", "p_include_deleted" boolean DEFAULT false, "p_limit" integer DEFAULT 50, "p_offset" integer DEFAULT 0) RETURNS TABLE("id" "uuid", "name" "text", "gender" "text", "dob" "date", "tags" "text"[], "created_at" timestamp with time zone, "deleted_at" timestamp with time zone, "total" bigint)
    LANGUAGE "sql" STABLE
    AS $$
  with base as (
    select * from public.v_patients
    where org_id = p_org_id
      and (p_include_deleted or deleted_at is null)
      and (p_q is null or name ilike '%'||p_q||'%')
      and (p_genero is null or (gender is not null and upper(gender) = upper(p_genero)))
      and (p_from is null or created_at::date >= p_from)
      and (p_to is null or created_at::date <= p_to)
      and (p_tags_any is null or tags && p_tags_any)
      and (p_tags_all is null or tags @> p_tags_all)
  ),
  counted as (
    select b.*, count(*) over() as total
    from base b
    order by coalesce(name, '') asc, id asc
    limit greatest(p_limit,0)
    offset greatest(p_offset,0)
  )
  select id, name, gender, dob, tags, created_at, deleted_at, total from counted;
$$;


ALTER FUNCTION "public"."patients_search"("p_org_id" "uuid", "p_q" "text", "p_genero" "text", "p_tags_any" "text"[], "p_tags_all" "text"[], "p_from" "date", "p_to" "date", "p_include_deleted" boolean, "p_limit" integer, "p_offset" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."patients_search_suggest"("p_org_id" "uuid", "p_q" "text", "p_limit" integer DEFAULT 8, "p_scope" "text" DEFAULT 'mine'::"text", "p_provider_id" "uuid" DEFAULT NULL::"uuid") RETURNS TABLE("id" "uuid", "full_name" "text", "phone" "text", "email" "text", "score" real)
    LANGUAGE "sql" STABLE
    AS $$
 with me as (
   select coalesce(p_provider_id, auth.uid()) as provider_id
 ),
 base as (
   select p.id, p.full_name, p.phone, p.email,
          greatest(
            similarity(public.immutable_unaccent(lower(p.full_name)), public.immutable_unaccent(lower(p_q))),
            case when p.phone is not null then similarity(p.phone, p_q) else 0 end,
            case when p.email is not null then similarity(p.email, p_q) else 0 end
          ) as score
   from public.patients p
   where p.org_id = p_org_id
     and (
       public.immutable_unaccent(lower(p.full_name)) ilike '%'||public.immutable_unaccent(lower(p_q))||'%'
       or (p.phone is not null and p.phone ilike '%'||p_q||'%')
       or (p.email is not null and p.email ilike '%'||p_q||'%')
     )
 ),
 scoped as (
   select b.*
   from base b
   where
     case
       when lower(coalesce(p_scope,'mine')) = 'org' then true
       else exists (
         select 1
         from public.patient_providers pp, me
         where pp.org_id = p_org_id
           and pp.patient_id = b.id
           and pp.provider_id = me.provider_id
       )
     end
 )
 select id, full_name, phone, email, score
 from scoped
 order by score desc, full_name asc
 limit p_limit;
$$;


ALTER FUNCTION "public"."patients_search_suggest"("p_org_id" "uuid", "p_q" "text", "p_limit" integer, "p_scope" "text", "p_provider_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."patients_suggest"("q" "text", "org" "uuid", "provider" "uuid", "only_mine" boolean DEFAULT true, "limit_n" integer DEFAULT 10) RETURNS TABLE("patient_id" "uuid", "display_name" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
 has_full boolean; has_disp boolean; has_name boolean;
 has_first boolean; has_last boolean; has_given boolean; has_family boolean;
 expr text; filter_panel text := ''; role_all boolean; sql text;
begin
 if not public.is_member_of(org) then
   raise exception 'forbidden' using errcode='42501';
 end if;


 select exists(select 1 from information_schema.columns where table_schema='public' and table_name='patients' and column_name='full_name')   into has_full;
 select exists(select 1 from information_schema.columns where table_schema='public' and table_name='patients' and column_name='display_name') into has_disp;
 select exists(select 1 from information_schema.columns where table_schema='public' and table_name='patients' and column_name='name')        into has_name;
 select exists(select 1 from information_schema.columns where table_schema='public' and table_name='patients' and column_name='first_name')  into has_first;
 select exists(select 1 from information_schema.columns where table_schema='public' and table_name='patients' and column_name='last_name')   into has_last;
 select exists(select 1 from information_schema.columns where table_schema='public' and table_name='patients' and column_name='given_name')  into has_given;
 select exists(select 1 from information_schema.columns where table_schema='public' and table_name='patients' and column_name='family_name') into has_family;


 expr := 'coalesce(' ||
    array_to_string(ARRAY[
      (case when has_full then 'p.full_name' else null end),
      (case when has_disp then 'p.display_name' else null end),
      (case when has_name then 'p.name' else null end),
      (case when has_first and has_last then '(p.first_name||'' ''||p.last_name)' else null end),
      (case when has_given and has_family then '(p.given_name||'' ''||p.family_name)' else null end),
      ''''''                               -- fallback final: cadena vacía
    ], ',') || ')';




 role_all := public.has_role(array['owner','admin']);


 if only_mine and not role_all then
   filter_panel := ' join public.patient_panels panel on panel.org_id = p.org_id and panel.patient_id = p.id and panel.provider_id = '||quote_literal(provider)||' and panel.active ';
 end if;


 sql := '
   select p.id as patient_id,
          '||expr||' as display_name
   from public.patients p '|| filter_panel ||'
   where p.org_id = '||quote_literal(org)||'
     and (
       public.immutable_unaccent(lower('||expr||')) like ''%'' || public.immutable_unaccent(lower('||quote_literal(q)||')) || ''%''
       or '||expr||' ilike ''%'' || '||quote_literal(q)||' || ''%''
     )
   order by similarity(public.immutable_unaccent(lower('||expr||')), public.immutable_unaccent(lower('||quote_literal(q)||'))) desc,
            '||expr||' asc
   limit '||limit_n||';
 ';


 return query execute sql;
end$$;


ALTER FUNCTION "public"."patients_suggest"("q" "text", "org" "uuid", "provider" "uuid", "only_mine" boolean, "limit_n" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."patients_with_label_search"("p_org_id" "uuid", "p_label" "text", "p_limit" integer DEFAULT 50, "p_offset" integer DEFAULT 0) RETURNS TABLE("id" "uuid", "name" "text", "gender" "text", "dob" "date", "created_at" timestamp with time zone, "total" bigint)
    LANGUAGE "sql" STABLE
    AS $$
  with j as (
    select vp.id, vp.name, vp.gender, vp.dob, vp.created_at
    from public.v_patients vp
    join public.patient_labels pl
      on pl.org_id = vp.org_id
     and pl.patient_id = vp.id
    where vp.org_id = p_org_id
      and pl.label = p_label
  ),
  counted as (
    select j.*, count(*) over() as total
    from j
    order by coalesce(j.name,'') asc, j.id asc
    limit greatest(p_limit,0)
    offset greatest(p_offset,0)
  )
  select id, name, gender, dob, created_at, total from counted;
$$;


ALTER FUNCTION "public"."patients_with_label_search"("p_org_id" "uuid", "p_label" "text", "p_limit" integer, "p_offset" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."recalc_quote_total"("p_quote_id" "uuid") RETURNS "void"
    LANGUAGE "sql"
    AS $$
  update public.sonrisa_quotes q
     set total_cents = coalesce((
       select sum(qty * unit_price_cents)::bigint
       from public.sonrisa_quote_items i
       where i.quote_id = q.id
     ), 0)
   where q.id = p_quote_id;
$$;


ALTER FUNCTION "public"."recalc_quote_total"("p_quote_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."recalc_quote_total_trg"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  perform public.recalc_quote_total( coalesce(new.quote_id, old.quote_id) );
  return coalesce(new, old);
end$$;


ALTER FUNCTION "public"."recalc_quote_total_trg"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."reminders_logs_search"("p_org_id" "uuid", "p_q" "text" DEFAULT NULL::"text", "p_status" "text"[] DEFAULT NULL::"text"[], "p_channel" "text"[] DEFAULT NULL::"text"[], "p_date_field" "text" DEFAULT 'created'::"text", "p_from" "date" DEFAULT NULL::"date", "p_to" "date" DEFAULT NULL::"date", "p_limit" integer DEFAULT 50, "p_offset" integer DEFAULT 0) RETURNS TABLE("id" "uuid", "patient_id" "uuid", "channel" "text", "status" "text", "target" "text", "template" "text", "created_at" timestamp with time zone, "last_attempt_at" timestamp with time zone, "attempts" integer, "total" bigint)
    LANGUAGE "sql" STABLE
    AS $$
  with base as (
    select *
    from public.v_reminders_logs
    where org_id = p_org_id
      and (p_q is null or (coalesce(target,'') ilike '%'||p_q||'%' or coalesce(template,'') ilike '%'||p_q||'%'))
      and (p_status is null or status = any(p_status))
      and (p_channel is null or channel = any(p_channel))
      and (
            p_from is null or
            case when lower(p_date_field) = 'lastattempt' then (last_attempt_at::date >= p_from)
                 else (created_at::date >= p_from)
            end
          )
      and (
            p_to is null or
            case when lower(p_date_field) = 'lastattempt' then (last_attempt_at::date <= p_to)
                 else (created_at::date <= p_to)
            end
          )
  ),
  counted as (
    select b.*, count(*) over() as total
    from base b
    order by coalesce(last_attempt_at, created_at) desc, id desc
    limit greatest(p_limit,0)
    offset greatest(p_offset,0)
  )
  select id, patient_id, channel, status, target, template, created_at, last_attempt_at, attempts, total
  from counted;
$$;


ALTER FUNCTION "public"."reminders_logs_search"("p_org_id" "uuid", "p_q" "text", "p_status" "text"[], "p_channel" "text"[], "p_date_field" "text", "p_from" "date", "p_to" "date", "p_limit" integer, "p_offset" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."revoke_document"("p_doc_type" "text", "p_doc_id" "uuid", "p_reason" "text" DEFAULT NULL::"text") RETURNS "public"."document_ledger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
declare v_row public.document_ledger;
begin
  update public.document_ledger
     set revoked_at = now(), revoked_by = auth.uid(), revoke_reason = p_reason
   where doc_type = p_doc_type and doc_id = p_doc_id
  returning * into v_row;

  if not found then
    raise exception 'No existe ledger para %:%', p_doc_type, p_doc_id;
  end if;
  return v_row;
end $$;


ALTER FUNCTION "public"."revoke_document"("p_doc_type" "text", "p_doc_id" "uuid", "p_reason" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."role_at_least"("org" "uuid", "min_role" "text") RETURNS boolean
    LANGUAGE "sql" STABLE
    AS $$
  select public.role_rank(coalesce(
    (select role from public.org_members where org_id = org and user_id = auth.uid()),
    'viewer'
  )) >= public.role_rank(min_role);
$$;


ALTER FUNCTION "public"."role_at_least"("org" "uuid", "min_role" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."role_at_least"("actual" "public"."org_role", "min_required" "public"."org_role") RETURNS boolean
    LANGUAGE "sql" IMMUTABLE
    AS $$
  select case min_required
    when 'owner'  then actual = 'owner'
    when 'admin'  then actual in ('owner','admin')
    when 'member' then actual in ('owner','admin','member')
    else true -- 'external'
  end;
$$;


ALTER FUNCTION "public"."role_at_least"("actual" "public"."org_role", "min_required" "public"."org_role") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."role_rank"("role" "text") RETURNS integer
    LANGUAGE "sql" IMMUTABLE
    AS $_$
  select case lower($1)
    when 'owner'  then 4
    when 'admin'  then 3
    when 'editor' then 2
    when 'viewer' then 1
    else 0 end
$_$;


ALTER FUNCTION "public"."role_rank"("role" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."search_all"("q" "text") RETURNS TABLE("patient_id" "uuid")
    LANGUAGE "sql" STABLE
    AS $$
  select distinct p.id as patient_id
  from public.patients p
  where (p.full_name ilike '%'||q||'%'
     or  p.email ilike '%'||q||'%')
$$;


ALTER FUNCTION "public"."search_all"("q" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."search_all"("q" "text", "p_org" "uuid" DEFAULT NULL::"uuid", "p_limit" integer DEFAULT 20, "p_offset" integer DEFAULT 0) RETURNS TABLE("kind" "text", "id" "uuid", "patient_id" "uuid", "title" "text", "snippet" "text", "rank" double precision)
    LANGUAGE "sql" STABLE
    AS $$
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


ALTER FUNCTION "public"."search_all"("q" "text", "p_org" "uuid", "p_limit" integer, "p_offset" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."search_all_plus"("payload" "jsonb") RETURNS TABLE("patient_id" "uuid")
    LANGUAGE "sql" STABLE
    AS $$
  select distinct p.id as patient_id
  from public.patients p
  where coalesce(payload->>'q','') = '' or p.full_name ilike '%'||(payload->>'q')||'%'
$$;


ALTER FUNCTION "public"."search_all_plus"("payload" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."search_all_plus"("q" "text", "p_org" "uuid" DEFAULT NULL::"uuid", "p_patient_ids" "uuid"[] DEFAULT NULL::"uuid"[], "p_from" timestamp with time zone DEFAULT NULL::timestamp with time zone, "p_to" timestamp with time zone DEFAULT NULL::timestamp with time zone, "p_genero" "text" DEFAULT NULL::"text", "p_limit" integer DEFAULT 40, "p_offset" integer DEFAULT 0) RETURNS TABLE("kind" "text", "id" "uuid", "patient_id" "uuid", "title" "text", "snippet" "text", "rank" double precision, "created_at" timestamp with time zone)
    LANGUAGE "sql" STABLE
    AS $$
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


ALTER FUNCTION "public"."search_all_plus"("q" "text", "p_org" "uuid", "p_patient_ids" "uuid"[], "p_from" timestamp with time zone, "p_to" timestamp with time zone, "p_genero" "text", "p_limit" integer, "p_offset" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."search_notes_files"("p_org" "uuid", "p_query" double precision[], "p_limit" integer DEFAULT 20) RETURNS TABLE("kind" "text", "id" "uuid", "patient_id" "uuid", "ref" "uuid", "name" "text", "snippet" "text", "score" double precision)
    LANGUAGE "sql" STABLE
    AS $$
  with q as (select p_query::vector(1536) v)
  , n as (
    select
      'note'::text as kind,
      ne.id,
      ne.patient_id,
      ne.note_id as ref,
      null::text as name,
      left(ne.content, 240) as snippet,
      1 - (ne.embedding <=> (select v from q)) as score
    from public.note_embeddings ne
    where ne.org_id = p_org
  )
  , f as (
    select
      'file'::text as kind,
      fe.id,
      fe.patient_id,
      null::uuid as ref,
      fe.name as name,
      coalesce(left(fe.content, 240), fe.name) as snippet,
      1 - (fe.embedding <=> (select v from q)) as score
    from public.file_embeddings fe
    where fe.org_id = p_org
  )
  select kind, id, patient_id, ref, name, snippet, score from n
  union all
  select kind, id, patient_id, ref, name, snippet, score from f
  order by score desc
  limit greatest(1, coalesce(p_limit, 20));
$$;


ALTER FUNCTION "public"."search_notes_files"("p_org" "uuid", "p_query" double precision[], "p_limit" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."seed_bank_defaults"("p_org" "uuid") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
begin
  insert into public.bank_accounts (org_id, name, type)
  select p_org, x.name, x.type
  from (values ('Caja','cash'), ('BBVA','bank'), ('Stripe','processor')) as x(name,type)
  where not exists (select 1 from public.bank_accounts a where a.org_id=p_org and a.name=x.name);

  insert into public.bank_categories (org_id, name, kind)
  select p_org, x.name, x.kind
  from (values ('Consultas','income'), ('Laboratorio','income'), ('Suscripciones','expense'), ('Publicidad','expense')) as x(name,kind)
  where not exists (select 1 from public.bank_categories c where c.org_id=p_org and c.name=x.name);
end;
$$;


ALTER FUNCTION "public"."seed_bank_defaults"("p_org" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_org_on_insert"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare selected uuid;
begin
  select current_org_id into selected
  from public.user_prefs
  where user_id = auth.uid();

  if selected is null then
    selected := public.ensure_personal_org_for(auth.uid(), auth.jwt()->>'email');
  end if;

  if new.org_id is null then
    new.org_id := selected;
  end if;
  return new;
end $$;


ALTER FUNCTION "public"."set_org_on_insert"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_patient_defaults"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
begin
  if tg_op = 'INSERT' then
    if new.user_id is null then
      new.user_id := auth.uid();
    end if;
    -- Compatibilidad: si no mandan full_name, usar nombre
    if new.full_name is null and new.nombre is not null then
      new.full_name := new.nombre;
    end if;
    new.updated_at := now();
    return new;

  elsif tg_op = 'UPDATE' then
    if new.full_name is null and new.nombre is not null then
      new.full_name := new.nombre;
    end if;
    new.updated_at := now();
    return new;
  end if;

  return new;
end;
$$;


ALTER FUNCTION "public"."set_patient_defaults"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_patient_file_defaults"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
begin
  if new.user_id is null then
    new.user_id := auth.uid();
  end if;
  return new;
end;
$$;


ALTER FUNCTION "public"."set_patient_file_defaults"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_patient_note_defaults"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
begin
  if tg_op = 'INSERT' then
    if new.user_id is null then
      new.user_id := auth.uid();
    end if;
    new.updated_at := now();
    return new;
  elsif tg_op = 'UPDATE' then
    new.updated_at := now();
    return new;
  end if;
  return new;
end;
$$;


ALTER FUNCTION "public"."set_patient_note_defaults"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.updated_at = now();
  return new;
end $$;


ALTER FUNCTION "public"."set_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."touch_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
 begin
   new.updated_at := now();
 exception when undefined_column then
   null;
 end;
 return new;
end$$;


ALTER FUNCTION "public"."touch_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trg_after_lab_result"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  update public.lab_requests
     set status = 'uploaded'
   where id = NEW.request_id
     and status in ('requested','awaiting_upload');

  -- work item: "Revisar resultado de laboratorio"
  insert into public.work_items(org_id, patient_id, appointment_id, title, status, due_at)
  select r.org_id, r.patient_id, null, 'Revisar resultado de laboratorio', 'open',
         now() + interval '24 hours'
  from public.lab_requests r
  where r.id = NEW.request_id;
  return NEW;
end;
$$;


ALTER FUNCTION "public"."trg_after_lab_result"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trg_audit_files_del"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
begin
  perform public.log_audit(old.patient_id, 'patient_files', old.id, 'delete', jsonb_build_object('old', to_jsonb(old)));
  return old;
end; $$;


ALTER FUNCTION "public"."trg_audit_files_del"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trg_audit_files_ins"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
begin
  perform public.log_audit(new.patient_id, 'patient_files', new.id, 'create', jsonb_build_object('new', to_jsonb(new)));
  return new;
end; $$;


ALTER FUNCTION "public"."trg_audit_files_ins"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trg_audit_files_upd"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
begin
  perform public.log_audit(new.patient_id, 'patient_files', new.id, 'update',
    jsonb_build_object('old', to_jsonb(old), 'new', to_jsonb(new)));
  return new;
end; $$;


ALTER FUNCTION "public"."trg_audit_files_upd"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trg_audit_notes_del"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
begin
  perform public.log_audit(old.patient_id, 'patient_notes', old.id, 'delete', jsonb_build_object('old', to_jsonb(old)));
  return old;
end; $$;


ALTER FUNCTION "public"."trg_audit_notes_del"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trg_audit_notes_ins"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
begin
  perform public.log_audit(new.patient_id, 'patient_notes', new.id, 'create', jsonb_build_object('new', to_jsonb(new)));
  return new;
end; $$;


ALTER FUNCTION "public"."trg_audit_notes_ins"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trg_audit_notes_upd"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  if (old.deleted_at is null and new.deleted_at is not null) then
    perform public.log_audit('note','soft_delete', new.id, jsonb_build_object('patient_id', new.patient_id, 'titulo', new.titulo));
  elsif (old.deleted_at is not null and new.deleted_at is null) then
    perform public.log_audit('note','restore', new.id, jsonb_build_object('patient_id', new.patient_id, 'titulo', new.titulo));
  else
    perform public.log_audit('note','update', new.id, jsonb_build_object('patient_id', new.patient_id, 'titulo', new.titulo));
  end if;
  return new;
end; $$;


ALTER FUNCTION "public"."trg_audit_notes_upd"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trg_audit_patients_del"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
begin
  perform public.log_audit(old.id, 'patients', old.id, 'delete', jsonb_build_object('old', to_jsonb(old)));
  return old;
end; $$;


ALTER FUNCTION "public"."trg_audit_patients_del"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trg_audit_patients_ins"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
begin
  perform public.log_audit(new.id, 'patients', new.id, 'create', jsonb_build_object('new', to_jsonb(new)));
  return new;
end; $$;


ALTER FUNCTION "public"."trg_audit_patients_ins"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trg_audit_patients_upd"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  if (old.deleted_at is null and new.deleted_at is not null) then
    perform public.log_audit('patient','soft_delete', new.id, jsonb_build_object('patient_id', new.id, 'nombre', new.nombre));
  elsif (old.deleted_at is not null and new.deleted_at is null) then
    perform public.log_audit('patient','restore', new.id, jsonb_build_object('patient_id', new.id, 'nombre', new.nombre));
  else
    perform public.log_audit('patient','update', new.id, jsonb_build_object('patient_id', new.id, 'nombre', new.nombre));
  end if;
  return new;
end; $$;


ALTER FUNCTION "public"."trg_audit_patients_upd"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trg_generate_work_after_appt"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
begin
  perform public.generate_work_for_appointment(NEW.id);
  return NEW;
end;
$$;


ALTER FUNCTION "public"."trg_generate_work_after_appt"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trg_ps_set_owner_id"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  if new.owner_id is null then
    select user_id into new.owner_id from public.patients where id = new.patient_id;
  end if;
  return new;
end;
$$;


ALTER FUNCTION "public"."trg_ps_set_owner_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trg_ps_sync_emails"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
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
end;
$$;


ALTER FUNCTION "public"."trg_ps_sync_emails"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trg_workitem_closed_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  if (TG_OP = 'UPDATE') then
    if NEW.status = 'done' and (OLD.status is distinct from 'done') then
      NEW.closed_at := now();
    elsif NEW.status = 'open' and OLD.status = 'done' then
      NEW.closed_at := null;
    end if;
  end if;
  return NEW;
end;
$$;


ALTER FUNCTION "public"."trg_workitem_closed_at"() OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."patient_notes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "patient_id" "uuid" NOT NULL,
    "content" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "org_id" "uuid",
    "titulo" "text",
    "contenido" "text",
    "deleted_at" timestamp with time zone,
    "search" "tsvector" GENERATED ALWAYS AS ("to_tsvector"('"spanish"'::"regconfig", ((COALESCE("titulo", ''::"text") || ' '::"text") || COALESCE("contenido", ''::"text")))) STORED,
    CONSTRAINT "patient_notes_content_check" CHECK (("char_length"("btrim"("content")) >= 2))
);

ALTER TABLE ONLY "public"."patient_notes" REPLICA IDENTITY FULL;


ALTER TABLE "public"."patient_notes" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_note_with_reason"("p_note_id" "uuid", "p_titulo" "text", "p_contenido" "text", "p_reason" "text") RETURNS "public"."patient_notes"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'extensions'
    AS $$
declare
  v_prev public.patient_notes;
  v_actor uuid := null;
  v_row public.patient_notes;
begin
  -- Solo permitir si la nota pertenece al usuario que llama (mismo modelo RLS)
  select * into v_prev
  from public.patient_notes
  where id = p_note_id
  for update;

  if not found then
    raise exception 'Nota no encontrada' using errcode = 'P0002';
  end if;

  if v_prev.user_id <> auth.uid() then
    raise exception 'No autorizado' using errcode = '42501';
  end if;

  update public.patient_notes
     set titulo = coalesce(p_titulo, titulo),
         contenido = coalesce(p_contenido, contenido)
   where id = p_note_id
   returning * into v_row;

  -- actor (si hay sesión)
  begin v_actor := auth.uid(); exception when others then v_actor := null; end;

  insert into public.patient_notes_audit(note_id, action, reason, actor, diff)
  values (
    p_note_id,
    'update',
    p_reason,
    v_actor,
    jsonb_build_object(
      'before', jsonb_build_object('titulo', v_prev.titulo, 'contenido', v_prev.contenido),
      'after',  jsonb_build_object('titulo', v_row.titulo, 'contenido', v_row.contenido)
    )
  );

  return v_row;
end
$$;


ALTER FUNCTION "public"."update_note_with_reason"("p_note_id" "uuid", "p_titulo" "text", "p_contenido" "text", "p_reason" "text") OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."agenda_alert_log" (
    "id" bigint NOT NULL,
    "schedule_id" "uuid" NOT NULL,
    "org_id" "uuid" NOT NULL,
    "key" "text" NOT NULL,
    "date_key" "date" NOT NULL,
    "sent_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."agenda_alert_log" OWNER TO "postgres";


ALTER TABLE "public"."agenda_alert_log" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."agenda_alert_log_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."agreements" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid",
    "subject_id" "uuid",
    "subject_type" "text" NOT NULL,
    "contract_type" "text" NOT NULL,
    "version" "text" DEFAULT '1.0.0'::"text" NOT NULL,
    "accepted_by" "text",
    "accepted_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "agreements_accepted_by_check" CHECK (("accepted_by" = ANY (ARRAY['patient'::"text", 'specialist'::"text", 'platform'::"text"]))),
    CONSTRAINT "agreements_contract_type_check" CHECK (("contract_type" = ANY (ARRAY['specialist_patient'::"text", 'specialist_platform'::"text", 'patient_platform'::"text"]))),
    CONSTRAINT "agreements_subject_type_check" CHECK (("subject_type" = ANY (ARRAY['patient'::"text", 'specialist'::"text"])))
);


ALTER TABLE "public"."agreements" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."agreements_acceptances" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "specialist_id" "uuid",
    "patient_id" "uuid",
    "contract_type" "public"."agreement_type" NOT NULL,
    "template_id" "uuid" NOT NULL,
    "template_version" integer NOT NULL,
    "status" "public"."agreement_status" DEFAULT 'pending'::"public"."agreement_status" NOT NULL,
    "token" "text",
    "token_expires_at" timestamp with time zone,
    "accepted_at" timestamp with time zone,
    "accepted_by" "uuid",
    "accepted_role" "public"."agreement_role",
    "name_snapshot" "jsonb",
    "ip_addr" "text",
    "user_agent" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."agreements_acceptances" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."agreements_accepted_unique" AS
 SELECT "id",
    "org_id",
    "specialist_id",
    "patient_id",
    "contract_type",
    "template_id",
    "template_version",
    "status",
    "token",
    "token_expires_at",
    "accepted_at",
    "accepted_by",
    "accepted_role",
    "name_snapshot",
    "ip_addr",
    "user_agent",
    "created_by",
    "created_at",
    "updated_at"
   FROM "public"."agreements_acceptances"
  WHERE ("status" = 'accepted'::"public"."agreement_status");


ALTER VIEW "public"."agreements_accepted_unique" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."agreements_templates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "type" "public"."agreement_type" NOT NULL,
    "version" integer DEFAULT 1 NOT NULL,
    "locale" "text" DEFAULT 'es-MX'::"text" NOT NULL,
    "title" "text" NOT NULL,
    "body" "text" NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."agreements_templates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."appointments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "patient_id" "uuid" NOT NULL,
    "provider_id" "uuid",
    "cal_event_id" "text",
    "start_at" timestamp with time zone NOT NULL,
    "end_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "title" "text",
    "notes" "text",
    "location" "text"
);


ALTER TABLE "public"."appointments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."appointments_events" (
    "id" bigint NOT NULL,
    "org_id" "uuid",
    "appointment_id" "uuid",
    "channel" "text",
    "address" "text",
    "event" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "meta" "jsonb"
);


ALTER TABLE "public"."appointments_events" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."appointments_events_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."appointments_events_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."appointments_events_id_seq" OWNED BY "public"."appointments_events"."id";



CREATE TABLE IF NOT EXISTS "public"."audit_entries" (
    "id" bigint NOT NULL,
    "entity" "text" NOT NULL,
    "action" "text" NOT NULL,
    "entity_id" "uuid",
    "payload" "jsonb",
    "actor" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "audit_entries_action_check" CHECK (("action" = ANY (ARRAY['create'::"text", 'update'::"text", 'delete'::"text", 'share'::"text", 'unshare'::"text", 'soft_delete'::"text", 'restore'::"text"])))
);


ALTER TABLE "public"."audit_entries" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."audit_entries_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."audit_entries_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."audit_entries_id_seq" OWNED BY "public"."audit_entries"."id";



CREATE TABLE IF NOT EXISTS "public"."audit_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "patient_id" "uuid" NOT NULL,
    "actor_id" "uuid",
    "actor_email" "text",
    "entity" "text" NOT NULL,
    "entity_id" "uuid" NOT NULL,
    "action" "text" NOT NULL,
    "data" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "org_id" "uuid",
    "table_name" "text" DEFAULT ''::"text" NOT NULL,
    "row_id" "uuid",
    "old_data" "jsonb",
    "new_data" "jsonb",
    "actor" "uuid",
    "at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."audit_log" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."bank_accounts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "type" "text" NOT NULL,
    "currency" "text" DEFAULT 'mxn'::"text" NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "bank_accounts_type_check" CHECK (("type" = ANY (ARRAY['cash'::"text", 'bank'::"text", 'processor'::"text"])))
);


ALTER TABLE "public"."bank_accounts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."bank_budgets" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "category_id" "uuid" NOT NULL,
    "month" "date" NOT NULL,
    "amount_cents" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."bank_budgets" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."bank_categories" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "kind" "text" NOT NULL,
    "parent_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "bank_categories_kind_check" CHECK (("kind" = ANY (ARRAY['income'::"text", 'expense'::"text"])))
);


ALTER TABLE "public"."bank_categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."bank_rules" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "if_text_like" "text" NOT NULL,
    "set_category_id" "uuid",
    "set_tags" "text"[],
    "priority" integer DEFAULT 100 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."bank_rules" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."bank_tx" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "account_id" "uuid" NOT NULL,
    "date" "date" NOT NULL,
    "amount_cents" bigint NOT NULL,
    "currency" "text" DEFAULT 'mxn'::"text" NOT NULL,
    "category_id" "uuid",
    "memo" "text",
    "method" "text",
    "tags" "text"[],
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "reconciled_at" timestamp with time zone,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "bank_tx_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'cleared'::"text"])))
);


ALTER TABLE "public"."bank_tx" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."cal_bookings_raw" (
    "cal_uid" "text" NOT NULL,
    "trigger_event" "text" NOT NULL,
    "status" "text",
    "start" timestamp with time zone,
    "end" timestamp with time zone,
    "attendee_email" "text",
    "attendee_name" "text",
    "payload" "jsonb" NOT NULL,
    "inserted_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."cal_bookings_raw" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."cal_webhooks" (
    "id" "text" NOT NULL,
    "org_id" "uuid",
    "raw" "jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."cal_webhooks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."concept_dictionary" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "canonical" "text" NOT NULL,
    "canonical_norm" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."concept_dictionary" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."contacts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid",
    "patient_id" "uuid",
    "channel" "text" NOT NULL,
    "address" "text" NOT NULL,
    "consent" boolean DEFAULT true NOT NULL,
    "label" "text",
    "created_by" "uuid" DEFAULT "auth"."uid"(),
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "contacts_channel_check" CHECK (("channel" = ANY (ARRAY['sms'::"text", 'whatsapp'::"text"])))
);


ALTER TABLE "public"."contacts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."dental_budget_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "budget_id" "uuid" NOT NULL,
    "description" "text" NOT NULL,
    "qty" integer DEFAULT 1 NOT NULL,
    "unit_price" numeric(12,2) DEFAULT 0 NOT NULL,
    "line_total" numeric(12,2) DEFAULT 0 NOT NULL
);


ALTER TABLE "public"."dental_budget_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."dental_budgets" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "patient_id" "uuid" NOT NULL,
    "org_id" "uuid",
    "title" "text",
    "total" numeric(12,2) DEFAULT 0,
    "created_by" "uuid" DEFAULT "auth"."uid"(),
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."dental_budgets" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."dental_charts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "patient_id" "uuid" NOT NULL,
    "chart" "jsonb" NOT NULL,
    "note" "text",
    "created_by" "uuid" DEFAULT "auth"."uid"(),
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."dental_charts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."discharge_templates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "doctor_id" "uuid",
    "name" "text" NOT NULL,
    "body" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."discharge_templates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."discharges" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "patient_id" "uuid" NOT NULL,
    "doctor_id" "uuid" NOT NULL,
    "admission_at" timestamp with time zone,
    "discharge_at" timestamp with time zone,
    "diagnosis" "text",
    "summary" "text",
    "recommendations" "text",
    "follow_up_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."discharges" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."doc_folios" (
    "org_id" "uuid" NOT NULL,
    "doc_type" "text" NOT NULL,
    "year_month" "text" NOT NULL,
    "last_number" integer DEFAULT 0 NOT NULL
);


ALTER TABLE "public"."doc_folios" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."doctor_letterheads" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "doctor_id" "uuid" NOT NULL,
    "display_name" "text" NOT NULL,
    "credentials" "text",
    "clinic_info" "text",
    "logo_url" "text",
    "signature_url" "text",
    "footer_disclaimer" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."doctor_letterheads" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."document_folio_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."document_folio_seq" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."drug_condition_alerts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "ingredient_id" "uuid" NOT NULL,
    "condition_concept_id" "uuid" NOT NULL,
    "severity" "text" NOT NULL,
    "note" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "drug_condition_alerts_severity_check" CHECK (("severity" = ANY (ARRAY['contraindicated'::"text", 'major'::"text", 'moderate'::"text", 'minor'::"text"])))
);


ALTER TABLE "public"."drug_condition_alerts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."drug_dictionary" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "kind" "text" NOT NULL,
    "name" "text" NOT NULL,
    "name_norm" "text" NOT NULL,
    "synonyms" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "drug_dictionary_kind_check" CHECK (("kind" = ANY (ARRAY['ingredient'::"text", 'product'::"text", 'class'::"text"])))
);


ALTER TABLE "public"."drug_dictionary" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."drug_interactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "a_ingredient" "uuid" NOT NULL,
    "b_ingredient" "uuid" NOT NULL,
    "severity" "text" NOT NULL,
    "note" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "drug_interactions_severity_check" CHECK (("severity" = ANY (ARRAY['contraindicated'::"text", 'major'::"text", 'moderate'::"text", 'minor'::"text"])))
);


ALTER TABLE "public"."drug_interactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."equilibrio_checkins" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "patient_id" "uuid" NOT NULL,
    "plan_id" "uuid" NOT NULL,
    "item_id" "uuid" NOT NULL,
    "day" "date" NOT NULL,
    "status" "text" NOT NULL,
    "note" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "equilibrio_checkins_status_check" CHECK (("status" = ANY (ARRAY['done'::"text", 'skipped'::"text"])))
);


ALTER TABLE "public"."equilibrio_checkins" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."equilibrio_plan_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "plan_id" "uuid" NOT NULL,
    "library_id" "uuid" NOT NULL,
    "goal" "text",
    "notes" "text",
    "mon" boolean DEFAULT false NOT NULL,
    "tue" boolean DEFAULT false NOT NULL,
    "wed" boolean DEFAULT false NOT NULL,
    "thu" boolean DEFAULT false NOT NULL,
    "fri" boolean DEFAULT false NOT NULL,
    "sat" boolean DEFAULT false NOT NULL,
    "sun" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."equilibrio_plan_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."equilibrio_plans" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "patient_id" "uuid" NOT NULL,
    "starts_on" "date" NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."equilibrio_plans" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."equilibrio_task_library" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "module" "text" DEFAULT 'equilibrio'::"text" NOT NULL,
    "kind" "text" DEFAULT 'custom'::"text" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "default_goal" "text",
    "active" boolean DEFAULT true NOT NULL,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."equilibrio_task_library" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."exercise_plans" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "patient_id" "uuid" NOT NULL,
    "org_id" "uuid",
    "title" "text",
    "plan" "jsonb" DEFAULT "jsonb_build_object"('items', "jsonb_build_array"()) NOT NULL,
    "created_by" "uuid" DEFAULT "auth"."uid"(),
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."exercise_plans" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."export_templates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "owner_id" "uuid" NOT NULL,
    "org_id" "uuid",
    "name" "text" NOT NULL,
    "cover_title" "text" NOT NULL,
    "cover_subtitle" "text",
    "logo_url" "text",
    "brand_hex" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "export_templates_brand_hex_check" CHECK (("brand_hex" ~* '^#?[0-9a-f]{6}$'::"text"))
);


ALTER TABLE "public"."export_templates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."features" (
    "id" "text" NOT NULL,
    "module_id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text"
);


ALTER TABLE "public"."features" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."file_embeddings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "patient_id" "uuid" NOT NULL,
    "path" "text" NOT NULL,
    "name" "text" NOT NULL,
    "content" "text",
    "embedding" "public"."vector"(1536),
    "provider" "text",
    "model" "text",
    "dim" smallint,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."file_embeddings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."form_responses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "patient_id" "uuid" NOT NULL,
    "template_id" "uuid" NOT NULL,
    "answers" "jsonb" NOT NULL,
    "submitted_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "org_id" "uuid"
);


ALTER TABLE "public"."form_responses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."form_templates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "specialty" "text" NOT NULL,
    "version" integer DEFAULT 1 NOT NULL,
    "schema" "jsonb" NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."form_templates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."jotform_webhooks" (
    "id" "text" NOT NULL,
    "org_id" "uuid",
    "raw" "jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."jotform_webhooks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."lab_request_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "request_id" "uuid" NOT NULL,
    "test_code" "text",
    "test_name" "text" NOT NULL,
    "notes" "text"
);


ALTER TABLE "public"."lab_request_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."lab_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "patient_id" "uuid" NOT NULL,
    "requested_by" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "instructions" "text",
    "status" "public"."lab_status" DEFAULT 'requested'::"public"."lab_status" NOT NULL,
    "due_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."lab_requests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."lab_results" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "request_id" "uuid" NOT NULL,
    "patient_id" "uuid" NOT NULL,
    "file_path" "text" NOT NULL,
    "file_name" "text" NOT NULL,
    "mime_type" "text",
    "size_bytes" bigint,
    "uploaded_by_user_id" "uuid",
    "uploaded_via_token" boolean DEFAULT false NOT NULL,
    "notes" "text",
    "parsed" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "reviewed_by" "uuid",
    "reviewed_at" timestamp with time zone
);


ALTER TABLE "public"."lab_results" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."lab_test_templates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid",
    "created_by" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "notes" "text",
    "items" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."lab_test_templates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."lab_upload_tokens" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "request_id" "uuid" NOT NULL,
    "token" "text" NOT NULL,
    "expires_at" timestamp with time zone NOT NULL,
    "used_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."lab_upload_tokens" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."mente_assessments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "patient_id" "uuid" NOT NULL,
    "tool" "text" NOT NULL,
    "answers_json" "jsonb" NOT NULL,
    "score_total" integer NOT NULL,
    "score_breakdown" "jsonb" NOT NULL,
    "risk_band" "text" NOT NULL,
    "issued_at" timestamp with time zone,
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "mente_assessments_risk_band_check" CHECK (("risk_band" = ANY (ARRAY['low'::"text", 'med'::"text", 'high'::"text"]))),
    CONSTRAINT "mente_assessments_tool_check" CHECK (("tool" = ANY (ARRAY['phq9'::"text", 'gad7'::"text", 'auditc'::"text"])))
);


ALTER TABLE "public"."mente_assessments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."mente_sessions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "patient_id" "uuid" NOT NULL,
    "note_json" "jsonb" NOT NULL,
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "signed_by" "uuid",
    "signed_at" timestamp with time zone
);


ALTER TABLE "public"."mente_sessions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."modules" (
    "id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "route" "text",
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."modules" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."note_embeddings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "patient_id" "uuid" NOT NULL,
    "note_id" "uuid" NOT NULL,
    "content" "text" NOT NULL,
    "embedding" "public"."vector"(1536),
    "provider" "text",
    "model" "text",
    "dim" smallint,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."note_embeddings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."note_templates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "owner_id" "uuid" NOT NULL,
    "org_id" "uuid",
    "name" "text" NOT NULL,
    "body" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."note_templates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notify_inbound" (
    "id" bigint NOT NULL,
    "provider" "text" NOT NULL,
    "message_sid" "text",
    "from" "text",
    "to" "text",
    "body" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."notify_inbound" OWNER TO "postgres";


ALTER TABLE "public"."notify_inbound" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."notify_inbound_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."notify_status" (
    "id" bigint NOT NULL,
    "provider" "text" NOT NULL,
    "message_sid" "text",
    "status" "text",
    "error_code" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."notify_status" OWNER TO "postgres";


ALTER TABLE "public"."notify_status" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."notify_status_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."org_bank_settings" (
    "org_id" "uuid" NOT NULL,
    "low_balance_threshold_cents" integer DEFAULT 0 NOT NULL,
    "notify_channel" "text" DEFAULT 'whatsapp'::"text",
    "notify_to" "text",
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."org_bank_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."org_disclaimers" (
    "org_id" "uuid" NOT NULL,
    "kind" "text" NOT NULL,
    "text" "text" NOT NULL,
    CONSTRAINT "org_disclaimers_kind_check" CHECK (("kind" = ANY (ARRAY['general'::"text", 'labs'::"text", 'prescription'::"text", 'referral'::"text", 'discharge'::"text"])))
);


ALTER TABLE "public"."org_disclaimers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."org_features" (
    "org_id" "uuid" NOT NULL,
    "feature_id" "text" NOT NULL,
    "source" "text" DEFAULT 'plan'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "mente" boolean DEFAULT false NOT NULL,
    "pulso" boolean DEFAULT false NOT NULL,
    "sonrisa" boolean DEFAULT false NOT NULL,
    "equilibrio" boolean DEFAULT false NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."org_features" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."org_invoices" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "stripe_invoice_id" "text",
    "status" "text",
    "amount_due_cents" integer,
    "currency" "text" DEFAULT 'mxn'::"text",
    "hosted_invoice_url" "text",
    "invoice_pdf" "text",
    "period_start" timestamp with time zone,
    "period_end" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."org_invoices" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."org_ledger_transactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "amount_cents" integer NOT NULL,
    "currency" "text" DEFAULT 'mxn'::"text" NOT NULL,
    "type" "text" NOT NULL,
    "description" "text",
    "stripe_payment_intent_id" "text",
    "stripe_charge_id" "text",
    "stripe_invoice_id" "text",
    "meta" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    CONSTRAINT "org_ledger_transactions_type_check" CHECK (("type" = ANY (ARRAY['deposit'::"text", 'invoice'::"text", 'refund'::"text", 'payout'::"text", 'adjustment'::"text"])))
);


ALTER TABLE "public"."org_ledger_transactions" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."org_ledger_balances" AS
 SELECT "org_id",
    COALESCE("sum"("amount_cents"), (0)::bigint) AS "balance_cents"
   FROM "public"."org_ledger_transactions"
  GROUP BY "org_id";


ALTER VIEW "public"."org_ledger_balances" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."org_members" (
    "org_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "org_members_role_check" CHECK (("role" = ANY (ARRAY['owner'::"text", 'admin'::"text", 'editor'::"text", 'viewer'::"text"])))
);


ALTER TABLE "public"."org_members" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."org_subscriptions" (
    "org_id" "uuid" NOT NULL,
    "stripe_customer_id" "text",
    "stripe_status" "text",
    "current_period_end" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."org_subscriptions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."organization_members" (
    "org_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "organization_members_role_check" CHECK (("role" = ANY (ARRAY['owner'::"text", 'admin'::"text", 'member'::"text"])))
);


ALTER TABLE "public"."organization_members" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."organizations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "slug" "text",
    "is_personal" boolean DEFAULT false NOT NULL,
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "owner_user_id" "uuid"
);


ALTER TABLE "public"."organizations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."patient_appointments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "patient_id" "uuid" NOT NULL,
    "cal_uid" "text" NOT NULL,
    "title" "text",
    "start" timestamp with time zone NOT NULL,
    "end" timestamp with time zone NOT NULL,
    "meeting_url" "text",
    "status" "text",
    "metadata" "jsonb",
    "last_webhook_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."patient_appointments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."patient_conditions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "patient_id" "uuid" NOT NULL,
    "concept_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."patient_conditions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."patient_file_access_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "patient_id" "uuid" NOT NULL,
    "path" "text" NOT NULL,
    "action" "text" NOT NULL,
    "by_user" "uuid",
    "ip" "text",
    "user_agent" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "patient_file_access_log_action_check" CHECK (("action" = ANY (ARRAY['view'::"text", 'download'::"text", 'upload'::"text", 'delete'::"text"])))
);


ALTER TABLE "public"."patient_file_access_log" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."patient_file_versions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "patient_id" "uuid" NOT NULL,
    "group_key" "text" NOT NULL,
    "version" integer NOT NULL,
    "name" "text" NOT NULL,
    "path" "text" NOT NULL,
    "size_bytes" bigint DEFAULT 0 NOT NULL,
    "checksum_sha256" "text",
    "uploaded_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."patient_file_versions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."patient_files" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "patient_id" "uuid" NOT NULL,
    "bucket" "text" DEFAULT 'uploads'::"text" NOT NULL,
    "path" "text" NOT NULL,
    "file_name" "text" NOT NULL,
    "mime_type" "text",
    "size" bigint,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "org_id" "uuid"
);


ALTER TABLE "public"."patient_files" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."patient_labels" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "patient_id" "uuid" NOT NULL,
    "label" "text" NOT NULL,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "patient_labels_label_check" CHECK ((("char_length"("label") >= 1) AND ("char_length"("label") <= 40)))
);


ALTER TABLE "public"."patient_labels" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."patient_medications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "patient_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."patient_medications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."patient_note_versions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "note_id" "uuid" NOT NULL,
    "patient_id" "uuid" NOT NULL,
    "action" "text" NOT NULL,
    "edited_by" "uuid",
    "reason" "text",
    "before_titulo" "text",
    "after_titulo" "text",
    "before_contenido" "text",
    "after_contenido" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "patient_note_versions_action_check" CHECK (("action" = ANY (ARRAY['insert'::"text", 'update'::"text", 'delete'::"text"])))
);


ALTER TABLE "public"."patient_note_versions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."patient_notes_audit" (
    "id" bigint NOT NULL,
    "note_id" "uuid" NOT NULL,
    "action" "text" NOT NULL,
    "reason" "text",
    "actor" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "diff" "jsonb"
);


ALTER TABLE "public"."patient_notes_audit" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."patient_notes_audit_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."patient_notes_audit_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."patient_notes_audit_id_seq" OWNED BY "public"."patient_notes_audit"."id";



CREATE TABLE IF NOT EXISTS "public"."patient_panels" (
    "org_id" "uuid" NOT NULL,
    "provider_id" "uuid" NOT NULL,
    "patient_id" "uuid" NOT NULL,
    "active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."patient_panels" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."patient_permissions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "patient_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "can_read" boolean DEFAULT true NOT NULL,
    "can_edit_notes" boolean DEFAULT false NOT NULL,
    "can_manage_files" boolean DEFAULT false NOT NULL,
    "can_share" boolean DEFAULT false NOT NULL,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."patient_permissions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."patient_providers" (
    "org_id" "uuid" NOT NULL,
    "patient_id" "uuid" NOT NULL,
    "provider_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."patient_providers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."patient_share_access" (
    "id" bigint NOT NULL,
    "share_id" "uuid" NOT NULL,
    "ip" "text",
    "user_agent" "text",
    "at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."patient_share_access" OWNER TO "postgres";


ALTER TABLE "public"."patient_share_access" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."patient_share_access_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."patient_shares" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "owner_id" "uuid" NOT NULL,
    "patient_id" "uuid" NOT NULL,
    "grantee_email" "text",
    "can_edit" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "org_id" "uuid",
    "revoked_at" timestamp with time zone,
    "shared_with_user_id" "uuid",
    "shared_with_email" "text",
    "permission" "public"."permission_level" DEFAULT 'read'::"public"."permission_level" NOT NULL
);


ALTER TABLE "public"."patient_shares" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."patient_tags" (
    "patient_id" "uuid" NOT NULL,
    "tag_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."patient_tags" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."patient_task_templates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "module" "text" NOT NULL,
    "title" "text" NOT NULL,
    "content" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."patient_task_templates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."patient_tasks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "module" "text" NOT NULL,
    "patient_id" "uuid" NOT NULL,
    "template_id" "uuid",
    "title" "text" NOT NULL,
    "content" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "status" "text" DEFAULT 'assigned'::"text" NOT NULL,
    "due_date" "date",
    "assigned_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "patient_tasks_status_check" CHECK (("status" = ANY (ARRAY['assigned'::"text", 'in_progress'::"text", 'done'::"text"])))
);


ALTER TABLE "public"."patient_tasks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."patients" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "full_name" "text" NOT NULL,
    "email" "text",
    "phone" "text",
    "birthdate" "date",
    "sex" "text",
    "photo_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "nombre" "text",
    "edad" integer,
    "genero" "text",
    "org_id" "uuid",
    "deleted_at" timestamp with time zone,
    "search" "tsvector" GENERATED ALWAYS AS ("to_tsvector"('"spanish"'::"regconfig", COALESCE("nombre", ''::"text"))) STORED,
    CONSTRAINT "patients_edad_nonneg" CHECK ((("edad" IS NULL) OR ("edad" >= 0))),
    CONSTRAINT "patients_genero_enum" CHECK ((("genero" IS NULL) OR ("genero" = ANY (ARRAY['F'::"text", 'M'::"text", 'O'::"text"])))),
    CONSTRAINT "patients_sex_check" CHECK ((("sex" = ANY (ARRAY['M'::"text", 'F'::"text", 'O'::"text"])) OR ("sex" IS NULL)))
);

ALTER TABLE ONLY "public"."patients" REPLICA IDENTITY FULL;


ALTER TABLE "public"."patients" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."prescription_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "prescription_id" "uuid" NOT NULL,
    "drug" "text" NOT NULL,
    "dose" "text",
    "route" "text",
    "frequency" "text",
    "duration" "text",
    "instructions" "text"
);


ALTER TABLE "public"."prescription_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."prescription_templates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "doctor_id" "uuid",
    "specialty" "text",
    "name" "text" NOT NULL,
    "items" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "active" boolean DEFAULT true NOT NULL
);


ALTER TABLE "public"."prescription_templates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."prescriptions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "patient_id" "uuid" NOT NULL,
    "doctor_id" "uuid" NOT NULL,
    "diagnosis" "text",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "issued_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "signature_url" "text"
);


ALTER TABLE "public"."prescriptions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."pulso_measurements" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "patient_id" "uuid" NOT NULL,
    "type" "text" NOT NULL,
    "value" numeric(12,4) NOT NULL,
    "unit" "text",
    "measured_at" timestamp with time zone,
    "note" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."pulso_measurements" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."pulso_targets" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "patient_id" "uuid" NOT NULL,
    "type" "text" NOT NULL,
    "target_low" numeric(12,4),
    "target_high" numeric(12,4),
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."pulso_targets" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."referral_templates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "doctor_id" "uuid",
    "specialty" "text",
    "name" "text" NOT NULL,
    "body" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."referral_templates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."referrals" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "patient_id" "uuid" NOT NULL,
    "doctor_id" "uuid" NOT NULL,
    "to_specialty" "text",
    "to_doctor_name" "text",
    "reason" "text",
    "summary" "text",
    "plan" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."referrals" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."rehab_sessions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "patient_id" "uuid" NOT NULL,
    "date" timestamp with time zone DEFAULT "now"() NOT NULL,
    "soap" "jsonb" NOT NULL,
    "created_by" "uuid" DEFAULT "auth"."uid"(),
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."rehab_sessions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."reminder_logs" (
    "id" bigint NOT NULL,
    "reminder_id" "uuid" NOT NULL,
    "status" "text" NOT NULL,
    "provider" "text" DEFAULT 'twilio'::"text" NOT NULL,
    "provider_sid" "text",
    "error" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "meta" "jsonb",
    "org_id" "uuid",
    "external_id" "text",
    "payload" "jsonb",
    CONSTRAINT "reminder_logs_status_check" CHECK (("status" = ANY (ARRAY['queued'::"text", 'sent'::"text", 'delivered'::"text", 'failed'::"text", 'user_confirmed'::"text", 'user_cancelled'::"text", 'user_rebook'::"text"])))
);


ALTER TABLE "public"."reminder_logs" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."reminder_logs_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."reminder_logs_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."reminder_logs_id_seq" OWNED BY "public"."reminder_logs"."id";



CREATE TABLE IF NOT EXISTS "public"."reminder_prefs" (
    "org_id" "uuid" NOT NULL,
    "provider_id" "uuid" NOT NULL,
    "tz" "text" DEFAULT 'America/Mexico_City'::"text" NOT NULL,
    "window_start" "text" DEFAULT '09:00'::"text" NOT NULL,
    "window_end" "text" DEFAULT '20:00'::"text" NOT NULL,
    "days_of_week" integer[] DEFAULT '{1,2,3,4,5}'::integer[] NOT NULL,
    "channels_priority" "text"[] DEFAULT '{whatsapp,sms}'::"text"[] NOT NULL,
    "max_retries" integer DEFAULT 3 NOT NULL,
    "retry_backoff_min" integer DEFAULT 30 NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."reminder_prefs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."reminder_queue" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "patient_id" "uuid" NOT NULL,
    "provider_id" "uuid" NOT NULL,
    "assignment_id" "uuid",
    "channel" "text" NOT NULL,
    "template_slug" "text" NOT NULL,
    "payload" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "status" "text" DEFAULT 'scheduled'::"text" NOT NULL,
    "attempt_count" integer DEFAULT 0 NOT NULL,
    "next_attempt_at" timestamp with time zone,
    "sent_at" timestamp with time zone,
    "last_error" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "reminder_queue_channel_check" CHECK (("channel" = ANY (ARRAY['whatsapp'::"text", 'sms'::"text"]))),
    CONSTRAINT "reminder_queue_status_check" CHECK (("status" = ANY (ARRAY['scheduled'::"text", 'retrying'::"text", 'sent'::"text", 'failed'::"text", 'canceled'::"text"]))),
    CONSTRAINT "reminder_queue_template_slug_check" CHECK (("template_slug" = ANY (ARRAY['work_due'::"text", 'work_overdue'::"text"])))
);


ALTER TABLE "public"."reminder_queue" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."reminder_templates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid",
    "name" "text" NOT NULL,
    "channel" "text" NOT NULL,
    "body" "text" NOT NULL,
    "active" boolean DEFAULT true NOT NULL,
    "created_by" "uuid" DEFAULT "auth"."uid"(),
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "reminder_templates_channel_check" CHECK (("channel" = ANY (ARRAY['sms'::"text", 'whatsapp'::"text"])))
);


ALTER TABLE "public"."reminder_templates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."reminders" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "patient_id" "uuid",
    "contact_id" "uuid",
    "template_id" "uuid",
    "channel" "text" NOT NULL,
    "address" "text" NOT NULL,
    "payload" "jsonb" DEFAULT '{}'::"jsonb",
    "appointment_at" timestamp with time zone,
    "status" "text" DEFAULT 'queued'::"text" NOT NULL,
    "attempts" integer DEFAULT 0 NOT NULL,
    "max_attempts" integer DEFAULT 3 NOT NULL,
    "last_attempt_at" timestamp with time zone,
    "next_run_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid" DEFAULT "auth"."uid"(),
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "appointment_id" "uuid",
    "confirmed_at" timestamp with time zone,
    "cancelled_at" timestamp with time zone,
    "cancel_reason" "text",
    "last_inbound_message" "text",
    "to_addr" "text",
    "content" "text",
    "send_at" timestamp with time zone,
    "sent_at" timestamp with time zone,
    CONSTRAINT "reminders_channel_check" CHECK (("channel" = ANY (ARRAY['sms'::"text", 'whatsapp'::"text"]))),
    CONSTRAINT "reminders_status_check" CHECK (("status" = ANY (ARRAY['scheduled'::"text", 'sending'::"text", 'sent'::"text", 'failed'::"text", 'cancelled'::"text", 'retry'::"text", 'confirmed'::"text"])))
);


ALTER TABLE "public"."reminders" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."reminders_daily_stats" AS
 SELECT "org_id",
    ("date_trunc"('day'::"text", COALESCE("sent_at", "created_at")))::"date" AS "day",
    "count"(*) FILTER (WHERE ("status" = 'sent'::"text")) AS "sent",
    "count"(*) FILTER (WHERE ("status" = 'delivered'::"text")) AS "delivered",
    "count"(*) FILTER (WHERE ("status" = 'failed'::"text")) AS "failed",
    "count"(*) FILTER (WHERE ("status" = 'confirmed'::"text")) AS "confirmed",
    "count"(*) FILTER (WHERE ("status" = 'cancelled'::"text")) AS "cancelled",
    "count"(*) FILTER (WHERE ("status" = 'no_show'::"text")) AS "no_show"
   FROM "public"."reminders"
  GROUP BY "org_id", (("date_trunc"('day'::"text", COALESCE("sent_at", "created_at")))::"date");


ALTER VIEW "public"."reminders_daily_stats" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."reminders_logs_view" AS
 SELECT "id",
    "org_id",
    "assignment_id",
    "channel",
    "template_slug",
    "status",
    "attempt_count",
    "next_attempt_at",
    "sent_at",
    "last_error",
    "created_at",
    "payload"
   FROM "public"."reminder_queue";


ALTER VIEW "public"."reminders_logs_view" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."reminders_templates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "specialty" "text",
    "channel" "text" NOT NULL,
    "body" "text" NOT NULL,
    "variables" "text"[] DEFAULT ARRAY[]::"text"[] NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_by" "uuid",
    "updated_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "reminders_templates_channel_check" CHECK (("channel" = ANY (ARRAY['sms'::"text", 'whatsapp'::"text"])))
);


ALTER TABLE "public"."reminders_templates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."report_schedules" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "scope" "text" NOT NULL,
    "params" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "channel" "text" NOT NULL,
    "target" "text" NOT NULL,
    "schedule_kind" "text" NOT NULL,
    "dow" integer[],
    "at_hour" smallint DEFAULT 9 NOT NULL,
    "at_minute" smallint DEFAULT 0 NOT NULL,
    "tz" "text" DEFAULT 'America/Mexico_City'::"text" NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "last_sent_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "name" "text" NOT NULL,
    "report" "text" NOT NULL,
    "frequency" "text" NOT NULL,
    "last_run_at" timestamp with time zone,
    "created_by" "uuid",
    "updated_by" "uuid",
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "report_schedules_at_hour_check" CHECK ((("at_hour" >= 0) AND ("at_hour" <= 23))),
    CONSTRAINT "report_schedules_at_minute_check" CHECK ((("at_minute" >= 0) AND ("at_minute" <= 59))),
    CONSTRAINT "report_schedules_channel_check" CHECK (("channel" = ANY (ARRAY['email'::"text", 'whatsapp'::"text"]))),
    CONSTRAINT "report_schedules_frequency_check" CHECK (("frequency" = ANY (ARRAY['daily'::"text", 'weekly'::"text"]))),
    CONSTRAINT "report_schedules_schedule_kind_check" CHECK (("schedule_kind" = ANY (ARRAY['daily'::"text", 'weekly'::"text", 'monthly'::"text"]))),
    CONSTRAINT "report_schedules_scope_check" CHECK (("scope" = ANY (ARRAY['bank_flow'::"text", 'bank_pl'::"text"])))
);


ALTER TABLE "public"."report_schedules" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."saved_searches" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "owner_id" "uuid" NOT NULL,
    "org_id" "uuid",
    "name" "text" NOT NULL,
    "payload" "jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."saved_searches" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."saved_views" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "scope" "text" NOT NULL,
    "name" "text" NOT NULL,
    "filters" "jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."saved_views" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sonrisa_quote_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "quote_id" "uuid" NOT NULL,
    "treatment_id" "uuid",
    "description" "text" NOT NULL,
    "qty" integer NOT NULL,
    "unit_price_cents" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "sonrisa_quote_items_qty_check" CHECK (("qty" > 0)),
    CONSTRAINT "sonrisa_quote_items_unit_price_cents_check" CHECK (("unit_price_cents" >= 0))
);


ALTER TABLE "public"."sonrisa_quote_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sonrisa_quotes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "patient_id" "uuid" NOT NULL,
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "currency" "text" DEFAULT 'mxn'::"text" NOT NULL,
    "notes" "text",
    "total_cents" bigint DEFAULT 0 NOT NULL,
    "signed_by" "uuid",
    "signed_at" timestamp with time zone,
    "signature_data_url" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "sonrisa_quotes_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'sent'::"text", 'accepted'::"text", 'rejected'::"text", 'paid'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."sonrisa_quotes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sonrisa_treatments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "code" "text" NOT NULL,
    "name" "text" NOT NULL,
    "default_price_cents" bigint DEFAULT 0 NOT NULL,
    "active" boolean DEFAULT true NOT NULL,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."sonrisa_treatments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tag_permissions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "tag_id" "uuid" NOT NULL,
    "role" "text" NOT NULL,
    "can_read" boolean DEFAULT true NOT NULL,
    "can_write" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "tag_permissions_role_check" CHECK (("role" = ANY (ARRAY['admin'::"text", 'member'::"text", 'viewer'::"text"])))
);


ALTER TABLE "public"."tag_permissions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tags" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "owner_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "color" "text",
    "kind" "text" DEFAULT 'tag'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "org_id" "uuid"
);


ALTER TABLE "public"."tags" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_prefs" (
    "user_id" "uuid" NOT NULL,
    "current_org_id" "uuid",
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."user_prefs" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_my_orgs" AS
 SELECT "o"."id",
    "o"."name",
    "o"."slug",
    "o"."is_personal",
    "m"."role",
    "o"."created_at"
   FROM ("public"."org_members" "m"
     JOIN "public"."organizations" "o" ON (("o"."id" = "m"."org_id")))
  WHERE ("m"."user_id" = "auth"."uid"());


ALTER VIEW "public"."v_my_orgs" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_org_features" AS
 SELECT "org_id",
    "mente",
    "pulso",
    "sonrisa",
    "equilibrio",
    "updated_at"
   FROM "public"."org_features";


ALTER VIEW "public"."v_org_features" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_patient_share_access" AS
 SELECT "s"."id" AS "share_id",
    "s"."org_id",
    "s"."patient_id",
    NULL::"text" AS "token",
    "s"."created_at" AS "share_created_at",
    NULL::timestamp with time zone AS "expires_at",
    "s"."revoked_at",
    "a"."at" AS "access_at",
    "a"."ip",
    "a"."user_agent"
   FROM ("public"."patient_shares" "s"
     JOIN "public"."patient_share_access" "a" ON (("a"."share_id" = "s"."id")));


ALTER VIEW "public"."v_patient_share_access" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_patients" AS
 SELECT "id",
    "org_id",
    "full_name" AS "name",
    NULL::"text" AS "gender",
    NULL::"date" AS "dob",
    ARRAY[]::"text"[] AS "tags",
    "created_at",
    "deleted_at"
   FROM "public"."patients" "p";


ALTER VIEW "public"."v_patients" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_patients_export" AS
SELECT
    NULL::"uuid" AS "id",
    NULL::"uuid" AS "user_id",
    NULL::"text" AS "nombre",
    NULL::integer AS "edad",
    NULL::"text" AS "genero",
    NULL::timestamp with time zone AS "created_at",
    NULL::timestamp with time zone AS "deleted_at",
    NULL::"text" AS "tags";


ALTER VIEW "public"."v_patients_export" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_reminders_logs" AS
 SELECT NULL::"uuid" AS "id",
    NULL::"uuid" AS "org_id",
    NULL::"uuid" AS "patient_id",
    NULL::"text" AS "channel",
    NULL::"text" AS "status",
    NULL::"text" AS "target",
    NULL::"text" AS "template",
    NULL::timestamp with time zone AS "created_at",
    NULL::timestamp with time zone AS "last_attempt_at",
    NULL::integer AS "attempts"
  WHERE false;


ALTER VIEW "public"."v_reminders_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."work_assignments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "patient_id" "uuid" NOT NULL,
    "provider_id" "uuid" NOT NULL,
    "module" "text" NOT NULL,
    "template_id" "uuid",
    "title" "text" NOT NULL,
    "details" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "due_at" timestamp with time zone,
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "last_done_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "work_assignments_module_check" CHECK (("module" = ANY (ARRAY['mente'::"text", 'equilibrio'::"text", 'sonrisa'::"text", 'pulso'::"text", 'general'::"text"]))),
    CONSTRAINT "work_assignments_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'completed'::"text", 'canceled'::"text"])))
);


ALTER TABLE "public"."work_assignments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."work_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "patient_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "status" "public"."work_status" DEFAULT 'open'::"public"."work_status" NOT NULL,
    "due_at" timestamp with time zone,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."work_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."work_templates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "created_by" "uuid" NOT NULL,
    "module" "text" NOT NULL,
    "title" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "description" "text",
    "content" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "work_templates_module_check" CHECK (("module" = ANY (ARRAY['mente'::"text", 'equilibrio'::"text", 'sonrisa'::"text", 'pulso'::"text", 'general'::"text"])))
);


ALTER TABLE "public"."work_templates" OWNER TO "postgres";


ALTER TABLE ONLY "public"."appointments_events" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."appointments_events_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."audit_entries" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."audit_entries_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."patient_notes_audit" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."patient_notes_audit_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."reminder_logs" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."reminder_logs_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."agenda_alert_log"
    ADD CONSTRAINT "agenda_alert_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."agreements_acceptances"
    ADD CONSTRAINT "agreements_acceptances_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."agreements_acceptances"
    ADD CONSTRAINT "agreements_acceptances_token_key" UNIQUE ("token");



ALTER TABLE ONLY "public"."agreements"
    ADD CONSTRAINT "agreements_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."agreements_templates"
    ADD CONSTRAINT "agreements_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."agreements_templates"
    ADD CONSTRAINT "agreements_templates_type_version_locale_key" UNIQUE ("type", "version", "locale");



ALTER TABLE ONLY "public"."appointments_events"
    ADD CONSTRAINT "appointments_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."appointments"
    ADD CONSTRAINT "appointments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."audit_entries"
    ADD CONSTRAINT "audit_entries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."audit_log"
    ADD CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."bank_accounts"
    ADD CONSTRAINT "bank_accounts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."bank_budgets"
    ADD CONSTRAINT "bank_budgets_org_id_category_id_month_key" UNIQUE ("org_id", "category_id", "month");



ALTER TABLE ONLY "public"."bank_budgets"
    ADD CONSTRAINT "bank_budgets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."bank_categories"
    ADD CONSTRAINT "bank_categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."bank_rules"
    ADD CONSTRAINT "bank_rules_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."bank_tx"
    ADD CONSTRAINT "bank_tx_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."cal_bookings_raw"
    ADD CONSTRAINT "cal_bookings_raw_pkey" PRIMARY KEY ("cal_uid");



ALTER TABLE ONLY "public"."cal_webhooks"
    ADD CONSTRAINT "cal_webhooks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."concept_dictionary"
    ADD CONSTRAINT "concept_dictionary_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."contacts"
    ADD CONSTRAINT "contacts_org_id_patient_id_channel_address_key" UNIQUE ("org_id", "patient_id", "channel", "address");



ALTER TABLE ONLY "public"."contacts"
    ADD CONSTRAINT "contacts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."dental_budget_items"
    ADD CONSTRAINT "dental_budget_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."dental_budgets"
    ADD CONSTRAINT "dental_budgets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."dental_charts"
    ADD CONSTRAINT "dental_charts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."discharge_templates"
    ADD CONSTRAINT "discharge_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."discharges"
    ADD CONSTRAINT "discharges_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."doc_folios"
    ADD CONSTRAINT "doc_folios_pkey" PRIMARY KEY ("org_id", "doc_type", "year_month");



ALTER TABLE ONLY "public"."doctor_letterheads"
    ADD CONSTRAINT "doctor_letterheads_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."document_ledger"
    ADD CONSTRAINT "document_ledger_folio_key" UNIQUE ("folio");



ALTER TABLE ONLY "public"."document_ledger"
    ADD CONSTRAINT "document_ledger_pkey" PRIMARY KEY ("doc_type", "doc_id");



ALTER TABLE ONLY "public"."drug_condition_alerts"
    ADD CONSTRAINT "drug_condition_alerts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."drug_dictionary"
    ADD CONSTRAINT "drug_dictionary_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."drug_interactions"
    ADD CONSTRAINT "drug_interactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."equilibrio_checkins"
    ADD CONSTRAINT "equilibrio_checkins_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."equilibrio_plan_items"
    ADD CONSTRAINT "equilibrio_plan_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."equilibrio_plans"
    ADD CONSTRAINT "equilibrio_plans_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."equilibrio_task_library"
    ADD CONSTRAINT "equilibrio_task_library_org_id_title_key" UNIQUE ("org_id", "title");



ALTER TABLE ONLY "public"."equilibrio_task_library"
    ADD CONSTRAINT "equilibrio_task_library_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."exercise_plans"
    ADD CONSTRAINT "exercise_plans_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."export_templates"
    ADD CONSTRAINT "export_templates_owner_id_org_id_name_key" UNIQUE ("owner_id", "org_id", "name");



ALTER TABLE ONLY "public"."export_templates"
    ADD CONSTRAINT "export_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."features"
    ADD CONSTRAINT "features_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."file_embeddings"
    ADD CONSTRAINT "file_embeddings_path_key" UNIQUE ("path");



ALTER TABLE ONLY "public"."file_embeddings"
    ADD CONSTRAINT "file_embeddings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."form_responses"
    ADD CONSTRAINT "form_responses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."form_templates"
    ADD CONSTRAINT "form_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."jotform_webhooks"
    ADD CONSTRAINT "jotform_webhooks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."lab_request_items"
    ADD CONSTRAINT "lab_request_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."lab_requests"
    ADD CONSTRAINT "lab_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."lab_results"
    ADD CONSTRAINT "lab_results_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."lab_test_templates"
    ADD CONSTRAINT "lab_test_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."lab_upload_tokens"
    ADD CONSTRAINT "lab_upload_tokens_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."lab_upload_tokens"
    ADD CONSTRAINT "lab_upload_tokens_token_key" UNIQUE ("token");



ALTER TABLE ONLY "public"."mente_assessments"
    ADD CONSTRAINT "mente_assessments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."mente_sessions"
    ADD CONSTRAINT "mente_sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."modules"
    ADD CONSTRAINT "modules_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."note_embeddings"
    ADD CONSTRAINT "note_embeddings_note_id_key" UNIQUE ("note_id");



ALTER TABLE ONLY "public"."note_embeddings"
    ADD CONSTRAINT "note_embeddings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."note_templates"
    ADD CONSTRAINT "note_templates_owner_id_org_id_name_key" UNIQUE ("owner_id", "org_id", "name");



ALTER TABLE ONLY "public"."note_templates"
    ADD CONSTRAINT "note_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notify_inbound"
    ADD CONSTRAINT "notify_inbound_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notify_status"
    ADD CONSTRAINT "notify_status_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."org_bank_settings"
    ADD CONSTRAINT "org_bank_settings_pkey" PRIMARY KEY ("org_id");



ALTER TABLE ONLY "public"."org_disclaimers"
    ADD CONSTRAINT "org_disclaimers_pkey" PRIMARY KEY ("org_id", "kind");



ALTER TABLE ONLY "public"."org_features"
    ADD CONSTRAINT "org_features_pkey" PRIMARY KEY ("org_id", "feature_id");



ALTER TABLE ONLY "public"."org_invoices"
    ADD CONSTRAINT "org_invoices_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."org_invoices"
    ADD CONSTRAINT "org_invoices_stripe_invoice_id_key" UNIQUE ("stripe_invoice_id");



ALTER TABLE ONLY "public"."org_ledger_transactions"
    ADD CONSTRAINT "org_ledger_transactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."org_members"
    ADD CONSTRAINT "org_members_pkey" PRIMARY KEY ("org_id", "user_id");



ALTER TABLE ONLY "public"."org_subscriptions"
    ADD CONSTRAINT "org_subscriptions_pkey" PRIMARY KEY ("org_id");



ALTER TABLE ONLY "public"."organization_members"
    ADD CONSTRAINT "organization_members_pkey" PRIMARY KEY ("org_id", "user_id");



ALTER TABLE ONLY "public"."organizations"
    ADD CONSTRAINT "organizations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."organizations"
    ADD CONSTRAINT "organizations_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."patient_appointments"
    ADD CONSTRAINT "patient_appointments_cal_uid_key" UNIQUE ("cal_uid");



ALTER TABLE ONLY "public"."patient_appointments"
    ADD CONSTRAINT "patient_appointments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."patient_conditions"
    ADD CONSTRAINT "patient_conditions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."patient_file_access_log"
    ADD CONSTRAINT "patient_file_access_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."patient_file_versions"
    ADD CONSTRAINT "patient_file_versions_patient_id_group_key_version_key" UNIQUE ("patient_id", "group_key", "version");



ALTER TABLE ONLY "public"."patient_file_versions"
    ADD CONSTRAINT "patient_file_versions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."patient_files"
    ADD CONSTRAINT "patient_files_path_key" UNIQUE ("path");



ALTER TABLE ONLY "public"."patient_files"
    ADD CONSTRAINT "patient_files_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."patient_labels"
    ADD CONSTRAINT "patient_labels_org_id_patient_id_label_key" UNIQUE ("org_id", "patient_id", "label");



ALTER TABLE ONLY "public"."patient_labels"
    ADD CONSTRAINT "patient_labels_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."patient_medications"
    ADD CONSTRAINT "patient_medications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."patient_note_versions"
    ADD CONSTRAINT "patient_note_versions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."patient_notes_audit"
    ADD CONSTRAINT "patient_notes_audit_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."patient_notes"
    ADD CONSTRAINT "patient_notes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."patient_panels"
    ADD CONSTRAINT "patient_panels_pkey" PRIMARY KEY ("org_id", "provider_id", "patient_id");



ALTER TABLE ONLY "public"."patient_permissions"
    ADD CONSTRAINT "patient_permissions_patient_id_user_id_key" UNIQUE ("patient_id", "user_id");



ALTER TABLE ONLY "public"."patient_permissions"
    ADD CONSTRAINT "patient_permissions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."patient_providers"
    ADD CONSTRAINT "patient_providers_pkey" PRIMARY KEY ("org_id", "patient_id", "provider_id");



ALTER TABLE ONLY "public"."patient_share_access"
    ADD CONSTRAINT "patient_share_access_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."patient_shares"
    ADD CONSTRAINT "patient_shares_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."patient_tags"
    ADD CONSTRAINT "patient_tags_pkey" PRIMARY KEY ("patient_id", "tag_id");



ALTER TABLE ONLY "public"."patient_task_templates"
    ADD CONSTRAINT "patient_task_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."patient_tasks"
    ADD CONSTRAINT "patient_tasks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."patients"
    ADD CONSTRAINT "patients_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."prescription_items"
    ADD CONSTRAINT "prescription_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."prescription_templates"
    ADD CONSTRAINT "prescription_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."prescriptions"
    ADD CONSTRAINT "prescriptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pulso_measurements"
    ADD CONSTRAINT "pulso_measurements_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pulso_targets"
    ADD CONSTRAINT "pulso_targets_org_id_patient_id_type_key" UNIQUE ("org_id", "patient_id", "type");



ALTER TABLE ONLY "public"."pulso_targets"
    ADD CONSTRAINT "pulso_targets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."referral_templates"
    ADD CONSTRAINT "referral_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."referrals"
    ADD CONSTRAINT "referrals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."rehab_sessions"
    ADD CONSTRAINT "rehab_sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."reminder_logs"
    ADD CONSTRAINT "reminder_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."reminder_prefs"
    ADD CONSTRAINT "reminder_prefs_pkey" PRIMARY KEY ("org_id", "provider_id");



ALTER TABLE ONLY "public"."reminder_queue"
    ADD CONSTRAINT "reminder_queue_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."reminder_templates"
    ADD CONSTRAINT "reminder_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."reminders"
    ADD CONSTRAINT "reminders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."reminders_templates"
    ADD CONSTRAINT "reminders_templates_org_id_name_key" UNIQUE ("org_id", "name");



ALTER TABLE ONLY "public"."reminders_templates"
    ADD CONSTRAINT "reminders_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."report_schedules"
    ADD CONSTRAINT "report_schedules_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."saved_searches"
    ADD CONSTRAINT "saved_searches_owner_id_org_id_name_key" UNIQUE ("owner_id", "org_id", "name");



ALTER TABLE ONLY "public"."saved_searches"
    ADD CONSTRAINT "saved_searches_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."saved_views"
    ADD CONSTRAINT "saved_views_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."saved_views"
    ADD CONSTRAINT "saved_views_unique_name" UNIQUE ("org_id", "user_id", "scope", "name");



ALTER TABLE ONLY "public"."sonrisa_quote_items"
    ADD CONSTRAINT "sonrisa_quote_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sonrisa_quotes"
    ADD CONSTRAINT "sonrisa_quotes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sonrisa_treatments"
    ADD CONSTRAINT "sonrisa_treatments_org_id_code_key" UNIQUE ("org_id", "code");



ALTER TABLE ONLY "public"."sonrisa_treatments"
    ADD CONSTRAINT "sonrisa_treatments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tag_permissions"
    ADD CONSTRAINT "tag_permissions_org_id_tag_id_role_key" UNIQUE ("org_id", "tag_id", "role");



ALTER TABLE ONLY "public"."tag_permissions"
    ADD CONSTRAINT "tag_permissions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tags"
    ADD CONSTRAINT "tags_owner_org_name_key" UNIQUE ("owner_id", "org_id", "name");



ALTER TABLE ONLY "public"."tags"
    ADD CONSTRAINT "tags_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_prefs"
    ADD CONSTRAINT "user_prefs_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."work_assignments"
    ADD CONSTRAINT "work_assignments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."work_items"
    ADD CONSTRAINT "work_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."work_templates"
    ADD CONSTRAINT "work_templates_pkey" PRIMARY KEY ("id");



CREATE INDEX "agenda_alert_log_idx" ON "public"."agenda_alert_log" USING "btree" ("org_id", "schedule_id", "date_key");



CREATE UNIQUE INDEX "agenda_alert_log_unique" ON "public"."agenda_alert_log" USING "btree" ("schedule_id", "key", "date_key");



CREATE INDEX "agreements_contract_idx" ON "public"."agreements" USING "btree" ("contract_type");



CREATE INDEX "agreements_org_idx" ON "public"."agreements" USING "btree" ("org_id");



CREATE INDEX "agreements_subject_idx" ON "public"."agreements" USING "btree" ("subject_id", "subject_type");



CREATE INDEX "audit_log_org_tbl_at_idx" ON "public"."audit_log" USING "btree" ("org_id", "table_name", "at" DESC);



CREATE INDEX "bank_budgets_org_month_idx" ON "public"."bank_budgets" USING "btree" ("org_id", "month");



CREATE INDEX "bank_rules_org_prio_idx" ON "public"."bank_rules" USING "btree" ("org_id", "priority");



CREATE INDEX "bank_tx_org_cat_date_idx" ON "public"."bank_tx" USING "btree" ("org_id", "category_id", "date");



CREATE INDEX "bank_tx_org_date_idx" ON "public"."bank_tx" USING "btree" ("org_id", "date");



CREATE INDEX "bank_tx_tags_idx" ON "public"."bank_tx" USING "gin" ("tags");



CREATE INDEX "discharges_org_created_idx" ON "public"."discharges" USING "btree" ("org_id", "created_at" DESC);



CREATE INDEX "discharges_patient_idx" ON "public"."discharges" USING "btree" ("patient_id");



CREATE INDEX "doc_folios_org_type_idx" ON "public"."doc_folios" USING "btree" ("org_id", "doc_type", "year_month");



CREATE UNIQUE INDEX "doctor_letterheads_unique" ON "public"."doctor_letterheads" USING "btree" ("org_id", "doctor_id");



CREATE INDEX "eq_chk_item_day_idx" ON "public"."equilibrio_checkins" USING "btree" ("item_id", "day");



CREATE INDEX "eq_chk_org_patient_day_idx" ON "public"."equilibrio_checkins" USING "btree" ("org_id", "patient_id", "day");



CREATE INDEX "eq_items_plan_idx" ON "public"."equilibrio_plan_items" USING "btree" ("plan_id");



CREATE INDEX "eq_lib_active_idx" ON "public"."equilibrio_task_library" USING "btree" ("active");



CREATE INDEX "eq_lib_org_idx" ON "public"."equilibrio_task_library" USING "btree" ("org_id");



CREATE INDEX "eq_plans_org_patient_idx" ON "public"."equilibrio_plans" USING "btree" ("org_id", "patient_id", "is_active");



CREATE INDEX "eq_plans_starts_idx" ON "public"."equilibrio_plans" USING "btree" ("starts_on");



CREATE INDEX "form_responses_org_created_idx" ON "public"."form_responses" USING "btree" ("org_id", "created_at" DESC);



CREATE INDEX "form_responses_patient_idx" ON "public"."form_responses" USING "btree" ("patient_id");



CREATE INDEX "form_templates_org_name_idx" ON "public"."form_templates" USING "btree" ("org_id", "name");



CREATE INDEX "idx_agree_acc_org" ON "public"."agreements_acceptances" USING "btree" ("org_id");



CREATE INDEX "idx_agree_acc_pair" ON "public"."agreements_acceptances" USING "btree" ("org_id", "specialist_id", "patient_id", "contract_type", "status");



CREATE INDEX "idx_agree_acc_token" ON "public"."agreements_acceptances" USING "btree" ("token");



CREATE INDEX "idx_app_events_appt" ON "public"."appointments_events" USING "btree" ("appointment_id");



CREATE INDEX "idx_app_events_org" ON "public"."appointments_events" USING "btree" ("org_id");



CREATE INDEX "idx_appointments_org" ON "public"."appointments" USING "btree" ("org_id");



CREATE INDEX "idx_appointments_patient" ON "public"."appointments" USING "btree" ("patient_id");



CREATE INDEX "idx_appointments_start" ON "public"."appointments" USING "btree" ("start_at");



CREATE INDEX "idx_appts_org_patient_provider_start" ON "public"."appointments" USING "btree" ("org_id", "patient_id", "provider_id", "start_at");



CREATE INDEX "idx_audit_created" ON "public"."audit_log" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_audit_patient" ON "public"."audit_log" USING "btree" ("patient_id");



CREATE INDEX "idx_cal_raw_start" ON "public"."cal_bookings_raw" USING "btree" ("start");



CREATE INDEX "idx_cal_raw_status" ON "public"."cal_bookings_raw" USING "btree" ("status");



CREATE INDEX "idx_concept_canon" ON "public"."concept_dictionary" USING "btree" ("canonical");



CREATE INDEX "idx_concept_canon_norm" ON "public"."concept_dictionary" USING "btree" ("canonical_norm");



CREATE INDEX "idx_dca_cond" ON "public"."drug_condition_alerts" USING "btree" ("condition_concept_id");



CREATE INDEX "idx_dca_ing" ON "public"."drug_condition_alerts" USING "btree" ("ingredient_id");



CREATE INDEX "idx_dental_budget_items_budget" ON "public"."dental_budget_items" USING "btree" ("budget_id");



CREATE INDEX "idx_dental_budgets_patient" ON "public"."dental_budgets" USING "btree" ("patient_id");



CREATE INDEX "idx_dental_charts_patient" ON "public"."dental_charts" USING "btree" ("patient_id");



CREATE INDEX "idx_dint_a" ON "public"."drug_interactions" USING "btree" ("a_ingredient");



CREATE INDEX "idx_dint_b" ON "public"."drug_interactions" USING "btree" ("b_ingredient");



CREATE INDEX "idx_dis_tmpl_scope" ON "public"."discharge_templates" USING "btree" ("org_id", "doctor_id");



CREATE INDEX "idx_discharges_doctor" ON "public"."discharges" USING "btree" ("doctor_id");



CREATE INDEX "idx_discharges_org" ON "public"."discharges" USING "btree" ("org_id");



CREATE INDEX "idx_discharges_patient" ON "public"."discharges" USING "btree" ("patient_id");



CREATE INDEX "idx_doc_ledger_folio" ON "public"."document_ledger" USING "btree" ("folio");



CREATE INDEX "idx_doc_ledger_revoked" ON "public"."document_ledger" USING "btree" ("revoked_at");



CREATE INDEX "idx_doc_ledger_type" ON "public"."document_ledger" USING "btree" ("doc_type");



CREATE INDEX "idx_drug_name" ON "public"."drug_dictionary" USING "btree" ("name");



CREATE INDEX "idx_drug_name_norm" ON "public"."drug_dictionary" USING "btree" ("name_norm");



CREATE INDEX "idx_exercise_plans_patient" ON "public"."exercise_plans" USING "btree" ("patient_id");



CREATE INDEX "idx_fe_cosine" ON "public"."file_embeddings" USING "ivfflat" ("embedding" "public"."vector_cosine_ops") WITH ("lists"='100') WHERE ("embedding" IS NOT NULL);



CREATE INDEX "idx_fe_org" ON "public"."file_embeddings" USING "btree" ("org_id");



CREATE INDEX "idx_fe_patient" ON "public"."file_embeddings" USING "btree" ("patient_id");



CREATE INDEX "idx_fe_provider" ON "public"."file_embeddings" USING "btree" ("provider", "model");



CREATE INDEX "idx_features_module" ON "public"."features" USING "btree" ("module_id");



CREATE INDEX "idx_file_emb" ON "public"."file_embeddings" USING "ivfflat" ("embedding" "public"."vector_cosine_ops") WITH ("lists"='100');



CREATE INDEX "idx_form_responses_patient" ON "public"."form_responses" USING "btree" ("patient_id");



CREATE INDEX "idx_form_responses_template" ON "public"."form_responses" USING "btree" ("template_id");



CREATE INDEX "idx_form_templates_active" ON "public"."form_templates" USING "btree" ("is_active");



CREATE INDEX "idx_form_templates_org" ON "public"."form_templates" USING "btree" ("org_id");



CREATE INDEX "idx_lab_items_req" ON "public"."lab_request_items" USING "btree" ("request_id");



CREATE INDEX "idx_lab_requests_org" ON "public"."lab_requests" USING "btree" ("org_id");



CREATE INDEX "idx_lab_requests_patient" ON "public"."lab_requests" USING "btree" ("patient_id");



CREATE INDEX "idx_lab_requests_status" ON "public"."lab_requests" USING "btree" ("status");



CREATE INDEX "idx_lab_results_patient" ON "public"."lab_results" USING "btree" ("patient_id");



CREATE INDEX "idx_lab_results_req" ON "public"."lab_results" USING "btree" ("request_id");



CREATE INDEX "idx_ne_cosine" ON "public"."note_embeddings" USING "ivfflat" ("embedding" "public"."vector_cosine_ops") WITH ("lists"='100') WHERE ("embedding" IS NOT NULL);



CREATE INDEX "idx_ne_org" ON "public"."note_embeddings" USING "btree" ("org_id");



CREATE INDEX "idx_ne_patient" ON "public"."note_embeddings" USING "btree" ("patient_id");



CREATE INDEX "idx_ne_provider" ON "public"."note_embeddings" USING "btree" ("provider", "model");



CREATE INDEX "idx_note_emb" ON "public"."note_embeddings" USING "ivfflat" ("embedding" "public"."vector_cosine_ops") WITH ("lists"='100');



CREATE INDEX "idx_notes_deleted_at" ON "public"."patient_notes" USING "btree" ("deleted_at");



CREATE INDEX "idx_notes_patient_id" ON "public"."patient_notes" USING "btree" ("patient_id");



CREATE INDEX "idx_notes_user_id" ON "public"."patient_notes" USING "btree" ("user_id");



CREATE INDEX "idx_oinv_created" ON "public"."org_invoices" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_oinv_org" ON "public"."org_invoices" USING "btree" ("org_id");



CREATE INDEX "idx_olt_created" ON "public"."org_ledger_transactions" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_olt_invoice" ON "public"."org_ledger_transactions" USING "btree" ("stripe_invoice_id");



CREATE INDEX "idx_olt_org" ON "public"."org_ledger_transactions" USING "btree" ("org_id");



CREATE INDEX "idx_org_features_org" ON "public"."org_features" USING "btree" ("org_id");



CREATE INDEX "idx_org_owner" ON "public"."organizations" USING "btree" ("owner_user_id");



CREATE INDEX "idx_orgm_role" ON "public"."organization_members" USING "btree" ("role");



CREATE INDEX "idx_orgm_user" ON "public"."organization_members" USING "btree" ("user_id");



CREATE INDEX "idx_pa_patient" ON "public"."patient_appointments" USING "btree" ("patient_id");



CREATE INDEX "idx_pa_start" ON "public"."patient_appointments" USING "btree" ("start" DESC);



CREATE INDEX "idx_pa_status" ON "public"."patient_appointments" USING "btree" ("status");



CREATE INDEX "idx_patient_appointments_patient" ON "public"."patient_appointments" USING "btree" ("patient_id");



CREATE INDEX "idx_patient_appointments_start" ON "public"."patient_appointments" USING "btree" ("start");



CREATE INDEX "idx_patient_files_created" ON "public"."patient_files" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_patient_files_owner_created" ON "public"."patient_files" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX "idx_patient_files_patient" ON "public"."patient_files" USING "btree" ("patient_id");



CREATE INDEX "idx_patient_files_patient_created" ON "public"."patient_files" USING "btree" ("patient_id", "created_at" DESC);



CREATE INDEX "idx_patient_files_user" ON "public"."patient_files" USING "btree" ("user_id");



CREATE INDEX "idx_patient_notes_created_at" ON "public"."patient_notes" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_patient_notes_deleted_at" ON "public"."patient_notes" USING "btree" ("deleted_at");



CREATE INDEX "idx_patient_notes_patient_id" ON "public"."patient_notes" USING "btree" ("patient_id");



CREATE INDEX "idx_patient_notes_search" ON "public"."patient_notes" USING "gin" ("search");



CREATE INDEX "idx_patient_notes_user_id" ON "public"."patient_notes" USING "btree" ("user_id");



CREATE INDEX "idx_patient_shares_email_lower" ON "public"."patient_shares" USING "btree" ("lower"("shared_with_email"));



CREATE INDEX "idx_patient_shares_owner" ON "public"."patient_shares" USING "btree" ("owner_id");



CREATE INDEX "idx_patient_shares_patient_owner" ON "public"."patient_shares" USING "btree" ("patient_id", "owner_id");



CREATE INDEX "idx_patients_created" ON "public"."patients" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_patients_created_at" ON "public"."patients" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_patients_deleted_at" ON "public"."patients" USING "btree" ("deleted_at") WHERE ("deleted_at" IS NOT NULL);



CREATE INDEX "idx_patients_edad" ON "public"."patients" USING "btree" ("edad");



CREATE INDEX "idx_patients_full_name_trgm" ON "public"."patients" USING "gin" ("full_name" "public"."gin_trgm_ops");



CREATE INDEX "idx_patients_genero" ON "public"."patients" USING "btree" ("genero");



CREATE INDEX "idx_patients_nombre_lower" ON "public"."patients" USING "btree" ("lower"("nombre"));



CREATE INDEX "idx_patients_nombre_trgm" ON "public"."patients" USING "gin" ("nombre" "public"."gin_trgm_ops");



CREATE INDEX "idx_patients_owner_created" ON "public"."patients" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX "idx_patients_search" ON "public"."patients" USING "gin" ("search");



CREATE INDEX "idx_patients_user_id" ON "public"."patients" USING "btree" ("user_id");



CREATE INDEX "idx_pc_concept" ON "public"."patient_conditions" USING "btree" ("concept_id");



CREATE INDEX "idx_pc_patient" ON "public"."patient_conditions" USING "btree" ("patient_id");



CREATE INDEX "idx_pfvers_pt_key_version" ON "public"."patient_file_versions" USING "btree" ("patient_id", "group_key", "version" DESC);



CREATE INDEX "idx_pm_patient" ON "public"."patient_medications" USING "btree" ("patient_id");



CREATE INDEX "idx_ps_created" ON "public"."patient_shares" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_ps_grantee_email_l" ON "public"."patient_shares" USING "btree" ("lower"("grantee_email"));



CREATE INDEX "idx_ps_owner" ON "public"."patient_shares" USING "btree" ("owner_id");



CREATE INDEX "idx_ps_patient" ON "public"."patient_shares" USING "btree" ("patient_id");



CREATE INDEX "idx_ps_patient_owner" ON "public"."patient_shares" USING "btree" ("patient_id", "owner_id");



CREATE INDEX "idx_ps_shared_email_l" ON "public"."patient_shares" USING "btree" ("lower"("shared_with_email"));



CREATE INDEX "idx_pt_patient" ON "public"."patient_tags" USING "btree" ("patient_id");



CREATE INDEX "idx_pt_tag" ON "public"."patient_tags" USING "btree" ("tag_id");



CREATE INDEX "idx_ref_tmpl_scope" ON "public"."referral_templates" USING "btree" ("org_id", "doctor_id");



CREATE INDEX "idx_referrals_doctor" ON "public"."referrals" USING "btree" ("doctor_id");



CREATE INDEX "idx_referrals_org" ON "public"."referrals" USING "btree" ("org_id");



CREATE INDEX "idx_referrals_patient" ON "public"."referrals" USING "btree" ("patient_id");



CREATE INDEX "idx_rehab_sessions_date" ON "public"."rehab_sessions" USING "btree" ("date");



CREATE INDEX "idx_rehab_sessions_patient" ON "public"."rehab_sessions" USING "btree" ("patient_id");



CREATE INDEX "idx_reminder_logs_created" ON "public"."reminder_logs" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_reminder_logs_org" ON "public"."reminder_logs" USING "btree" ("org_id");



CREATE INDEX "idx_reminder_logs_rid" ON "public"."reminder_logs" USING "btree" ("reminder_id");



CREATE INDEX "idx_reminder_logs_status" ON "public"."reminder_logs" USING "btree" ("status");



CREATE INDEX "idx_reminders_appointment" ON "public"."reminders" USING "btree" ("appointment_id");



CREATE INDEX "idx_reminders_next_run" ON "public"."reminders" USING "btree" ("next_run_at");



CREATE INDEX "idx_reminders_org" ON "public"."reminders" USING "btree" ("org_id");



CREATE INDEX "idx_reminders_send_at" ON "public"."reminders" USING "btree" ("send_at");



CREATE INDEX "idx_reminders_status" ON "public"."reminders" USING "btree" ("status");



CREATE INDEX "idx_rx_doctor" ON "public"."prescriptions" USING "btree" ("doctor_id");



CREATE INDEX "idx_rx_org" ON "public"."prescriptions" USING "btree" ("org_id");



CREATE INDEX "idx_rx_patient" ON "public"."prescriptions" USING "btree" ("patient_id");



CREATE INDEX "idx_rxitems_rx" ON "public"."prescription_items" USING "btree" ("prescription_id");



CREATE INDEX "idx_rxtpl_scope" ON "public"."prescription_templates" USING "btree" ("org_id", "doctor_id");



CREATE INDEX "idx_shares_patient_id" ON "public"."patient_shares" USING "btree" ("patient_id");



CREATE INDEX "idx_shares_receiver_email" ON "public"."patient_shares" USING "btree" ("shared_with_email");



CREATE INDEX "idx_shares_receiver_user" ON "public"."patient_shares" USING "btree" ("shared_with_user_id");



CREATE INDEX "idx_tags_kind" ON "public"."tags" USING "btree" ("kind");



CREATE INDEX "idx_tags_owner" ON "public"."tags" USING "btree" ("owner_id");



CREATE INDEX "idx_work_items_due_at" ON "public"."work_items" USING "btree" ("due_at");



CREATE INDEX "idx_work_items_org" ON "public"."work_items" USING "btree" ("org_id");



CREATE INDEX "idx_work_items_patient" ON "public"."work_items" USING "btree" ("patient_id");



CREATE INDEX "idx_work_items_status" ON "public"."work_items" USING "btree" ("status");



CREATE INDEX "mente_assessments_created_idx" ON "public"."mente_assessments" USING "btree" ("created_at" DESC);



CREATE INDEX "mente_assessments_org_patient_idx" ON "public"."mente_assessments" USING "btree" ("org_id", "patient_id");



CREATE INDEX "mente_assessments_org_tool_idx" ON "public"."mente_assessments" USING "btree" ("org_id", "tool");



CREATE INDEX "mente_sessions_org_patient_idx" ON "public"."mente_sessions" USING "btree" ("org_id", "patient_id");



CREATE INDEX "mente_sessions_signed_idx" ON "public"."mente_sessions" USING "btree" ("signed_at");



CREATE INDEX "patient_labels_org_idx" ON "public"."patient_labels" USING "btree" ("org_id");



CREATE INDEX "patient_labels_patient_idx" ON "public"."patient_labels" USING "btree" ("patient_id");



CREATE INDEX "patient_panels_org_provider_idx" ON "public"."patient_panels" USING "btree" ("org_id", "provider_id");



CREATE INDEX "patient_panels_patient_idx" ON "public"."patient_panels" USING "btree" ("patient_id");



CREATE INDEX "patient_share_access_at_idx" ON "public"."patient_share_access" USING "btree" ("at" DESC);



CREATE INDEX "patient_share_access_share_idx" ON "public"."patient_share_access" USING "btree" ("share_id", "at" DESC);



CREATE INDEX "patient_shares_org_idx" ON "public"."patient_shares" USING "btree" ("org_id");



CREATE INDEX "patient_shares_patient_idx" ON "public"."patient_shares" USING "btree" ("patient_id");



CREATE INDEX "patient_task_templates_org_module_idx" ON "public"."patient_task_templates" USING "btree" ("org_id", "module");



CREATE INDEX "patient_tasks_org_patient_idx" ON "public"."patient_tasks" USING "btree" ("org_id", "patient_id");



CREATE INDEX "patient_tasks_status_idx" ON "public"."patient_tasks" USING "btree" ("status");



CREATE INDEX "patients_created_idx" ON "public"."patients" USING "btree" ("created_at");



CREATE INDEX "patients_email_idx" ON "public"."patients" USING "btree" ("email");



CREATE INDEX "patients_full_name_trgm" ON "public"."patients" USING "gin" ("full_name" "public"."gin_trgm_ops");



CREATE INDEX "patients_full_name_trgm_idx" ON "public"."patients" USING "gin" ("public"."immutable_unaccent"("lower"("full_name")) "public"."gin_trgm_ops");



CREATE INDEX "patients_org_idx" ON "public"."patients" USING "btree" ("org_id");



CREATE INDEX "patients_phone_idx" ON "public"."patients" USING "btree" ("phone");



CREATE INDEX "patients_unaccent_full_name_trgm_idx" ON "public"."patients" USING "gin" ("public"."immutable_unaccent"("lower"("full_name")) "public"."gin_trgm_ops");



CREATE INDEX "prescription_templates_active_idx" ON "public"."prescription_templates" USING "btree" ("active");



CREATE INDEX "prescription_templates_org_name_idx" ON "public"."prescription_templates" USING "btree" ("org_id", "name");



CREATE INDEX "prescriptions_issued_idx" ON "public"."prescriptions" USING "btree" ("issued_at");



CREATE INDEX "prescriptions_org_created_idx" ON "public"."prescriptions" USING "btree" ("org_id", "created_at" DESC);



CREATE INDEX "prescriptions_org_idx" ON "public"."prescriptions" USING "btree" ("org_id");



CREATE INDEX "prescriptions_patient_idx" ON "public"."prescriptions" USING "btree" ("patient_id");



CREATE INDEX "pulso_meas_measured_idx" ON "public"."pulso_measurements" USING "btree" ("measured_at" DESC);



CREATE INDEX "pulso_meas_org_patient_idx" ON "public"."pulso_measurements" USING "btree" ("org_id", "patient_id");



CREATE INDEX "pulso_meas_type_idx" ON "public"."pulso_measurements" USING "btree" ("type");



CREATE INDEX "pulso_targets_org_patient_idx" ON "public"."pulso_targets" USING "btree" ("org_id", "patient_id");



CREATE INDEX "referral_templates_org_name_idx" ON "public"."referral_templates" USING "btree" ("org_id", "name");



CREATE INDEX "referrals_org_created_idx" ON "public"."referrals" USING "btree" ("org_id", "created_at" DESC);



CREATE INDEX "referrals_patient_idx" ON "public"."referrals" USING "btree" ("patient_id");



CREATE INDEX "reminder_queue_assignment_idx" ON "public"."reminder_queue" USING "btree" ("assignment_id");



CREATE INDEX "reminder_queue_org_status_idx" ON "public"."reminder_queue" USING "btree" ("org_id", "status", "next_attempt_at");



CREATE UNIQUE INDEX "reminder_queue_unique_sched" ON "public"."reminder_queue" USING "btree" ("org_id", "assignment_id", "template_slug") WHERE ("status" = 'scheduled'::"text");



CREATE INDEX "reminders_templates_name_idx" ON "public"."reminders_templates" USING "btree" ("org_id", "name");



CREATE INDEX "reminders_templates_org_idx" ON "public"."reminders_templates" USING "btree" ("org_id", "is_active");



CREATE INDEX "report_schedules_active_idx" ON "public"."report_schedules" USING "btree" ("is_active");



CREATE INDEX "report_schedules_org_idx" ON "public"."report_schedules" USING "btree" ("org_id");



CREATE INDEX "report_schedules_scope_idx" ON "public"."report_schedules" USING "btree" ("scope");



CREATE INDEX "report_schedules_when_idx" ON "public"."report_schedules" USING "btree" ("frequency", "at_hour", "at_minute");



CREATE INDEX "saved_views_org_user_scope_idx" ON "public"."saved_views" USING "btree" ("org_id", "user_id", "scope");



CREATE INDEX "sonrisa_quote_items_quote_idx" ON "public"."sonrisa_quote_items" USING "btree" ("quote_id");



CREATE INDEX "sonrisa_quotes_org_idx" ON "public"."sonrisa_quotes" USING "btree" ("org_id");



CREATE INDEX "sonrisa_quotes_patient_idx" ON "public"."sonrisa_quotes" USING "btree" ("patient_id");



CREATE INDEX "sonrisa_quotes_status_idx" ON "public"."sonrisa_quotes" USING "btree" ("status");



CREATE INDEX "sonrisa_treatments_active_idx" ON "public"."sonrisa_treatments" USING "btree" ("active");



CREATE INDEX "sonrisa_treatments_org_idx" ON "public"."sonrisa_treatments" USING "btree" ("org_id");



CREATE UNIQUE INDEX "ux_modules_name" ON "public"."modules" USING "btree" ("name");



CREATE UNIQUE INDEX "ux_ps_patient_email" ON "public"."patient_shares" USING "btree" ("patient_id", "lower"("grantee_email"));



CREATE INDEX "work_assign_module_idx" ON "public"."work_assignments" USING "btree" ("module");



CREATE INDEX "work_assign_org_status_due_idx" ON "public"."work_assignments" USING "btree" ("org_id", "status", "due_at");



CREATE INDEX "work_assign_patient_idx" ON "public"."work_assignments" USING "btree" ("patient_id");



CREATE INDEX "work_assign_provider_idx" ON "public"."work_assignments" USING "btree" ("provider_id");



CREATE INDEX "work_items_due" ON "public"."work_items" USING "btree" ("due_at");



CREATE INDEX "work_items_org" ON "public"."work_items" USING "btree" ("org_id");



CREATE INDEX "work_items_patient" ON "public"."work_items" USING "btree" ("patient_id");



CREATE INDEX "work_items_status" ON "public"."work_items" USING "btree" ("status");



CREATE INDEX "work_templates_active_idx" ON "public"."work_templates" USING "btree" ("org_id", "is_active");



CREATE UNIQUE INDEX "work_templates_org_slug_key" ON "public"."work_templates" USING "btree" ("org_id", "slug");



CREATE INDEX "work_templates_org_updated_idx" ON "public"."work_templates" USING "btree" ("org_id", "updated_at" DESC);



CREATE OR REPLACE VIEW "public"."v_patients_export" AS
 SELECT "p"."id",
    "p"."user_id",
    "p"."nombre",
    "p"."edad",
    "p"."genero",
    "p"."created_at",
    "p"."deleted_at",
    COALESCE("string_agg"("t"."name", ', '::"text" ORDER BY "t"."name"), ''::"text") AS "tags"
   FROM (("public"."patients" "p"
     LEFT JOIN "public"."patient_tags" "pt" ON (("pt"."patient_id" = "p"."id")))
     LEFT JOIN "public"."tags" "t" ON ((("t"."id" = "pt"."tag_id") AND ("t"."owner_id" = "p"."user_id"))))
  GROUP BY "p"."id";



CREATE OR REPLACE TRIGGER "after_lab_result" AFTER INSERT ON "public"."lab_results" FOR EACH ROW EXECUTE FUNCTION "public"."trg_after_lab_result"();



CREATE OR REPLACE TRIGGER "audit_agree_acc" AFTER INSERT OR DELETE OR UPDATE ON "public"."agreements_acceptances" FOR EACH ROW EXECUTE FUNCTION "public"."audit_trigger"();



CREATE OR REPLACE TRIGGER "audit_bank_tx" AFTER INSERT OR DELETE OR UPDATE ON "public"."bank_tx" FOR EACH ROW EXECUTE FUNCTION "public"."audit_trigger"();



CREATE OR REPLACE TRIGGER "audit_eq_checkins" AFTER INSERT OR DELETE OR UPDATE ON "public"."equilibrio_checkins" FOR EACH ROW EXECUTE FUNCTION "public"."audit_trigger"();



CREATE OR REPLACE TRIGGER "audit_eq_items" AFTER INSERT OR DELETE OR UPDATE ON "public"."equilibrio_plan_items" FOR EACH ROW EXECUTE FUNCTION "public"."audit_trigger"();



CREATE OR REPLACE TRIGGER "audit_eq_lib" AFTER INSERT OR DELETE OR UPDATE ON "public"."equilibrio_task_library" FOR EACH ROW EXECUTE FUNCTION "public"."audit_trigger"();



CREATE OR REPLACE TRIGGER "audit_eq_plans" AFTER INSERT OR DELETE OR UPDATE ON "public"."equilibrio_plans" FOR EACH ROW EXECUTE FUNCTION "public"."audit_trigger"();



CREATE OR REPLACE TRIGGER "audit_files_del" AFTER DELETE ON "public"."patient_files" FOR EACH ROW EXECUTE FUNCTION "public"."trg_audit_files_del"();



CREATE OR REPLACE TRIGGER "audit_files_ins" AFTER INSERT ON "public"."patient_files" FOR EACH ROW EXECUTE FUNCTION "public"."trg_audit_files_ins"();



CREATE OR REPLACE TRIGGER "audit_files_upd" AFTER UPDATE ON "public"."patient_files" FOR EACH ROW EXECUTE FUNCTION "public"."trg_audit_files_upd"();



CREATE OR REPLACE TRIGGER "audit_mente_assessments" AFTER INSERT OR DELETE OR UPDATE ON "public"."mente_assessments" FOR EACH ROW EXECUTE FUNCTION "public"."audit_trigger"();



CREATE OR REPLACE TRIGGER "audit_mente_sessions" AFTER INSERT OR DELETE OR UPDATE ON "public"."mente_sessions" FOR EACH ROW EXECUTE FUNCTION "public"."audit_trigger"();



CREATE OR REPLACE TRIGGER "audit_notes_del" AFTER DELETE ON "public"."patient_notes" FOR EACH ROW EXECUTE FUNCTION "public"."trg_audit_notes_del"();



CREATE OR REPLACE TRIGGER "audit_notes_ins" AFTER INSERT ON "public"."patient_notes" FOR EACH ROW EXECUTE FUNCTION "public"."trg_audit_notes_ins"();



CREATE OR REPLACE TRIGGER "audit_notes_upd" AFTER UPDATE ON "public"."patient_notes" FOR EACH ROW EXECUTE FUNCTION "public"."trg_audit_notes_upd"();



CREATE OR REPLACE TRIGGER "audit_patients_del" AFTER DELETE ON "public"."patients" FOR EACH ROW EXECUTE FUNCTION "public"."trg_audit_patients_del"();



CREATE OR REPLACE TRIGGER "audit_patients_ins" AFTER INSERT ON "public"."patients" FOR EACH ROW EXECUTE FUNCTION "public"."trg_audit_patients_ins"();



CREATE OR REPLACE TRIGGER "audit_patients_upd" AFTER UPDATE ON "public"."patients" FOR EACH ROW EXECUTE FUNCTION "public"."trg_audit_patients_upd"();



CREATE OR REPLACE TRIGGER "audit_pulso_meas" AFTER INSERT OR DELETE OR UPDATE ON "public"."pulso_measurements" FOR EACH ROW EXECUTE FUNCTION "public"."audit_trigger"();



CREATE OR REPLACE TRIGGER "audit_pulso_targets" AFTER INSERT OR DELETE OR UPDATE ON "public"."pulso_targets" FOR EACH ROW EXECUTE FUNCTION "public"."audit_trigger"();



CREATE OR REPLACE TRIGGER "audit_sonrisa_quote_items" AFTER INSERT OR DELETE OR UPDATE ON "public"."sonrisa_quote_items" FOR EACH ROW EXECUTE FUNCTION "public"."audit_trigger"();



CREATE OR REPLACE TRIGGER "audit_sonrisa_quotes" AFTER INSERT OR DELETE OR UPDATE ON "public"."sonrisa_quotes" FOR EACH ROW EXECUTE FUNCTION "public"."audit_trigger"();



CREATE OR REPLACE TRIGGER "audit_sonrisa_treatments" AFTER INSERT OR DELETE OR UPDATE ON "public"."sonrisa_treatments" FOR EACH ROW EXECUTE FUNCTION "public"."audit_trigger"();



CREATE OR REPLACE TRIGGER "eq_plans_touch" BEFORE UPDATE ON "public"."equilibrio_plans" FOR EACH ROW EXECUTE FUNCTION "public"."touch_updated_at"();



CREATE OR REPLACE TRIGGER "org_features_touch" BEFORE UPDATE ON "public"."org_features" FOR EACH ROW EXECUTE FUNCTION "public"."moddatetime_org_features"();



CREATE OR REPLACE TRIGGER "patient_tasks_touch" BEFORE UPDATE ON "public"."patient_tasks" FOR EACH ROW EXECUTE FUNCTION "public"."touch_updated_at"();



CREATE OR REPLACE TRIGGER "presc_touch" BEFORE UPDATE ON "public"."prescriptions" FOR EACH ROW EXECUTE FUNCTION "public"."touch_updated_at"();



CREATE OR REPLACE TRIGGER "pulso_targets_touch" BEFORE UPDATE ON "public"."pulso_targets" FOR EACH ROW EXECUTE FUNCTION "public"."touch_updated_at"();



CREATE OR REPLACE TRIGGER "reminder_prefs_touch" BEFORE UPDATE ON "public"."reminder_prefs" FOR EACH ROW EXECUTE FUNCTION "public"."moddatetime"();



CREATE OR REPLACE TRIGGER "saved_views_touch" BEFORE UPDATE ON "public"."saved_views" FOR EACH ROW EXECUTE FUNCTION "public"."touch_updated_at"();



CREATE OR REPLACE TRIGGER "set_closed_at" BEFORE UPDATE ON "public"."work_items" FOR EACH ROW EXECUTE FUNCTION "public"."trg_workitem_closed_at"();



CREATE OR REPLACE TRIGGER "set_owner_id" BEFORE INSERT ON "public"."patient_shares" FOR EACH ROW EXECUTE FUNCTION "public"."trg_ps_set_owner_id"();



CREATE OR REPLACE TRIGGER "sonrisa_quote_items_recalc" AFTER INSERT OR DELETE OR UPDATE ON "public"."sonrisa_quote_items" FOR EACH ROW EXECUTE FUNCTION "public"."recalc_quote_total_trg"();



CREATE OR REPLACE TRIGGER "sonrisa_quotes_touch" BEFORE UPDATE ON "public"."sonrisa_quotes" FOR EACH ROW EXECUTE FUNCTION "public"."touch_updated_at"();



CREATE OR REPLACE TRIGGER "sync_emails" BEFORE INSERT OR UPDATE ON "public"."patient_shares" FOR EACH ROW EXECUTE FUNCTION "public"."trg_ps_sync_emails"();



CREATE OR REPLACE TRIGGER "trg_agreements_acceptances_u" BEFORE UPDATE ON "public"."agreements_acceptances" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_audit_notes_upd" AFTER UPDATE ON "public"."patient_notes" FOR EACH ROW EXECUTE FUNCTION "public"."trg_audit_notes_upd"();



CREATE OR REPLACE TRIGGER "trg_audit_patients_upd" AFTER UPDATE ON "public"."patients" FOR EACH ROW EXECUTE FUNCTION "public"."trg_audit_patients_upd"();



CREATE OR REPLACE TRIGGER "trg_cal_raw_updated" BEFORE UPDATE ON "public"."cal_bookings_raw" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_concept_norm" BEFORE INSERT OR UPDATE ON "public"."concept_dictionary" FOR EACH ROW EXECUTE FUNCTION "public"."concept_norm_trg"();



CREATE OR REPLACE TRIGGER "trg_contacts_upd" BEFORE UPDATE ON "public"."contacts" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_dental_budgets_upd" BEFORE UPDATE ON "public"."dental_budgets" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_dental_charts_updated_at" BEFORE UPDATE ON "public"."dental_charts" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_drug_norm" BEFORE INSERT OR UPDATE ON "public"."drug_dictionary" FOR EACH ROW EXECUTE FUNCTION "public"."drug_norm_trg"();



CREATE OR REPLACE TRIGGER "trg_exercise_plans_upd" BEFORE UPDATE ON "public"."exercise_plans" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_generate_work_after_appt" AFTER INSERT ON "public"."appointments" FOR EACH ROW EXECUTE FUNCTION "public"."trg_generate_work_after_appt"();



CREATE OR REPLACE TRIGGER "trg_modules_updated" BEFORE UPDATE ON "public"."modules" FOR EACH ROW EXECUTE FUNCTION "public"."_set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_notes_updated_at" BEFORE UPDATE ON "public"."patient_notes" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_org_subscriptions_upd" BEFORE UPDATE ON "public"."org_subscriptions" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_pa_updated" BEFORE UPDATE ON "public"."patient_appointments" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_patient_file_defaults" BEFORE INSERT ON "public"."patient_files" FOR EACH ROW EXECUTE FUNCTION "public"."set_patient_file_defaults"();



CREATE OR REPLACE TRIGGER "trg_patient_note_defaults" BEFORE INSERT OR UPDATE ON "public"."patient_notes" FOR EACH ROW EXECUTE FUNCTION "public"."set_patient_note_defaults"();



CREATE OR REPLACE TRIGGER "trg_patient_notes_updated_at" BEFORE UPDATE ON "public"."patient_notes" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_patient_notes_version_delete" AFTER DELETE ON "public"."patient_notes" FOR EACH ROW EXECUTE FUNCTION "public"."log_note_version"();



CREATE OR REPLACE TRIGGER "trg_patient_notes_version_insert" AFTER INSERT ON "public"."patient_notes" FOR EACH ROW EXECUTE FUNCTION "public"."log_note_version"();



CREATE OR REPLACE TRIGGER "trg_patient_notes_version_update" AFTER UPDATE ON "public"."patient_notes" FOR EACH ROW EXECUTE FUNCTION "public"."log_note_version"();



CREATE OR REPLACE TRIGGER "trg_patients_defaults" BEFORE INSERT OR UPDATE ON "public"."patients" FOR EACH ROW EXECUTE FUNCTION "public"."set_patient_defaults"();



CREATE OR REPLACE TRIGGER "trg_patients_touch" BEFORE UPDATE ON "public"."patients" FOR EACH ROW EXECUTE FUNCTION "public"."touch_updated_at"();



CREATE OR REPLACE TRIGGER "trg_patients_updated_at" BEFORE UPDATE ON "public"."patients" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_rehab_sessions_updated_at" BEFORE UPDATE ON "public"."rehab_sessions" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_reminders_templates_updated" BEFORE UPDATE ON "public"."reminders_templates" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_reminders_touch" BEFORE UPDATE ON "public"."reminders" FOR EACH ROW EXECUTE FUNCTION "public"."_reminders_touch"();



CREATE OR REPLACE TRIGGER "trg_reminders_upd" BEFORE UPDATE ON "public"."reminders" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_report_schedules_updated" BEFORE UPDATE ON "public"."report_schedules" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_set_org_audit" BEFORE INSERT ON "public"."audit_log" FOR EACH ROW EXECUTE FUNCTION "public"."set_org_on_insert"();



CREATE OR REPLACE TRIGGER "trg_set_org_files" BEFORE INSERT ON "public"."patient_files" FOR EACH ROW EXECUTE FUNCTION "public"."set_org_on_insert"();



CREATE OR REPLACE TRIGGER "trg_set_org_notes" BEFORE INSERT ON "public"."patient_notes" FOR EACH ROW EXECUTE FUNCTION "public"."set_org_on_insert"();



CREATE OR REPLACE TRIGGER "trg_set_org_patients" BEFORE INSERT ON "public"."patients" FOR EACH ROW EXECUTE FUNCTION "public"."set_org_on_insert"();



CREATE OR REPLACE TRIGGER "trg_set_org_shares" BEFORE INSERT ON "public"."patient_shares" FOR EACH ROW EXECUTE FUNCTION "public"."set_org_on_insert"();



CREATE OR REPLACE TRIGGER "trg_set_updated_at_patient_notes" BEFORE UPDATE ON "public"."patient_notes" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_set_updated_at_patients" BEFORE UPDATE ON "public"."patients" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_templates_upd" BEFORE UPDATE ON "public"."reminder_templates" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_work_items_updated_at" BEFORE UPDATE ON "public"."work_items" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "work_templates_touch" BEFORE UPDATE ON "public"."work_templates" FOR EACH ROW EXECUTE FUNCTION "public"."moddatetime"();



ALTER TABLE ONLY "public"."agreements_acceptances"
    ADD CONSTRAINT "agreements_acceptances_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "public"."agreements_templates"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."appointments"
    ADD CONSTRAINT "appointments_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."appointments"
    ADD CONSTRAINT "appointments_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."bank_budgets"
    ADD CONSTRAINT "bank_budgets_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."bank_categories"("id");



ALTER TABLE ONLY "public"."bank_categories"
    ADD CONSTRAINT "bank_categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."bank_categories"("id");



ALTER TABLE ONLY "public"."bank_rules"
    ADD CONSTRAINT "bank_rules_set_category_id_fkey" FOREIGN KEY ("set_category_id") REFERENCES "public"."bank_categories"("id");



ALTER TABLE ONLY "public"."bank_tx"
    ADD CONSTRAINT "bank_tx_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."bank_accounts"("id");



ALTER TABLE ONLY "public"."bank_tx"
    ADD CONSTRAINT "bank_tx_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."bank_categories"("id");



ALTER TABLE ONLY "public"."dental_budget_items"
    ADD CONSTRAINT "dental_budget_items_budget_id_fkey" FOREIGN KEY ("budget_id") REFERENCES "public"."dental_budgets"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."drug_condition_alerts"
    ADD CONSTRAINT "drug_condition_alerts_condition_concept_id_fkey" FOREIGN KEY ("condition_concept_id") REFERENCES "public"."concept_dictionary"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."drug_condition_alerts"
    ADD CONSTRAINT "drug_condition_alerts_ingredient_id_fkey" FOREIGN KEY ("ingredient_id") REFERENCES "public"."drug_dictionary"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."drug_interactions"
    ADD CONSTRAINT "drug_interactions_a_ingredient_fkey" FOREIGN KEY ("a_ingredient") REFERENCES "public"."drug_dictionary"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."drug_interactions"
    ADD CONSTRAINT "drug_interactions_b_ingredient_fkey" FOREIGN KEY ("b_ingredient") REFERENCES "public"."drug_dictionary"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."equilibrio_checkins"
    ADD CONSTRAINT "equilibrio_checkins_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "public"."equilibrio_plan_items"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."equilibrio_checkins"
    ADD CONSTRAINT "equilibrio_checkins_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "public"."equilibrio_plans"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."equilibrio_plan_items"
    ADD CONSTRAINT "equilibrio_plan_items_library_id_fkey" FOREIGN KEY ("library_id") REFERENCES "public"."equilibrio_task_library"("id");



ALTER TABLE ONLY "public"."equilibrio_plan_items"
    ADD CONSTRAINT "equilibrio_plan_items_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "public"."equilibrio_plans"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."export_templates"
    ADD CONSTRAINT "export_templates_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id");



ALTER TABLE ONLY "public"."features"
    ADD CONSTRAINT "features_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "public"."modules"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."file_embeddings"
    ADD CONSTRAINT "file_embeddings_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."file_embeddings"
    ADD CONSTRAINT "file_embeddings_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."form_responses"
    ADD CONSTRAINT "form_responses_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."form_responses"
    ADD CONSTRAINT "form_responses_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "public"."form_templates"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."form_templates"
    ADD CONSTRAINT "form_templates_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."lab_request_items"
    ADD CONSTRAINT "lab_request_items_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "public"."lab_requests"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."lab_requests"
    ADD CONSTRAINT "lab_requests_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."lab_requests"
    ADD CONSTRAINT "lab_requests_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."lab_results"
    ADD CONSTRAINT "lab_results_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."lab_results"
    ADD CONSTRAINT "lab_results_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "public"."lab_requests"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."lab_upload_tokens"
    ADD CONSTRAINT "lab_upload_tokens_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "public"."lab_requests"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."note_embeddings"
    ADD CONSTRAINT "note_embeddings_note_id_fkey" FOREIGN KEY ("note_id") REFERENCES "public"."patient_notes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."note_embeddings"
    ADD CONSTRAINT "note_embeddings_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."note_embeddings"
    ADD CONSTRAINT "note_embeddings_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."note_templates"
    ADD CONSTRAINT "note_templates_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id");



ALTER TABLE ONLY "public"."org_features"
    ADD CONSTRAINT "org_features_feature_id_fkey" FOREIGN KEY ("feature_id") REFERENCES "public"."features"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."org_features"
    ADD CONSTRAINT "org_features_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."org_members"
    ADD CONSTRAINT "org_members_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."org_subscriptions"
    ADD CONSTRAINT "org_subscriptions_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."organization_members"
    ADD CONSTRAINT "organization_members_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."patient_appointments"
    ADD CONSTRAINT "patient_appointments_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."patient_conditions"
    ADD CONSTRAINT "patient_conditions_concept_id_fkey" FOREIGN KEY ("concept_id") REFERENCES "public"."concept_dictionary"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."patient_file_access_log"
    ADD CONSTRAINT "patient_file_access_log_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."patient_file_versions"
    ADD CONSTRAINT "patient_file_versions_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."patient_files"
    ADD CONSTRAINT "patient_files_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."patient_note_versions"
    ADD CONSTRAINT "patient_note_versions_note_id_fkey" FOREIGN KEY ("note_id") REFERENCES "public"."patient_notes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."patient_note_versions"
    ADD CONSTRAINT "patient_note_versions_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."patient_notes"
    ADD CONSTRAINT "patient_notes_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."patient_permissions"
    ADD CONSTRAINT "patient_permissions_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."patient_share_access"
    ADD CONSTRAINT "patient_share_access_share_id_fkey" FOREIGN KEY ("share_id") REFERENCES "public"."patient_shares"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."patient_shares"
    ADD CONSTRAINT "patient_shares_patient_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."patient_shares"
    ADD CONSTRAINT "patient_shares_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."patient_tags"
    ADD CONSTRAINT "patient_tags_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."patient_tags"
    ADD CONSTRAINT "patient_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."patient_tasks"
    ADD CONSTRAINT "patient_tasks_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "public"."patient_task_templates"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."prescription_items"
    ADD CONSTRAINT "prescription_items_prescription_id_fkey" FOREIGN KEY ("prescription_id") REFERENCES "public"."prescriptions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reminder_logs"
    ADD CONSTRAINT "reminder_logs_reminder_id_fkey" FOREIGN KEY ("reminder_id") REFERENCES "public"."reminders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reminder_queue"
    ADD CONSTRAINT "reminder_queue_assignment_fk" FOREIGN KEY ("assignment_id") REFERENCES "public"."work_assignments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reminders"
    ADD CONSTRAINT "reminders_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."reminders"
    ADD CONSTRAINT "reminders_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "public"."reminder_templates"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."saved_searches"
    ADD CONSTRAINT "saved_searches_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id");



ALTER TABLE ONLY "public"."sonrisa_quote_items"
    ADD CONSTRAINT "sonrisa_quote_items_quote_id_fkey" FOREIGN KEY ("quote_id") REFERENCES "public"."sonrisa_quotes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sonrisa_quote_items"
    ADD CONSTRAINT "sonrisa_quote_items_treatment_id_fkey" FOREIGN KEY ("treatment_id") REFERENCES "public"."sonrisa_treatments"("id");



ALTER TABLE ONLY "public"."tag_permissions"
    ADD CONSTRAINT "tag_permissions_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tag_permissions"
    ADD CONSTRAINT "tag_permissions_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tags"
    ADD CONSTRAINT "tags_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id");



ALTER TABLE ONLY "public"."user_prefs"
    ADD CONSTRAINT "user_prefs_current_org_id_fkey" FOREIGN KEY ("current_org_id") REFERENCES "public"."organizations"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."work_assignments"
    ADD CONSTRAINT "work_assignments_template_fk" FOREIGN KEY ("template_id") REFERENCES "public"."work_templates"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."work_items"
    ADD CONSTRAINT "work_items_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."work_items"
    ADD CONSTRAINT "work_items_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE CASCADE;



CREATE POLICY "acc_insert_member" ON "public"."agreements_acceptances" FOR INSERT TO "authenticated" WITH CHECK ("public"."is_member_of"("org_id"));



CREATE POLICY "acc_select_org" ON "public"."agreements_acceptances" FOR SELECT TO "authenticated" USING ("public"."is_member_of"("org_id"));



CREATE POLICY "acc_update_member" ON "public"."agreements_acceptances" FOR UPDATE TO "authenticated" USING ("public"."is_member_of"("org_id"));



ALTER TABLE "public"."agenda_alert_log" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "agenda_alert_log_read" ON "public"."agenda_alert_log" FOR SELECT USING ("public"."is_member_of"("org_id"));



CREATE POLICY "agenda_alert_log_write" ON "public"."agenda_alert_log" FOR INSERT WITH CHECK (("public"."is_member_of"("org_id") OR "public"."has_role"(ARRAY['owner'::"text", 'admin'::"text", 'clinician'::"text"])));



ALTER TABLE "public"."agreements_acceptances" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."agreements_templates" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "app_events_ro" ON "public"."appointments_events" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."appointments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."appointments_events" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "appt_rw" ON "public"."appointments" USING ("public"."is_member_of_org"("org_id", 'member'::"text")) WITH CHECK ("public"."is_member_of_org"("org_id", 'member'::"text"));



CREATE POLICY "audit select visible" ON "public"."audit_log" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."patients" "p"
  WHERE (("p"."id" = "audit_log"."patient_id") AND (("p"."user_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
           FROM "public"."patient_shares" "s"
          WHERE (("s"."patient_id" = "p"."id") AND ("lower"("s"."grantee_email") = "lower"("public"."jwt_email"()))))))))));



ALTER TABLE "public"."audit_log" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "audit_log_read_admin" ON "public"."audit_log" FOR SELECT USING ("public"."has_role"(ARRAY['owner'::"text", 'admin'::"text"]));



CREATE POLICY "audit_select_member" ON "public"."audit_log" FOR SELECT USING ("public"."is_member"("org_id"));



ALTER TABLE "public"."bank_accounts" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "bank_accounts_read" ON "public"."bank_accounts" FOR SELECT USING ("public"."is_member_of"("org_id"));



CREATE POLICY "bank_accounts_write" ON "public"."bank_accounts" USING (("public"."is_member_of"("org_id") AND "public"."has_role"(ARRAY['owner'::"text", 'admin'::"text", 'finance'::"text"]))) WITH CHECK (("public"."is_member_of"("org_id") AND "public"."has_role"(ARRAY['owner'::"text", 'admin'::"text", 'finance'::"text"])));



ALTER TABLE "public"."bank_budgets" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "bank_budgets_read" ON "public"."bank_budgets" FOR SELECT USING ("public"."is_member_of"("org_id"));



CREATE POLICY "bank_budgets_write" ON "public"."bank_budgets" USING (("public"."is_member_of"("org_id") AND "public"."has_role"(ARRAY['owner'::"text", 'admin'::"text", 'finance'::"text"]))) WITH CHECK (("public"."is_member_of"("org_id") AND "public"."has_role"(ARRAY['owner'::"text", 'admin'::"text", 'finance'::"text"])));



ALTER TABLE "public"."bank_categories" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "bank_categories_read" ON "public"."bank_categories" FOR SELECT USING ("public"."is_member_of"("org_id"));



CREATE POLICY "bank_categories_write" ON "public"."bank_categories" USING (("public"."is_member_of"("org_id") AND "public"."has_role"(ARRAY['owner'::"text", 'admin'::"text", 'finance'::"text"]))) WITH CHECK (("public"."is_member_of"("org_id") AND "public"."has_role"(ARRAY['owner'::"text", 'admin'::"text", 'finance'::"text"])));



ALTER TABLE "public"."bank_rules" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "bank_rules_read" ON "public"."bank_rules" FOR SELECT USING ("public"."is_member_of"("org_id"));



CREATE POLICY "bank_rules_write" ON "public"."bank_rules" USING (("public"."is_member_of"("org_id") AND "public"."has_role"(ARRAY['owner'::"text", 'admin'::"text", 'finance'::"text"]))) WITH CHECK (("public"."is_member_of"("org_id") AND "public"."has_role"(ARRAY['owner'::"text", 'admin'::"text", 'finance'::"text"])));



ALTER TABLE "public"."bank_tx" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "bank_tx_read" ON "public"."bank_tx" FOR SELECT USING ("public"."is_member_of"("org_id"));



CREATE POLICY "bank_tx_write" ON "public"."bank_tx" USING (("public"."is_member_of"("org_id") AND "public"."has_role"(ARRAY['owner'::"text", 'admin'::"text", 'finance'::"text"]))) WITH CHECK (("public"."is_member_of"("org_id") AND "public"."has_role"(ARRAY['owner'::"text", 'admin'::"text", 'finance'::"text"])));



ALTER TABLE "public"."cal_bookings_raw" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "cal_raw_select_via_pa" ON "public"."cal_bookings_raw" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM (("public"."patient_appointments" "pa"
     JOIN "public"."patients" "p" ON (("p"."id" = "pa"."patient_id")))
     LEFT JOIN "public"."patient_shares" "s" ON (("s"."patient_id" = "p"."id")))
  WHERE (("pa"."cal_uid" = "cal_bookings_raw"."cal_uid") AND (("p"."user_id" = "auth"."uid"()) OR (("p"."deleted_at" IS NULL) AND ("s"."shared_with_email" = ("auth"."jwt"() ->> 'email'::"text"))))))));



ALTER TABLE "public"."cal_webhooks" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "calw_read" ON "public"."cal_webhooks" FOR SELECT USING (true);



CREATE POLICY "cd_select" ON "public"."concept_dictionary" FOR SELECT USING (true);



ALTER TABLE "public"."concept_dictionary" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."contacts" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "contacts_rw" ON "public"."contacts" TO "authenticated" USING ("public"."is_member_of_org"("org_id", 'member'::"text")) WITH CHECK ("public"."is_member_of_org"("org_id", 'member'::"text"));



CREATE POLICY "dc_insert" ON "public"."discharges" FOR INSERT WITH CHECK (("public"."is_member_of"("org_id") AND "public"."has_role"(ARRAY['owner'::"text", 'admin'::"text", 'clinician'::"text", 'doctor'::"text"])));



CREATE POLICY "dc_select" ON "public"."discharges" FOR SELECT USING ("public"."is_member_of"("org_id"));



CREATE POLICY "dc_update" ON "public"."discharges" FOR UPDATE USING (("public"."is_member_of"("org_id") AND "public"."has_role"(ARRAY['owner'::"text", 'admin'::"text", 'clinician'::"text", 'doctor'::"text"])));



CREATE POLICY "dca_select" ON "public"."drug_condition_alerts" FOR SELECT USING (true);



CREATE POLICY "dd_select" ON "public"."drug_dictionary" FOR SELECT USING (true);



ALTER TABLE "public"."dental_budget_items" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "dental_budget_items_rw" ON "public"."dental_budget_items" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."dental_budgets" "b"
  WHERE (("b"."id" = "dental_budget_items"."budget_id") AND "public"."is_member_of_org"(COALESCE("b"."org_id", ( SELECT "p"."org_id"
           FROM "public"."patients" "p"
          WHERE ("p"."id" = "b"."patient_id"))), 'member'::"text"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."dental_budgets" "b"
  WHERE (("b"."id" = "dental_budget_items"."budget_id") AND "public"."is_member_of_org"(COALESCE("b"."org_id", ( SELECT "p"."org_id"
           FROM "public"."patients" "p"
          WHERE ("p"."id" = "b"."patient_id"))), 'member'::"text")))));



ALTER TABLE "public"."dental_budgets" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "dental_budgets_rw" ON "public"."dental_budgets" TO "authenticated" USING ("public"."is_member_of_org"(COALESCE("org_id", ( SELECT "p"."org_id"
   FROM "public"."patients" "p"
  WHERE ("p"."id" = "dental_budgets"."patient_id"))), 'member'::"text")) WITH CHECK ("public"."is_member_of_org"(COALESCE("org_id", ( SELECT "p"."org_id"
   FROM "public"."patients" "p"
  WHERE ("p"."id" = "dental_budgets"."patient_id"))), 'member'::"text"));



ALTER TABLE "public"."dental_charts" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "dental_del_org" ON "public"."dental_charts" FOR DELETE TO "authenticated" USING ("public"."is_member_of_org"(( SELECT "p"."org_id"
   FROM "public"."patients" "p"
  WHERE ("p"."id" = "dental_charts"."patient_id")), 'member'::"text"));



CREATE POLICY "dental_ins_upd_org" ON "public"."dental_charts" FOR INSERT TO "authenticated" WITH CHECK ("public"."is_member_of_org"(( SELECT "p"."org_id"
   FROM "public"."patients" "p"
  WHERE ("p"."id" = "dental_charts"."patient_id")), 'member'::"text"));



CREATE POLICY "dental_select_org" ON "public"."dental_charts" FOR SELECT TO "authenticated" USING ("public"."is_member_of_org"(( SELECT "p"."org_id"
   FROM "public"."patients" "p"
  WHERE ("p"."id" = "dental_charts"."patient_id")), 'member'::"text"));



CREATE POLICY "dental_upd_own" ON "public"."dental_charts" FOR UPDATE TO "authenticated" USING ("public"."is_member_of_org"(( SELECT "p"."org_id"
   FROM "public"."patients" "p"
  WHERE ("p"."id" = "dental_charts"."patient_id")), 'member'::"text")) WITH CHECK ("public"."is_member_of_org"(( SELECT "p"."org_id"
   FROM "public"."patients" "p"
  WHERE ("p"."id" = "dental_charts"."patient_id")), 'member'::"text"));



CREATE POLICY "dint_select" ON "public"."drug_interactions" FOR SELECT USING (true);



CREATE POLICY "dis_select" ON "public"."discharges" FOR SELECT USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "dis_write" ON "public"."discharges" USING (("auth"."uid"() IS NOT NULL)) WITH CHECK (("auth"."uid"() IS NOT NULL));



ALTER TABLE "public"."discharge_templates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."discharges" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "distpl_select" ON "public"."discharge_templates" FOR SELECT USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "distpl_write" ON "public"."discharge_templates" USING (("auth"."uid"() IS NOT NULL)) WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "dled_update" ON "public"."document_ledger" FOR UPDATE USING ("public"."can_revoke_document"("doc_type", "doc_id")) WITH CHECK ("public"."can_revoke_document"("doc_type", "doc_id"));



CREATE POLICY "dlh_rw" ON "public"."doctor_letterheads" USING (("auth"."uid"() IS NOT NULL)) WITH CHECK (("auth"."uid"() IS NOT NULL));



ALTER TABLE "public"."doctor_letterheads" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."document_ledger" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."drug_condition_alerts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."drug_dictionary" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."drug_interactions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "eq_checkins_insert" ON "public"."equilibrio_checkins" FOR INSERT WITH CHECK (("public"."is_member_of"("org_id") AND "public"."has_role"(ARRAY['owner'::"text", 'admin'::"text", 'clinician'::"text", 'coach'::"text"])));



CREATE POLICY "eq_checkins_select" ON "public"."equilibrio_checkins" FOR SELECT USING ("public"."is_member_of"("org_id"));



CREATE POLICY "eq_items_mod" ON "public"."equilibrio_plan_items" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."equilibrio_plans" "p"
  WHERE (("p"."id" = "equilibrio_plan_items"."plan_id") AND "public"."is_member_of"("p"."org_id") AND "public"."has_role"(ARRAY['owner'::"text", 'admin'::"text", 'clinician'::"text", 'coach'::"text"])))));



CREATE POLICY "eq_items_select" ON "public"."equilibrio_plan_items" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."equilibrio_plans" "p"
  WHERE (("p"."id" = "equilibrio_plan_items"."plan_id") AND "public"."is_member_of"("p"."org_id")))));



CREATE POLICY "eq_items_update" ON "public"."equilibrio_plan_items" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."equilibrio_plans" "p"
  WHERE (("p"."id" = "equilibrio_plan_items"."plan_id") AND "public"."is_member_of"("p"."org_id") AND "public"."has_role"(ARRAY['owner'::"text", 'admin'::"text", 'clinician'::"text", 'coach'::"text"]))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."equilibrio_plans" "p"
  WHERE (("p"."id" = "equilibrio_plan_items"."plan_id") AND "public"."is_member_of"("p"."org_id") AND "public"."has_role"(ARRAY['owner'::"text", 'admin'::"text", 'clinician'::"text", 'coach'::"text"])))));



CREATE POLICY "eq_lib_select" ON "public"."equilibrio_task_library" FOR SELECT USING ("public"."is_member_of"("org_id"));



CREATE POLICY "eq_lib_update" ON "public"."equilibrio_task_library" FOR UPDATE USING (("public"."is_member_of"("org_id") AND "public"."has_role"(ARRAY['owner'::"text", 'admin'::"text", 'clinician'::"text", 'coach'::"text"]))) WITH CHECK (("public"."is_member_of"("org_id") AND "public"."has_role"(ARRAY['owner'::"text", 'admin'::"text", 'clinician'::"text", 'coach'::"text"])));



CREATE POLICY "eq_lib_upsert" ON "public"."equilibrio_task_library" FOR INSERT WITH CHECK (("public"."is_member_of"("org_id") AND "public"."has_role"(ARRAY['owner'::"text", 'admin'::"text", 'clinician'::"text", 'coach'::"text"])));



CREATE POLICY "eq_plans_insert" ON "public"."equilibrio_plans" FOR INSERT WITH CHECK (("public"."is_member_of"("org_id") AND "public"."has_role"(ARRAY['owner'::"text", 'admin'::"text", 'clinician'::"text", 'coach'::"text"])));



CREATE POLICY "eq_plans_select" ON "public"."equilibrio_plans" FOR SELECT USING ("public"."is_member_of"("org_id"));



CREATE POLICY "eq_plans_update" ON "public"."equilibrio_plans" FOR UPDATE USING (("public"."is_member_of"("org_id") AND "public"."has_role"(ARRAY['owner'::"text", 'admin'::"text", 'clinician'::"text", 'coach'::"text"]))) WITH CHECK (("public"."is_member_of"("org_id") AND "public"."has_role"(ARRAY['owner'::"text", 'admin'::"text", 'clinician'::"text", 'coach'::"text"])));



ALTER TABLE "public"."equilibrio_checkins" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."equilibrio_plan_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."equilibrio_plans" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."equilibrio_task_library" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "et_delete" ON "public"."export_templates" FOR DELETE USING ((("owner_id" = "auth"."uid"()) OR (("org_id" IS NOT NULL) AND "public"."is_member_of_org"("org_id", 'admin'::"text"))));



CREATE POLICY "et_insert" ON "public"."export_templates" FOR INSERT WITH CHECK ((("owner_id" = "auth"."uid"()) OR (("org_id" IS NOT NULL) AND "public"."is_member_of_org"("org_id", 'admin'::"text"))));



CREATE POLICY "et_select" ON "public"."export_templates" FOR SELECT USING ((("owner_id" = "auth"."uid"()) OR (("org_id" IS NOT NULL) AND "public"."is_member_of_org"("org_id", 'member'::"text"))));



CREATE POLICY "et_update" ON "public"."export_templates" FOR UPDATE USING ((("owner_id" = "auth"."uid"()) OR (("org_id" IS NOT NULL) AND "public"."is_member_of_org"("org_id", 'admin'::"text")))) WITH CHECK ((("owner_id" = "auth"."uid"()) OR (("org_id" IS NOT NULL) AND "public"."is_member_of_org"("org_id", 'admin'::"text"))));



ALTER TABLE "public"."exercise_plans" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "exercise_plans_rw" ON "public"."exercise_plans" TO "authenticated" USING ("public"."is_member_of_org"(COALESCE("org_id", ( SELECT "p"."org_id"
   FROM "public"."patients" "p"
  WHERE ("p"."id" = "exercise_plans"."patient_id"))), 'member'::"text")) WITH CHECK ("public"."is_member_of_org"(COALESCE("org_id", ( SELECT "p"."org_id"
   FROM "public"."patients" "p"
  WHERE ("p"."id" = "exercise_plans"."patient_id"))), 'member'::"text"));



ALTER TABLE "public"."export_templates" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "fe_cud" ON "public"."file_embeddings" USING (("public"."patient_has_explicit_permission"("patient_id", 'manage_files'::"text") OR (EXISTS ( SELECT 1
   FROM "public"."patients" "p"
  WHERE (("p"."id" = "file_embeddings"."patient_id") AND (("p"."org_id" IS NOT NULL) AND "public"."is_member_of_org"("p"."org_id", 'admin'::"text"))))) OR "public"."patient_has_tag_permission"("patient_id", 'write'::"text"))) WITH CHECK (("public"."patient_has_explicit_permission"("patient_id", 'manage_files'::"text") OR (EXISTS ( SELECT 1
   FROM "public"."patients" "p"
  WHERE (("p"."id" = "file_embeddings"."patient_id") AND (("p"."org_id" IS NOT NULL) AND "public"."is_member_of_org"("p"."org_id", 'admin'::"text"))))) OR "public"."patient_has_tag_permission"("patient_id", 'write'::"text")));



CREATE POLICY "fe_select" ON "public"."file_embeddings" FOR SELECT USING (("public"."patient_has_explicit_permission"("patient_id", 'read'::"text") OR (EXISTS ( SELECT 1
   FROM "public"."patients" "p"
  WHERE (("p"."id" = "file_embeddings"."patient_id") AND (("p"."user_id" = "auth"."uid"()) OR (("p"."org_id" IS NOT NULL) AND "public"."is_member_of_org"("p"."org_id", 'member'::"text")))))) OR "public"."patient_has_tag_permission"("patient_id", 'read'::"text")));



ALTER TABLE "public"."file_embeddings" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "files delete owner or editor" ON "public"."patient_files" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."patients" "p"
  WHERE (("p"."id" = "patient_files"."patient_id") AND (("p"."user_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
           FROM "public"."patient_shares" "s"
          WHERE (("s"."patient_id" = "p"."id") AND ("lower"("s"."grantee_email") = "lower"("public"."jwt_email"())) AND ("s"."can_edit" = true)))))))));



CREATE POLICY "files insert owner or editor" ON "public"."patient_files" FOR INSERT WITH CHECK (((("user_id" = "auth"."uid"()) OR ("user_id" IS NULL)) AND ("bucket" = 'uploads'::"text") AND ("split_part"("path", '/'::"text", 1) = ("auth"."uid"())::"text") AND (EXISTS ( SELECT 1
   FROM "public"."patients" "p"
  WHERE (("p"."id" = "patient_files"."patient_id") AND (("p"."user_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
           FROM "public"."patient_shares" "s"
          WHERE (("s"."patient_id" = "p"."id") AND ("s"."can_edit" = true) AND ("lower"("s"."grantee_email") = "lower"("public"."jwt_email"())))))))))));



CREATE POLICY "files select own or shared" ON "public"."patient_files" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."patients" "p"
  WHERE (("p"."id" = "patient_files"."patient_id") AND (("p"."user_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
           FROM "public"."patient_shares" "s"
          WHERE (("s"."patient_id" = "p"."id") AND ("lower"("s"."grantee_email") = "lower"("public"."jwt_email"()))))))))));



CREATE POLICY "files update owner or editor" ON "public"."patient_files" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."patients" "p"
  WHERE (("p"."id" = "patient_files"."patient_id") AND (("p"."user_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
           FROM "public"."patient_shares" "s"
          WHERE (("s"."patient_id" = "p"."id") AND ("lower"("s"."grantee_email") = "lower"("public"."jwt_email"())) AND ("s"."can_edit" = true)))))))));



ALTER TABLE "public"."form_responses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."form_templates" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "fr_insert" ON "public"."form_responses" FOR INSERT WITH CHECK (("public"."patient_has_explicit_permission"("patient_id", 'edit_notes'::"text") OR (EXISTS ( SELECT 1
   FROM "public"."patients" "p"
  WHERE (("p"."id" = "form_responses"."patient_id") AND (("p"."user_id" = "auth"."uid"()) OR (("p"."org_id" IS NOT NULL) AND "public"."is_member_of_org"("p"."org_id", 'member'::"text")))))) OR "public"."patient_has_tag_permission"("patient_id", 'write'::"text")));



CREATE POLICY "fr_select" ON "public"."form_responses" FOR SELECT USING (("public"."patient_has_explicit_permission"("patient_id", 'read'::"text") OR (EXISTS ( SELECT 1
   FROM "public"."patients" "p"
  WHERE (("p"."id" = "form_responses"."patient_id") AND (("p"."user_id" = "auth"."uid"()) OR (("p"."org_id" IS NOT NULL) AND "public"."is_member_of_org"("p"."org_id", 'member'::"text")))))) OR "public"."patient_has_tag_permission"("patient_id", 'read'::"text")));



CREATE POLICY "frm_resp_insert" ON "public"."form_responses" FOR INSERT WITH CHECK (("public"."is_member_of"("org_id") AND "public"."has_role"(ARRAY['owner'::"text", 'admin'::"text", 'clinician'::"text", 'doctor'::"text"])));



CREATE POLICY "frm_resp_select" ON "public"."form_responses" FOR SELECT USING ("public"."is_member_of"("org_id"));



CREATE POLICY "frm_resp_update" ON "public"."form_responses" FOR UPDATE USING (("public"."is_member_of"("org_id") AND "public"."has_role"(ARRAY['owner'::"text", 'admin'::"text", 'clinician'::"text", 'doctor'::"text"])));



CREATE POLICY "frm_tpl_select" ON "public"."form_templates" FOR SELECT USING ("public"."is_member_of"("org_id"));



CREATE POLICY "frm_tpl_update" ON "public"."form_templates" FOR UPDATE USING (("public"."is_member_of"("org_id") AND "public"."has_role"(ARRAY['owner'::"text", 'admin'::"text", 'clinician'::"text", 'doctor'::"text"])));



CREATE POLICY "frm_tpl_write" ON "public"."form_templates" FOR INSERT WITH CHECK (("public"."is_member_of"("org_id") AND "public"."has_role"(ARRAY['owner'::"text", 'admin'::"text", 'clinician'::"text", 'doctor'::"text"])));



CREATE POLICY "ft_modify" ON "public"."form_templates" USING ("public"."is_member_of_org"("org_id", 'admin'::"text")) WITH CHECK ("public"."is_member_of_org"("org_id", 'admin'::"text"));



CREATE POLICY "ft_select" ON "public"."form_templates" FOR SELECT USING ("public"."is_member_of_org"("org_id", 'member'::"text"));



CREATE POLICY "jfw_read" ON "public"."jotform_webhooks" FOR SELECT USING (true);



ALTER TABLE "public"."jotform_webhooks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."lab_request_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."lab_requests" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."lab_results" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."lab_test_templates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."lab_upload_tokens" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "labitems_rw" ON "public"."lab_request_items" USING ((EXISTS ( SELECT 1
   FROM "public"."lab_requests" "r"
  WHERE (("r"."id" = "lab_request_items"."request_id") AND "public"."is_member_of_org"("r"."org_id", 'member'::"text"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."lab_requests" "r"
  WHERE (("r"."id" = "lab_request_items"."request_id") AND "public"."is_member_of_org"("r"."org_id", 'member'::"text")))));



CREATE POLICY "labreq_modify" ON "public"."lab_requests" USING ("public"."is_member_of_org"("org_id", 'member'::"text")) WITH CHECK ("public"."is_member_of_org"("org_id", 'member'::"text"));



CREATE POLICY "labreq_select" ON "public"."lab_requests" FOR SELECT USING (("public"."patient_has_explicit_permission"("patient_id", 'read'::"text") OR (EXISTS ( SELECT 1
   FROM "public"."patients" "p"
  WHERE (("p"."id" = "lab_requests"."patient_id") AND (("p"."user_id" = "auth"."uid"()) OR (("p"."org_id" IS NOT NULL) AND "public"."is_member_of_org"("p"."org_id", 'member'::"text")))))) OR "public"."patient_has_tag_permission"("patient_id", 'read'::"text")));



CREATE POLICY "labres_modify" ON "public"."lab_results" USING ((EXISTS ( SELECT 1
   FROM "public"."lab_requests" "r"
  WHERE (("r"."id" = "lab_results"."request_id") AND "public"."is_member_of_org"("r"."org_id", 'member'::"text"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."lab_requests" "r"
  WHERE (("r"."id" = "lab_results"."request_id") AND "public"."is_member_of_org"("r"."org_id", 'member'::"text")))));



CREATE POLICY "labres_select" ON "public"."lab_results" FOR SELECT USING (("public"."patient_has_explicit_permission"("patient_id", 'read'::"text") OR (EXISTS ( SELECT 1
   FROM "public"."patients" "p"
  WHERE (("p"."id" = "lab_results"."patient_id") AND (("p"."user_id" = "auth"."uid"()) OR (("p"."org_id" IS NOT NULL) AND "public"."is_member_of_org"("p"."org_id", 'member'::"text")))))) OR "public"."patient_has_tag_permission"("patient_id", 'read'::"text")));



CREATE POLICY "labtokens_rw" ON "public"."lab_upload_tokens" USING ((EXISTS ( SELECT 1
   FROM "public"."lab_requests" "r"
  WHERE (("r"."id" = "lab_upload_tokens"."request_id") AND "public"."is_member_of_org"("r"."org_id", 'member'::"text"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."lab_requests" "r"
  WHERE (("r"."id" = "lab_upload_tokens"."request_id") AND "public"."is_member_of_org"("r"."org_id", 'member'::"text")))));



CREATE POLICY "logs_ro" ON "public"."reminder_logs" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."reminders" "r"
  WHERE (("r"."id" = "reminder_logs"."reminder_id") AND "public"."is_member_of_org"("r"."org_id", 'member'::"text")))));



CREATE POLICY "members_delete_admin" ON "public"."org_members" FOR DELETE TO "authenticated" USING ("public"."role_at_least"("org_id", 'admin'::"text"));



CREATE POLICY "members_insert_admin" ON "public"."org_members" FOR INSERT TO "authenticated" WITH CHECK ("public"."role_at_least"("org_id", 'admin'::"text"));



CREATE POLICY "members_select_self" ON "public"."org_members" FOR SELECT TO "authenticated" USING ((("user_id" = "auth"."uid"()) OR "public"."role_at_least"("org_id", 'admin'::"text")));



CREATE POLICY "members_update_admin" ON "public"."org_members" FOR UPDATE TO "authenticated" USING ("public"."role_at_least"("org_id", 'admin'::"text")) WITH CHECK ("public"."role_at_least"("org_id", 'admin'::"text"));



ALTER TABLE "public"."mente_assessments" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "mente_assessments_insert" ON "public"."mente_assessments" FOR INSERT WITH CHECK (("public"."is_member_of"("org_id") AND "public"."has_role"(ARRAY['owner'::"text", 'admin'::"text", 'clinician'::"text"])));



CREATE POLICY "mente_assessments_select" ON "public"."mente_assessments" FOR SELECT USING ("public"."is_member_of"("org_id"));



ALTER TABLE "public"."mente_sessions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "mente_sessions_insert" ON "public"."mente_sessions" FOR INSERT WITH CHECK (("public"."is_member_of"("org_id") AND "public"."has_role"(ARRAY['owner'::"text", 'admin'::"text", 'clinician'::"text"])));



CREATE POLICY "mente_sessions_select" ON "public"."mente_sessions" FOR SELECT USING ("public"."is_member_of"("org_id"));



CREATE POLICY "mente_sessions_update" ON "public"."mente_sessions" FOR UPDATE USING (("public"."is_member_of"("org_id") AND "public"."has_role"(ARRAY['owner'::"text", 'admin'::"text", 'clinician'::"text"]))) WITH CHECK (("public"."is_member_of"("org_id") AND "public"."has_role"(ARRAY['owner'::"text", 'admin'::"text", 'clinician'::"text"])));



CREATE POLICY "ne_ins" ON "public"."note_embeddings" FOR INSERT WITH CHECK (("public"."patient_has_explicit_permission"("patient_id", 'edit_notes'::"text") OR (EXISTS ( SELECT 1
   FROM "public"."patients" "p"
  WHERE (("p"."id" = "note_embeddings"."patient_id") AND (("p"."org_id" IS NOT NULL) AND "public"."is_member_of_org"("p"."org_id", 'admin'::"text"))))) OR "public"."patient_has_tag_permission"("patient_id", 'write'::"text")));



CREATE POLICY "ne_select" ON "public"."note_embeddings" FOR SELECT USING (("public"."patient_has_explicit_permission"("patient_id", 'read'::"text") OR (EXISTS ( SELECT 1
   FROM "public"."patients" "p"
  WHERE (("p"."id" = "note_embeddings"."patient_id") AND (("p"."user_id" = "auth"."uid"()) OR (("p"."org_id" IS NOT NULL) AND "public"."is_member_of_org"("p"."org_id", 'member'::"text")))))) OR "public"."patient_has_tag_permission"("patient_id", 'read'::"text")));



CREATE POLICY "ne_upd" ON "public"."note_embeddings" FOR UPDATE USING (("public"."patient_has_explicit_permission"("patient_id", 'edit_notes'::"text") OR (EXISTS ( SELECT 1
   FROM "public"."patients" "p"
  WHERE (("p"."id" = "note_embeddings"."patient_id") AND (("p"."org_id" IS NOT NULL) AND "public"."is_member_of_org"("p"."org_id", 'admin'::"text"))))) OR "public"."patient_has_tag_permission"("patient_id", 'write'::"text"))) WITH CHECK (("public"."patient_has_explicit_permission"("patient_id", 'edit_notes'::"text") OR (EXISTS ( SELECT 1
   FROM "public"."patients" "p"
  WHERE (("p"."id" = "note_embeddings"."patient_id") AND (("p"."org_id" IS NOT NULL) AND "public"."is_member_of_org"("p"."org_id", 'admin'::"text"))))) OR "public"."patient_has_tag_permission"("patient_id", 'write'::"text")));



CREATE POLICY "ni_read" ON "public"."notify_inbound" FOR SELECT USING (true);



ALTER TABLE "public"."note_embeddings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."note_templates" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "notes delete own-patient" ON "public"."patient_notes" FOR DELETE TO "authenticated" USING ((("user_id" = "auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM "public"."patients" "p"
  WHERE (("p"."id" = "patient_notes"."patient_id") AND ("p"."user_id" = "auth"."uid"()))))));



CREATE POLICY "notes delete owner or editor" ON "public"."patient_notes" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."patients" "p"
  WHERE (("p"."id" = "patient_notes"."patient_id") AND (("p"."user_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
           FROM "public"."patient_shares" "s"
          WHERE (("s"."patient_id" = "p"."id") AND ("lower"("s"."grantee_email") = "lower"("public"."jwt_email"())) AND ("s"."can_edit" = true)))))))));



CREATE POLICY "notes insert own-patient" ON "public"."patient_notes" FOR INSERT TO "authenticated" WITH CHECK (((("user_id" = "auth"."uid"()) OR ("user_id" IS NULL)) AND (EXISTS ( SELECT 1
   FROM "public"."patients" "p"
  WHERE (("p"."id" = "patient_notes"."patient_id") AND ("p"."user_id" = "auth"."uid"()))))));



CREATE POLICY "notes insert owner or editor" ON "public"."patient_notes" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."patients" "p"
  WHERE (("p"."id" = "patient_notes"."patient_id") AND (("p"."user_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
           FROM "public"."patient_shares" "s"
          WHERE (("s"."patient_id" = "p"."id") AND ("lower"("s"."grantee_email") = "lower"("public"."jwt_email"())) AND ("s"."can_edit" = true)))))))));



CREATE POLICY "notes select own or shared" ON "public"."patient_notes" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."patients" "p"
  WHERE (("p"."id" = "patient_notes"."patient_id") AND (("p"."user_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
           FROM "public"."patient_shares" "s"
          WHERE (("s"."patient_id" = "p"."id") AND ("lower"("s"."grantee_email") = "lower"("public"."jwt_email"()))))))))));



CREATE POLICY "notes select own-patient" ON "public"."patient_notes" FOR SELECT TO "authenticated" USING ((("user_id" = "auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM "public"."patients" "p"
  WHERE (("p"."id" = "patient_notes"."patient_id") AND ("p"."user_id" = "auth"."uid"()))))));



CREATE POLICY "notes update own-patient" ON "public"."patient_notes" FOR UPDATE TO "authenticated" USING ((("user_id" = "auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM "public"."patients" "p"
  WHERE (("p"."id" = "patient_notes"."patient_id") AND ("p"."user_id" = "auth"."uid"()))))));



CREATE POLICY "notes update owner or editor" ON "public"."patient_notes" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."patients" "p"
  WHERE (("p"."id" = "patient_notes"."patient_id") AND (("p"."user_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
           FROM "public"."patient_shares" "s"
          WHERE (("s"."patient_id" = "p"."id") AND ("lower"("s"."grantee_email") = "lower"("public"."jwt_email"())) AND ("s"."can_edit" = true)))))))));



CREATE POLICY "notes_delete_author_or_owner" ON "public"."patient_notes" FOR DELETE USING ((("user_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."patients" "p"
  WHERE (("p"."id" = "patient_notes"."patient_id") AND ("p"."user_id" = "auth"."uid"()))))));



CREATE POLICY "notes_delete_by_explicit" ON "public"."patient_notes" FOR DELETE USING ("public"."patient_has_explicit_permission"("patient_id", 'edit_notes'::"text"));



CREATE POLICY "notes_delete_by_tag" ON "public"."patient_notes" FOR DELETE USING ("public"."patient_has_tag_permission"("patient_id", 'write'::"text"));



CREATE POLICY "notes_delete_own" ON "public"."patient_notes" FOR DELETE TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "notes_insert_by_explicit" ON "public"."patient_notes" FOR INSERT WITH CHECK ("public"."patient_has_explicit_permission"("patient_id", 'edit_notes'::"text"));



CREATE POLICY "notes_insert_by_tag" ON "public"."patient_notes" FOR INSERT WITH CHECK ("public"."patient_has_tag_permission"("patient_id", 'write'::"text"));



CREATE POLICY "notes_insert_owned_with_access" ON "public"."patient_notes" FOR INSERT WITH CHECK ((("user_id" = "auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM ("public"."patients" "p"
     LEFT JOIN "public"."patient_shares" "s" ON (("s"."patient_id" = "p"."id")))
  WHERE (("p"."id" = "patient_notes"."patient_id") AND (("p"."user_id" = "auth"."uid"()) OR ((("s"."shared_with_user_id" = "auth"."uid"()) OR ("s"."shared_with_email" = ("auth"."jwt"() ->> 'email'::"text"))) AND ("s"."permission" = ANY (ARRAY['write'::"public"."permission_level", 'read'::"public"."permission_level"])))))))));



CREATE POLICY "notes_insert_self" ON "public"."patient_notes" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "notes_select_by_explicit" ON "public"."patient_notes" FOR SELECT USING ("public"."patient_has_explicit_permission"("patient_id", 'read'::"text"));



CREATE POLICY "notes_select_by_tag" ON "public"."patient_notes" FOR SELECT USING ("public"."patient_has_tag_permission"("patient_id", 'read'::"text"));



CREATE POLICY "notes_select_own" ON "public"."patient_notes" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "notes_select_own_or_shared" ON "public"."patient_notes" FOR SELECT USING ((("user_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM ("public"."patients" "p"
     LEFT JOIN "public"."patient_shares" "s" ON (("s"."patient_id" = "p"."id")))
  WHERE (("p"."id" = "patient_notes"."patient_id") AND (("p"."user_id" = "auth"."uid"()) OR ("s"."shared_with_user_id" = "auth"."uid"()) OR ("s"."shared_with_email" = ("auth"."jwt"() ->> 'email'::"text"))))))));



CREATE POLICY "notes_update_author_or_owner" ON "public"."patient_notes" FOR UPDATE USING ((("user_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."patients" "p"
  WHERE (("p"."id" = "patient_notes"."patient_id") AND ("p"."user_id" = "auth"."uid"())))))) WITH CHECK ((("user_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."patients" "p"
  WHERE (("p"."id" = "patient_notes"."patient_id") AND ("p"."user_id" = "auth"."uid"()))))));



CREATE POLICY "notes_update_by_explicit" ON "public"."patient_notes" FOR UPDATE USING ("public"."patient_has_explicit_permission"("patient_id", 'edit_notes'::"text")) WITH CHECK ("public"."patient_has_explicit_permission"("patient_id", 'edit_notes'::"text"));



CREATE POLICY "notes_update_by_tag" ON "public"."patient_notes" FOR UPDATE USING ("public"."patient_has_tag_permission"("patient_id", 'write'::"text")) WITH CHECK ("public"."patient_has_tag_permission"("patient_id", 'write'::"text"));



CREATE POLICY "notes_update_own" ON "public"."patient_notes" FOR UPDATE TO "authenticated" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."notify_inbound" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notify_status" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "ns_read" ON "public"."notify_status" FOR SELECT USING (true);



CREATE POLICY "nt_delete" ON "public"."note_templates" FOR DELETE USING ((("owner_id" = "auth"."uid"()) OR (("org_id" IS NOT NULL) AND "public"."is_member_of_org"("org_id", 'admin'::"text"))));



CREATE POLICY "nt_insert" ON "public"."note_templates" FOR INSERT WITH CHECK ((("owner_id" = "auth"."uid"()) OR (("org_id" IS NOT NULL) AND "public"."is_member_of_org"("org_id", 'admin'::"text"))));



CREATE POLICY "nt_select" ON "public"."note_templates" FOR SELECT USING ((("owner_id" = "auth"."uid"()) OR (("org_id" IS NOT NULL) AND "public"."is_member_of_org"("org_id", 'member'::"text"))));



CREATE POLICY "nt_update" ON "public"."note_templates" FOR UPDATE USING ((("owner_id" = "auth"."uid"()) OR (("org_id" IS NOT NULL) AND "public"."is_member_of_org"("org_id", 'admin'::"text")))) WITH CHECK ((("owner_id" = "auth"."uid"()) OR (("org_id" IS NOT NULL) AND "public"."is_member_of_org"("org_id", 'admin'::"text"))));



CREATE POLICY "obs_ro" ON "public"."org_bank_settings" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "od_rw" ON "public"."org_disclaimers" USING (("auth"."uid"() IS NOT NULL)) WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "oinv_select_org" ON "public"."org_invoices" FOR SELECT TO "authenticated" USING ("public"."is_member_of_org"("org_id", 'member'::"text"));



CREATE POLICY "olt_select_org" ON "public"."org_ledger_transactions" FOR SELECT TO "authenticated" USING ("public"."is_member_of_org"("org_id", 'member'::"text"));



CREATE POLICY "om_delete" ON "public"."organization_members" FOR DELETE USING (false);



CREATE POLICY "om_insert" ON "public"."organization_members" FOR INSERT WITH CHECK (false);



CREATE POLICY "om_update" ON "public"."organization_members" FOR UPDATE USING (false) WITH CHECK (false);



ALTER TABLE "public"."org_bank_settings" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "org_delete" ON "public"."organizations" FOR DELETE USING (("owner_user_id" = "auth"."uid"()));



ALTER TABLE "public"."org_disclaimers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."org_features" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "org_features_ro" ON "public"."org_features" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "org_insert" ON "public"."organizations" FOR INSERT WITH CHECK (("owner_user_id" = "auth"."uid"()));



ALTER TABLE "public"."org_invoices" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."org_ledger_transactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."org_members" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "org_members_can_read" ON "public"."org_features" FOR SELECT USING (true);



CREATE POLICY "org_select" ON "public"."organizations" FOR SELECT USING ((("owner_user_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."organization_members" "m"
  WHERE (("m"."org_id" = "organizations"."id") AND ("m"."user_id" = "auth"."uid"()))))));



CREATE POLICY "org_update" ON "public"."organizations" FOR UPDATE USING ((("owner_user_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."organization_members" "m"
  WHERE (("m"."org_id" = "organizations"."id") AND ("m"."user_id" = "auth"."uid"()) AND ("m"."role" = ANY (ARRAY['owner'::"text", 'admin'::"text"]))))))) WITH CHECK ((("owner_user_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."organization_members" "m"
  WHERE (("m"."org_id" = "organizations"."id") AND ("m"."user_id" = "auth"."uid"()) AND ("m"."role" = ANY (ARRAY['owner'::"text", 'admin'::"text"])))))));



ALTER TABLE "public"."organization_members" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."organizations" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "orgm_delete" ON "public"."organization_members" FOR DELETE USING (((EXISTS ( SELECT 1
   FROM "public"."organization_members" "m2"
  WHERE (("m2"."org_id" = "organization_members"."org_id") AND ("m2"."user_id" = "auth"."uid"()) AND ("m2"."role" = ANY (ARRAY['owner'::"text", 'admin'::"text"]))))) OR (EXISTS ( SELECT 1
   FROM "public"."organizations" "o"
  WHERE (("o"."id" = "organization_members"."org_id") AND ("o"."owner_user_id" = "auth"."uid"()))))));



CREATE POLICY "orgm_insert" ON "public"."organization_members" FOR INSERT WITH CHECK (((EXISTS ( SELECT 1
   FROM "public"."organization_members" "m2"
  WHERE (("m2"."org_id" = "organization_members"."org_id") AND ("m2"."user_id" = "auth"."uid"()) AND ("m2"."role" = ANY (ARRAY['owner'::"text", 'admin'::"text"]))))) OR (EXISTS ( SELECT 1
   FROM "public"."organizations" "o"
  WHERE (("o"."id" = "organization_members"."org_id") AND ("o"."owner_user_id" = "auth"."uid"()))))));



CREATE POLICY "orgm_select" ON "public"."organization_members" FOR SELECT USING (((EXISTS ( SELECT 1
   FROM "public"."organization_members" "m2"
  WHERE (("m2"."org_id" = "organization_members"."org_id") AND ("m2"."user_id" = "auth"."uid"())))) OR (EXISTS ( SELECT 1
   FROM "public"."organizations" "o"
  WHERE (("o"."id" = "organization_members"."org_id") AND ("o"."owner_user_id" = "auth"."uid"()))))));



CREATE POLICY "orgm_self_select" ON "public"."organization_members" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "orgm_update" ON "public"."organization_members" FOR UPDATE USING (((EXISTS ( SELECT 1
   FROM "public"."organization_members" "m2"
  WHERE (("m2"."org_id" = "organization_members"."org_id") AND ("m2"."user_id" = "auth"."uid"()) AND ("m2"."role" = ANY (ARRAY['owner'::"text", 'admin'::"text"]))))) OR (EXISTS ( SELECT 1
   FROM "public"."organizations" "o"
  WHERE (("o"."id" = "organization_members"."org_id") AND ("o"."owner_user_id" = "auth"."uid"())))))) WITH CHECK (((EXISTS ( SELECT 1
   FROM "public"."organization_members" "m2"
  WHERE (("m2"."org_id" = "organization_members"."org_id") AND ("m2"."user_id" = "auth"."uid"()) AND ("m2"."role" = ANY (ARRAY['owner'::"text", 'admin'::"text"]))))) OR (EXISTS ( SELECT 1
   FROM "public"."organizations" "o"
  WHERE (("o"."id" = "organization_members"."org_id") AND ("o"."owner_user_id" = "auth"."uid"()))))));



CREATE POLICY "orgs_delete_owner" ON "public"."organizations" FOR DELETE TO "authenticated" USING ("public"."role_at_least"("id", 'owner'::"text"));



CREATE POLICY "orgs_insert_self" ON "public"."organizations" FOR INSERT TO "authenticated" WITH CHECK (("created_by" = "auth"."uid"()));



CREATE POLICY "orgs_select_members" ON "public"."organizations" FOR SELECT TO "authenticated" USING ("public"."is_member"("id"));



CREATE POLICY "orgs_update_owner_admin" ON "public"."organizations" FOR UPDATE TO "authenticated" USING ("public"."role_at_least"("id", 'admin'::"text")) WITH CHECK ("public"."role_at_least"("id", 'admin'::"text"));



CREATE POLICY "pa_delete" ON "public"."patient_appointments" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."patients" "p"
  WHERE (("p"."id" = "patient_appointments"."patient_id") AND ("p"."user_id" = "auth"."uid"()) AND ("p"."deleted_at" IS NULL)))));



CREATE POLICY "pa_insert" ON "public"."patient_appointments" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."patients" "p"
  WHERE (("p"."id" = "patient_appointments"."patient_id") AND ("p"."user_id" = "auth"."uid"()) AND ("p"."deleted_at" IS NULL)))));



CREATE POLICY "pa_select" ON "public"."patient_appointments" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."patients" "p"
     LEFT JOIN "public"."patient_shares" "s" ON (("s"."patient_id" = "p"."id")))
  WHERE (("p"."id" = "patient_appointments"."patient_id") AND (("p"."user_id" = "auth"."uid"()) OR (("p"."deleted_at" IS NULL) AND (("s"."shared_with_user_id" = "auth"."uid"()) OR ("s"."shared_with_email" = ("auth"."jwt"() ->> 'email'::"text")))))))));



CREATE POLICY "pa_update" ON "public"."patient_appointments" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."patients" "p"
  WHERE (("p"."id" = "patient_appointments"."patient_id") AND ("p"."user_id" = "auth"."uid"()) AND ("p"."deleted_at" IS NULL))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."patients" "p"
  WHERE (("p"."id" = "patient_appointments"."patient_id") AND ("p"."user_id" = "auth"."uid"()) AND ("p"."deleted_at" IS NULL)))));



ALTER TABLE "public"."patient_appointments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."patient_conditions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."patient_file_access_log" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."patient_file_versions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."patient_files" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."patient_labels" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "patient_labels_read" ON "public"."patient_labels" FOR SELECT USING ("public"."is_member_of"("org_id"));



CREATE POLICY "patient_labels_write" ON "public"."patient_labels" USING ("public"."is_member_of"("org_id")) WITH CHECK ("public"."is_member_of"("org_id"));



ALTER TABLE "public"."patient_medications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."patient_note_versions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."patient_notes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."patient_panels" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."patient_permissions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."patient_providers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."patient_shares" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "patient_shares_read" ON "public"."patient_shares" FOR SELECT USING ("public"."is_member_of"("org_id"));



CREATE POLICY "patient_shares_write" ON "public"."patient_shares" USING (("public"."is_member_of"("org_id") AND "public"."has_role"(ARRAY['owner'::"text", 'admin'::"text", 'clinician'::"text"]))) WITH CHECK (("public"."is_member_of"("org_id") AND "public"."has_role"(ARRAY['owner'::"text", 'admin'::"text", 'clinician'::"text"])));



ALTER TABLE "public"."patient_tags" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."patient_task_templates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."patient_tasks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."patients" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "patients delete own" ON "public"."patients" FOR DELETE TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "patients insert own" ON "public"."patients" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "patients select own or shared" ON "public"."patients" FOR SELECT TO "authenticated" USING ((("user_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."patient_shares" "s"
  WHERE (("s"."patient_id" = "patients"."id") AND ("lower"("s"."grantee_email") = "lower"("public"."jwt_email"())))))));



CREATE POLICY "patients update own" ON "public"."patients" FOR UPDATE TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "patients_delete_admin" ON "public"."patients" FOR DELETE USING ("public"."role_at_least"("org_id", 'admin'::"text"));



CREATE POLICY "patients_delete_org" ON "public"."patients" FOR DELETE USING (((("org_id" IS NOT NULL) AND "public"."is_member_of_org"("org_id", 'admin'::"text")) OR ("user_id" = "auth"."uid"())));



CREATE POLICY "patients_delete_own" ON "public"."patients" FOR DELETE USING (("user_id" = "auth"."uid"()));



CREATE POLICY "patients_insert_editor" ON "public"."patients" FOR INSERT WITH CHECK ("public"."role_at_least"("org_id", 'editor'::"text"));



CREATE POLICY "patients_insert_org" ON "public"."patients" FOR INSERT WITH CHECK ((("user_id" = "auth"."uid"()) AND (("org_id" IS NULL) OR "public"."is_member_of_org"("org_id", 'member'::"text"))));



CREATE POLICY "patients_insert_own" ON "public"."patients" FOR INSERT WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "patients_select_by_explicit" ON "public"."patients" FOR SELECT USING ("public"."patient_has_explicit_permission"("id", 'read'::"text"));



CREATE POLICY "patients_select_by_tag" ON "public"."patients" FOR SELECT USING ("public"."patient_has_tag_permission"("id", 'read'::"text"));



CREATE POLICY "patients_select_member" ON "public"."patients" FOR SELECT USING ("public"."is_member"("org_id"));



CREATE POLICY "patients_select_org" ON "public"."patients" FOR SELECT USING ((("org_id" IS NOT NULL) AND "public"."is_member_of_org"("org_id", 'member'::"text")));



CREATE POLICY "patients_select_own_or_shared" ON "public"."patients" FOR SELECT USING ((("user_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."patient_shares" "s"
  WHERE (("s"."patient_id" = "patients"."id") AND (("s"."shared_with_user_id" = "auth"."uid"()) OR ("s"."shared_with_email" = ("auth"."jwt"() ->> 'email'::"text"))))))));



CREATE POLICY "patients_update_by_explicit" ON "public"."patients" FOR UPDATE USING ("public"."patient_has_explicit_permission"("id", 'edit_notes'::"text")) WITH CHECK ("public"."patient_has_explicit_permission"("id", 'edit_notes'::"text"));



CREATE POLICY "patients_update_by_tag" ON "public"."patients" FOR UPDATE USING ("public"."patient_has_tag_permission"("id", 'write'::"text")) WITH CHECK ("public"."patient_has_tag_permission"("id", 'write'::"text"));



CREATE POLICY "patients_update_editor" ON "public"."patients" FOR UPDATE USING ("public"."role_at_least"("org_id", 'editor'::"text")) WITH CHECK ("public"."role_at_least"("org_id", 'editor'::"text"));



CREATE POLICY "patients_update_org" ON "public"."patients" FOR UPDATE USING (((("org_id" IS NOT NULL) AND "public"."is_member_of_org"("org_id", 'admin'::"text")) OR ("user_id" = "auth"."uid"()))) WITH CHECK (((("org_id" IS NOT NULL) AND "public"."is_member_of_org"("org_id", 'admin'::"text")) OR ("user_id" = "auth"."uid"())));



CREATE POLICY "patients_update_own" ON "public"."patients" FOR UPDATE USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "pc_rw" ON "public"."patient_conditions" USING (("auth"."uid"() IS NOT NULL)) WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "pf_delete_editor" ON "public"."patient_files" FOR DELETE USING ("public"."role_at_least"("org_id", 'editor'::"text"));



CREATE POLICY "pf_delete_owner_or_editor" ON "public"."patient_files" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."patients" "p"
  WHERE (("p"."id" = "patient_files"."patient_id") AND (("p"."user_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
           FROM "public"."patient_shares" "s"
          WHERE (("s"."patient_id" = "p"."id") AND ("s"."can_edit" = true) AND ("lower"("s"."grantee_email") = "lower"("public"."jwt_email"()))))))))));



CREATE POLICY "pf_insert_editor" ON "public"."patient_files" FOR INSERT WITH CHECK ("public"."role_at_least"("org_id", 'editor'::"text"));



CREATE POLICY "pf_select_member" ON "public"."patient_files" FOR SELECT USING ("public"."is_member"("org_id"));



CREATE POLICY "pf_select_owner_or_shared" ON "public"."patient_files" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."patients" "p"
  WHERE (("p"."id" = "patient_files"."patient_id") AND (("p"."user_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
           FROM "public"."patient_shares" "s"
          WHERE (("s"."patient_id" = "p"."id") AND ("lower"("s"."grantee_email") = "lower"("public"."jwt_email"()))))))))));



CREATE POLICY "pf_update_editor" ON "public"."patient_files" FOR UPDATE USING ("public"."role_at_least"("org_id", 'editor'::"text")) WITH CHECK ("public"."role_at_least"("org_id", 'editor'::"text"));



CREATE POLICY "pf_update_owner_or_editor" ON "public"."patient_files" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."patients" "p"
  WHERE (("p"."id" = "patient_files"."patient_id") AND (("p"."user_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
           FROM "public"."patient_shares" "s"
          WHERE (("s"."patient_id" = "p"."id") AND ("s"."can_edit" = true) AND ("lower"("s"."grantee_email") = "lower"("public"."jwt_email"()))))))))));



CREATE POLICY "pfal_insert" ON "public"."patient_file_access_log" FOR INSERT WITH CHECK (true);



CREATE POLICY "pfal_select" ON "public"."patient_file_access_log" FOR SELECT USING (((EXISTS ( SELECT 1
   FROM "public"."patients" "p"
  WHERE (("p"."id" = "patient_file_access_log"."patient_id") AND (("p"."user_id" = "auth"."uid"()) OR (("p"."org_id" IS NOT NULL) AND "public"."is_member_of_org"("p"."org_id", 'member'::"text")))))) OR "public"."patient_has_explicit_permission"("patient_id", 'read'::"text") OR "public"."patient_has_tag_permission"("patient_id", 'read'::"text")));



CREATE POLICY "pfv_delete" ON "public"."patient_file_versions" FOR DELETE USING (("public"."patient_has_explicit_permission"("patient_id", 'manage_files'::"text") OR (EXISTS ( SELECT 1
   FROM "public"."patients" "p"
  WHERE (("p"."id" = "patient_file_versions"."patient_id") AND (("p"."user_id" = "auth"."uid"()) OR (("p"."org_id" IS NOT NULL) AND "public"."is_member_of_org"("p"."org_id", 'admin'::"text")))))) OR "public"."patient_has_tag_permission"("patient_id", 'write'::"text")));



CREATE POLICY "pfv_insert" ON "public"."patient_file_versions" FOR INSERT WITH CHECK (("public"."patient_has_explicit_permission"("patient_id", 'manage_files'::"text") OR (EXISTS ( SELECT 1
   FROM "public"."patients" "p"
  WHERE (("p"."id" = "patient_file_versions"."patient_id") AND (("p"."user_id" = "auth"."uid"()) OR (("p"."org_id" IS NOT NULL) AND "public"."is_member_of_org"("p"."org_id", 'admin'::"text")))))) OR "public"."patient_has_tag_permission"("patient_id", 'write'::"text")));



CREATE POLICY "pfv_select" ON "public"."patient_file_versions" FOR SELECT USING (("public"."patient_has_explicit_permission"("patient_id", 'read'::"text") OR (EXISTS ( SELECT 1
   FROM "public"."patients" "p"
  WHERE (("p"."id" = "patient_file_versions"."patient_id") AND (("p"."user_id" = "auth"."uid"()) OR (("p"."org_id" IS NOT NULL) AND "public"."is_member_of_org"("p"."org_id", 'member'::"text")))))) OR "public"."patient_has_tag_permission"("patient_id", 'read'::"text")));



CREATE POLICY "pm_rw" ON "public"."patient_medications" USING (("auth"."uid"() IS NOT NULL)) WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "pn_delete_editor" ON "public"."patient_notes" FOR DELETE USING ("public"."role_at_least"("org_id", 'editor'::"text"));



CREATE POLICY "pn_insert_editor" ON "public"."patient_notes" FOR INSERT WITH CHECK ("public"."role_at_least"("org_id", 'editor'::"text"));



CREATE POLICY "pn_select_member" ON "public"."patient_notes" FOR SELECT USING ("public"."is_member"("org_id"));



CREATE POLICY "pn_update_editor" ON "public"."patient_notes" FOR UPDATE USING ("public"."role_at_least"("org_id", 'editor'::"text")) WITH CHECK ("public"."role_at_least"("org_id", 'editor'::"text"));



CREATE POLICY "pnv_select" ON "public"."patient_note_versions" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."patients" "p"
     LEFT JOIN "public"."patient_shares" "s" ON ((("s"."patient_id" = "p"."id") AND ("s"."revoked_at" IS NULL))))
  WHERE (("p"."id" = "patient_note_versions"."patient_id") AND (("p"."user_id" = "auth"."uid"()) OR (("p"."org_id" IS NOT NULL) AND "public"."is_member_of_org"("p"."org_id", 'member'::"text")) OR ("s"."shared_with_user_id" = "auth"."uid"()))))));



CREATE POLICY "pp_delete" ON "public"."patient_providers" FOR DELETE USING (("public"."is_member_of"("org_id") AND "public"."has_role"(ARRAY['owner'::"text", 'admin'::"text", 'clinician'::"text", 'doctor'::"text"])));



CREATE POLICY "pp_modify" ON "public"."patient_permissions" USING ((EXISTS ( SELECT 1
   FROM "public"."patients" "p"
  WHERE (("p"."id" = "patient_permissions"."patient_id") AND (("p"."user_id" = "auth"."uid"()) OR (("p"."org_id" IS NOT NULL) AND "public"."is_member_of_org"("p"."org_id", 'admin'::"text"))))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."patients" "p"
  WHERE (("p"."id" = "patient_permissions"."patient_id") AND (("p"."user_id" = "auth"."uid"()) OR (("p"."org_id" IS NOT NULL) AND "public"."is_member_of_org"("p"."org_id", 'admin'::"text")))))));



CREATE POLICY "pp_read" ON "public"."patient_panels" FOR SELECT USING ("public"."is_member_of"("org_id"));



CREATE POLICY "pp_read" ON "public"."patient_providers" FOR SELECT USING ("public"."is_member_of"("org_id"));



CREATE POLICY "pp_rw" ON "public"."patient_permissions" USING (("auth"."uid"() IS NOT NULL)) WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "pp_select" ON "public"."patient_permissions" FOR SELECT USING ((("user_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."patients" "p"
  WHERE (("p"."id" = "patient_permissions"."patient_id") AND ("p"."user_id" = "auth"."uid"()))))));



CREATE POLICY "pp_update" ON "public"."patient_providers" FOR UPDATE USING (("public"."is_member_of"("org_id") AND "public"."has_role"(ARRAY['owner'::"text", 'admin'::"text", 'clinician'::"text", 'doctor'::"text"])));



CREATE POLICY "pp_write" ON "public"."patient_providers" FOR INSERT WITH CHECK (("public"."is_member_of"("org_id") AND "public"."has_role"(ARRAY['owner'::"text", 'admin'::"text", 'clinician'::"text", 'doctor'::"text"])));



CREATE POLICY "pp_write_ins" ON "public"."patient_panels" FOR INSERT WITH CHECK (("public"."is_member_of"("org_id") AND "public"."has_role"(ARRAY['owner'::"text", 'admin'::"text", 'clinician'::"text", 'coach'::"text"])));



CREATE POLICY "pp_write_upd" ON "public"."patient_panels" FOR UPDATE USING (("public"."is_member_of"("org_id") AND "public"."has_role"(ARRAY['owner'::"text", 'admin'::"text", 'clinician'::"text", 'coach'::"text"])));



CREATE POLICY "prefs_select_owner" ON "public"."user_prefs" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "prefs_upsert_owner" ON "public"."user_prefs" TO "authenticated" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."prescription_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."prescription_templates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."prescriptions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "ps delete owner only" ON "public"."patient_shares" FOR DELETE TO "authenticated" USING (("owner_id" = "auth"."uid"()));



CREATE POLICY "ps insert owner only" ON "public"."patient_shares" FOR INSERT TO "authenticated" WITH CHECK ((("owner_id" = "auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM "public"."patients" "p"
  WHERE (("p"."id" = "patient_shares"."patient_id") AND ("p"."user_id" = "auth"."uid"()))))));



CREATE POLICY "ps select owner+me" ON "public"."patient_shares" FOR SELECT TO "authenticated" USING ((("owner_id" = "auth"."uid"()) OR ("lower"("grantee_email") = "lower"("public"."jwt_email"()))));



CREATE POLICY "ps update owner only" ON "public"."patient_shares" FOR UPDATE TO "authenticated" USING (("owner_id" = "auth"."uid"()));



CREATE POLICY "ps_delete_admin" ON "public"."patient_shares" FOR DELETE USING ("public"."role_at_least"("org_id", 'admin'::"text"));



CREATE POLICY "ps_insupd_admin" ON "public"."patient_shares" USING ("public"."role_at_least"("org_id", 'admin'::"text")) WITH CHECK ("public"."role_at_least"("org_id", 'admin'::"text"));



CREATE POLICY "ps_select_member" ON "public"."patient_shares" FOR SELECT USING ("public"."is_member"("org_id"));



CREATE POLICY "pt_delete" ON "public"."patient_tags" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."patients" "p"
  WHERE (("p"."id" = "patient_tags"."patient_id") AND ("p"."deleted_at" IS NULL) AND ("p"."user_id" = "auth"."uid"())))));



CREATE POLICY "pt_insert" ON "public"."patient_tags" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM ("public"."patients" "p"
     JOIN "public"."tags" "t" ON (("t"."id" = "patient_tags"."tag_id")))
  WHERE (("p"."id" = "patient_tags"."patient_id") AND ("p"."deleted_at" IS NULL) AND ("p"."user_id" = "auth"."uid"()) AND ("t"."owner_id" = "auth"."uid"())))));



CREATE POLICY "pt_rw" ON "public"."patient_tags" USING (("auth"."uid"() IS NOT NULL)) WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "pt_select" ON "public"."patient_tags" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."patients" "p"
     LEFT JOIN "public"."patient_shares" "s" ON (("s"."patient_id" = "p"."id")))
  WHERE (("p"."id" = "patient_tags"."patient_id") AND (("p"."user_id" = "auth"."uid"()) OR (("p"."deleted_at" IS NULL) AND (("s"."shared_with_user_id" = "auth"."uid"()) OR ("s"."shared_with_email" = ("auth"."jwt"() ->> 'email'::"text")))))))));



CREATE POLICY "ptasks_insert" ON "public"."patient_tasks" FOR INSERT WITH CHECK (("public"."is_member_of"("org_id") AND "public"."has_role"(ARRAY['owner'::"text", 'admin'::"text", 'clinician'::"text"])));



CREATE POLICY "ptasks_select" ON "public"."patient_tasks" FOR SELECT USING ("public"."is_member_of"("org_id"));



CREATE POLICY "ptasks_update" ON "public"."patient_tasks" FOR UPDATE USING (("public"."is_member_of"("org_id") AND "public"."has_role"(ARRAY['owner'::"text", 'admin'::"text", 'clinician'::"text"]))) WITH CHECK (("public"."is_member_of"("org_id") AND "public"."has_role"(ARRAY['owner'::"text", 'admin'::"text", 'clinician'::"text"])));



CREATE POLICY "ptpl_delete" ON "public"."patient_task_templates" FOR DELETE USING (("public"."is_member_of"("org_id") AND "public"."has_role"(ARRAY['owner'::"text", 'admin'::"text", 'clinician'::"text"])));



CREATE POLICY "ptpl_insert" ON "public"."patient_task_templates" FOR INSERT WITH CHECK (("public"."is_member_of"("org_id") AND "public"."has_role"(ARRAY['owner'::"text", 'admin'::"text", 'clinician'::"text"])));



CREATE POLICY "ptpl_select" ON "public"."patient_task_templates" FOR SELECT USING ("public"."is_member_of"("org_id"));



CREATE POLICY "pulso_meas_insert" ON "public"."pulso_measurements" FOR INSERT WITH CHECK (("public"."is_member_of"("org_id") AND "public"."has_role"(ARRAY['owner'::"text", 'admin'::"text", 'clinician'::"text"])));



CREATE POLICY "pulso_meas_select" ON "public"."pulso_measurements" FOR SELECT USING ("public"."is_member_of"("org_id"));



ALTER TABLE "public"."pulso_measurements" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."pulso_targets" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "pulso_targets_select" ON "public"."pulso_targets" FOR SELECT USING ("public"."is_member_of"("org_id"));



CREATE POLICY "pulso_targets_update" ON "public"."pulso_targets" FOR UPDATE USING (("public"."is_member_of"("org_id") AND "public"."has_role"(ARRAY['owner'::"text", 'admin'::"text", 'clinician'::"text"]))) WITH CHECK (("public"."is_member_of"("org_id") AND "public"."has_role"(ARRAY['owner'::"text", 'admin'::"text", 'clinician'::"text"])));



CREATE POLICY "pulso_targets_upsert" ON "public"."pulso_targets" FOR INSERT WITH CHECK (("public"."is_member_of"("org_id") AND "public"."has_role"(ARRAY['owner'::"text", 'admin'::"text", 'clinician'::"text"])));



CREATE POLICY "ref_select" ON "public"."referrals" FOR SELECT USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "ref_write" ON "public"."referrals" USING (("auth"."uid"() IS NOT NULL)) WITH CHECK (("auth"."uid"() IS NOT NULL));



ALTER TABLE "public"."referral_templates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."referrals" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "reftpl_select" ON "public"."referral_templates" FOR SELECT USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "reftpl_write" ON "public"."referral_templates" USING (("auth"."uid"() IS NOT NULL)) WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "rehab_del_org" ON "public"."rehab_sessions" FOR DELETE TO "authenticated" USING ("public"."is_member_of_org"(( SELECT "p"."org_id"
   FROM "public"."patients" "p"
  WHERE ("p"."id" = "rehab_sessions"."patient_id")), 'member'::"text"));



CREATE POLICY "rehab_ins_upd_org" ON "public"."rehab_sessions" FOR INSERT TO "authenticated" WITH CHECK ("public"."is_member_of_org"(( SELECT "p"."org_id"
   FROM "public"."patients" "p"
  WHERE ("p"."id" = "rehab_sessions"."patient_id")), 'member'::"text"));



CREATE POLICY "rehab_select_org" ON "public"."rehab_sessions" FOR SELECT TO "authenticated" USING ("public"."is_member_of_org"(( SELECT "p"."org_id"
   FROM "public"."patients" "p"
  WHERE ("p"."id" = "rehab_sessions"."patient_id")), 'member'::"text"));



ALTER TABLE "public"."rehab_sessions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "rehab_upd_org" ON "public"."rehab_sessions" FOR UPDATE TO "authenticated" USING ("public"."is_member_of_org"(( SELECT "p"."org_id"
   FROM "public"."patients" "p"
  WHERE ("p"."id" = "rehab_sessions"."patient_id")), 'member'::"text")) WITH CHECK ("public"."is_member_of_org"(( SELECT "p"."org_id"
   FROM "public"."patients" "p"
  WHERE ("p"."id" = "rehab_sessions"."patient_id")), 'member'::"text"));



CREATE POLICY "rem_sel" ON "public"."reminders" FOR SELECT TO "authenticated" USING ("public"."is_member_of_org"("org_id", 'member'::"text"));



ALTER TABLE "public"."reminder_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."reminder_prefs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."reminder_queue" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."reminder_templates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."reminders" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "reminders_rw" ON "public"."reminders" TO "authenticated" USING ("public"."is_member_of_org"("org_id", 'member'::"text")) WITH CHECK ("public"."is_member_of_org"("org_id", 'member'::"text"));



ALTER TABLE "public"."reminders_templates" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "reminders_templates_read" ON "public"."reminders_templates" FOR SELECT USING ("public"."is_member_of"("org_id"));



CREATE POLICY "reminders_templates_write" ON "public"."reminders_templates" USING (("public"."is_member_of"("org_id") AND "public"."has_role"(ARRAY['owner'::"text", 'admin'::"text", 'clinician'::"text"]))) WITH CHECK (("public"."is_member_of"("org_id") AND "public"."has_role"(ARRAY['owner'::"text", 'admin'::"text", 'clinician'::"text"])));



ALTER TABLE "public"."report_schedules" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "report_schedules_read" ON "public"."report_schedules" FOR SELECT USING ("public"."is_member_of"("org_id"));



CREATE POLICY "report_schedules_write" ON "public"."report_schedules" USING (("public"."is_member_of"("org_id") AND "public"."has_role"(ARRAY['owner'::"text", 'admin'::"text", 'clinician'::"text"]))) WITH CHECK (("public"."is_member_of"("org_id") AND "public"."has_role"(ARRAY['owner'::"text", 'admin'::"text", 'clinician'::"text"])));



CREATE POLICY "rf_insert" ON "public"."referrals" FOR INSERT WITH CHECK (("public"."is_member_of"("org_id") AND "public"."has_role"(ARRAY['owner'::"text", 'admin'::"text", 'clinician'::"text", 'doctor'::"text"])));



CREATE POLICY "rf_select" ON "public"."referrals" FOR SELECT USING ("public"."is_member_of"("org_id"));



CREATE POLICY "rf_tpl_select" ON "public"."referral_templates" FOR SELECT USING ("public"."is_member_of"("org_id"));



CREATE POLICY "rf_tpl_update" ON "public"."referral_templates" FOR UPDATE USING (("public"."is_member_of"("org_id") AND "public"."has_role"(ARRAY['owner'::"text", 'admin'::"text", 'clinician'::"text", 'doctor'::"text"])));



CREATE POLICY "rf_tpl_write" ON "public"."referral_templates" FOR INSERT WITH CHECK (("public"."is_member_of"("org_id") AND "public"."has_role"(ARRAY['owner'::"text", 'admin'::"text", 'clinician'::"text", 'doctor'::"text"])));



CREATE POLICY "rf_update" ON "public"."referrals" FOR UPDATE USING (("public"."is_member_of"("org_id") AND "public"."has_role"(ARRAY['owner'::"text", 'admin'::"text", 'clinician'::"text", 'doctor'::"text"])));



CREATE POLICY "rlog_sel" ON "public"."reminder_logs" FOR SELECT TO "authenticated" USING ((("org_id" IS NULL) OR "public"."is_member_of_org"("org_id", 'member'::"text")));



CREATE POLICY "rp_read" ON "public"."reminder_prefs" FOR SELECT USING ("public"."is_member_of"("org_id"));



CREATE POLICY "rp_write_insert" ON "public"."reminder_prefs" FOR INSERT WITH CHECK (("public"."is_member_of"("org_id") AND ("public"."has_role"(ARRAY['owner'::"text", 'admin'::"text"]) OR ("provider_id" = "auth"."uid"()))));



CREATE POLICY "rp_write_update" ON "public"."reminder_prefs" FOR UPDATE USING (("public"."is_member_of"("org_id") AND ("public"."has_role"(ARRAY['owner'::"text", 'admin'::"text"]) OR ("provider_id" = "auth"."uid"())))) WITH CHECK (("public"."is_member_of"("org_id") AND ("public"."has_role"(ARRAY['owner'::"text", 'admin'::"text"]) OR ("provider_id" = "auth"."uid"()))));



CREATE POLICY "rq_read" ON "public"."reminder_queue" FOR SELECT USING ("public"."is_member_of"("org_id"));



CREATE POLICY "rq_write_insert" ON "public"."reminder_queue" FOR INSERT WITH CHECK (("public"."is_member_of"("org_id") AND "public"."has_role"(ARRAY['owner'::"text", 'admin'::"text", 'clinician'::"text", 'coach'::"text"])));



CREATE POLICY "rq_write_update" ON "public"."reminder_queue" FOR UPDATE USING (("public"."is_member_of"("org_id") AND "public"."has_role"(ARRAY['owner'::"text", 'admin'::"text", 'clinician'::"text", 'coach'::"text"]))) WITH CHECK (("public"."is_member_of"("org_id") AND "public"."has_role"(ARRAY['owner'::"text", 'admin'::"text", 'clinician'::"text", 'coach'::"text"])));



CREATE POLICY "rx_insert" ON "public"."prescriptions" FOR INSERT WITH CHECK (("public"."is_member_of"("org_id") AND "public"."has_role"(ARRAY['owner'::"text", 'admin'::"text", 'clinician'::"text", 'doctor'::"text"])));



CREATE POLICY "rx_select" ON "public"."prescriptions" FOR SELECT USING ("public"."is_member_of"("org_id"));



CREATE POLICY "rx_tpl_select" ON "public"."prescription_templates" FOR SELECT USING ("public"."is_member_of"("org_id"));



CREATE POLICY "rx_tpl_update" ON "public"."prescription_templates" FOR UPDATE USING (("public"."is_member_of"("org_id") AND "public"."has_role"(ARRAY['owner'::"text", 'admin'::"text", 'clinician'::"text", 'doctor'::"text"])));



CREATE POLICY "rx_tpl_write" ON "public"."prescription_templates" FOR INSERT WITH CHECK (("public"."is_member_of"("org_id") AND "public"."has_role"(ARRAY['owner'::"text", 'admin'::"text", 'clinician'::"text", 'doctor'::"text"])));



CREATE POLICY "rx_update" ON "public"."prescriptions" FOR UPDATE USING (("public"."is_member_of"("org_id") AND "public"."has_role"(ARRAY['owner'::"text", 'admin'::"text", 'clinician'::"text", 'doctor'::"text"])));



CREATE POLICY "rx_write" ON "public"."prescriptions" USING (("auth"."uid"() IS NOT NULL)) WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "rxitems_rw" ON "public"."prescription_items" USING (("auth"."uid"() IS NOT NULL)) WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "rxtpl_select" ON "public"."prescription_templates" FOR SELECT USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "rxtpl_write" ON "public"."prescription_templates" USING (("auth"."uid"() IS NOT NULL)) WITH CHECK (("auth"."uid"() IS NOT NULL));



ALTER TABLE "public"."saved_searches" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."saved_views" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "saved_views_delete" ON "public"."saved_views" FOR DELETE USING (("public"."is_member_of"("org_id") AND ("user_id" = "auth"."uid"())));



CREATE POLICY "saved_views_insert" ON "public"."saved_views" FOR INSERT WITH CHECK (("public"."is_member_of"("org_id") AND ("user_id" = "auth"."uid"())));



CREATE POLICY "saved_views_rw" ON "public"."saved_views" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "saved_views_select" ON "public"."saved_views" FOR SELECT USING (("public"."is_member_of"("org_id") AND ("user_id" = "auth"."uid"())));



CREATE POLICY "saved_views_update" ON "public"."saved_views" FOR UPDATE USING (("public"."is_member_of"("org_id") AND ("user_id" = "auth"."uid"()))) WITH CHECK (("public"."is_member_of"("org_id") AND ("user_id" = "auth"."uid"())));



CREATE POLICY "service_can_update" ON "public"."org_features" FOR UPDATE USING (true) WITH CHECK (true);



CREATE POLICY "service_can_upsert" ON "public"."org_features" FOR INSERT WITH CHECK (true);



CREATE POLICY "shares_delete_owner" ON "public"."patient_shares" FOR DELETE USING (("owner_id" = "auth"."uid"()));



CREATE POLICY "shares_insert_owner" ON "public"."patient_shares" FOR INSERT WITH CHECK (("owner_id" = "auth"."uid"()));



CREATE POLICY "shares_select_owner" ON "public"."patient_shares" FOR SELECT USING (("owner_id" = "auth"."uid"()));



ALTER TABLE "public"."sonrisa_quote_items" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "sonrisa_quote_items_mod" ON "public"."sonrisa_quote_items" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."sonrisa_quotes" "q"
  WHERE (("q"."id" = "sonrisa_quote_items"."quote_id") AND "public"."is_member_of"("q"."org_id") AND "public"."has_role"(ARRAY['owner'::"text", 'admin'::"text", 'clinician'::"text"])))));



CREATE POLICY "sonrisa_quote_items_select" ON "public"."sonrisa_quote_items" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."sonrisa_quotes" "q"
  WHERE (("q"."id" = "sonrisa_quote_items"."quote_id") AND "public"."is_member_of"("q"."org_id")))));



CREATE POLICY "sonrisa_quote_items_update" ON "public"."sonrisa_quote_items" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."sonrisa_quotes" "q"
  WHERE (("q"."id" = "sonrisa_quote_items"."quote_id") AND "public"."is_member_of"("q"."org_id") AND "public"."has_role"(ARRAY['owner'::"text", 'admin'::"text", 'clinician'::"text"]))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."sonrisa_quotes" "q"
  WHERE (("q"."id" = "sonrisa_quote_items"."quote_id") AND "public"."is_member_of"("q"."org_id") AND "public"."has_role"(ARRAY['owner'::"text", 'admin'::"text", 'clinician'::"text"])))));



ALTER TABLE "public"."sonrisa_quotes" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "sonrisa_quotes_insert" ON "public"."sonrisa_quotes" FOR INSERT WITH CHECK (("public"."is_member_of"("org_id") AND "public"."has_role"(ARRAY['owner'::"text", 'admin'::"text", 'clinician'::"text"])));



CREATE POLICY "sonrisa_quotes_select" ON "public"."sonrisa_quotes" FOR SELECT USING ("public"."is_member_of"("org_id"));



CREATE POLICY "sonrisa_quotes_update" ON "public"."sonrisa_quotes" FOR UPDATE USING (("public"."is_member_of"("org_id") AND "public"."has_role"(ARRAY['owner'::"text", 'admin'::"text", 'clinician'::"text"]))) WITH CHECK (("public"."is_member_of"("org_id") AND "public"."has_role"(ARRAY['owner'::"text", 'admin'::"text", 'clinician'::"text"])));



ALTER TABLE "public"."sonrisa_treatments" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "sonrisa_treatments_select" ON "public"."sonrisa_treatments" FOR SELECT USING ("public"."is_member_of"("org_id"));



CREATE POLICY "sonrisa_treatments_update" ON "public"."sonrisa_treatments" FOR UPDATE USING (("public"."is_member_of"("org_id") AND "public"."has_role"(ARRAY['owner'::"text", 'admin'::"text", 'clinician'::"text"]))) WITH CHECK (("public"."is_member_of"("org_id") AND "public"."has_role"(ARRAY['owner'::"text", 'admin'::"text", 'clinician'::"text"])));



CREATE POLICY "sonrisa_treatments_upsert" ON "public"."sonrisa_treatments" FOR INSERT WITH CHECK (("public"."is_member_of"("org_id") AND "public"."has_role"(ARRAY['owner'::"text", 'admin'::"text", 'clinician'::"text"])));



CREATE POLICY "ss_delete" ON "public"."saved_searches" FOR DELETE USING ((("owner_id" = "auth"."uid"()) OR (("org_id" IS NOT NULL) AND "public"."is_member_of_org"("org_id", 'admin'::"text"))));



CREATE POLICY "ss_insert" ON "public"."saved_searches" FOR INSERT WITH CHECK ((("owner_id" = "auth"."uid"()) OR (("org_id" IS NOT NULL) AND "public"."is_member_of_org"("org_id", 'admin'::"text"))));



CREATE POLICY "ss_rw" ON "public"."saved_searches" USING (("auth"."uid"() IS NOT NULL)) WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "ss_select" ON "public"."saved_searches" FOR SELECT USING ((("owner_id" = "auth"."uid"()) OR (("org_id" IS NOT NULL) AND "public"."is_member_of_org"("org_id", 'member'::"text"))));



CREATE POLICY "ss_update" ON "public"."saved_searches" FOR UPDATE USING ((("owner_id" = "auth"."uid"()) OR (("org_id" IS NOT NULL) AND "public"."is_member_of_org"("org_id", 'admin'::"text")))) WITH CHECK ((("owner_id" = "auth"."uid"()) OR (("org_id" IS NOT NULL) AND "public"."is_member_of_org"("org_id", 'admin'::"text"))));



ALTER TABLE "public"."tag_permissions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tags" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "tags_delete_org" ON "public"."tags" FOR DELETE USING ((("owner_id" = "auth"."uid"()) OR (("org_id" IS NOT NULL) AND "public"."is_member_of_org"("org_id", 'admin'::"text"))));



CREATE POLICY "tags_delete_owner" ON "public"."tags" FOR DELETE USING (("owner_id" = "auth"."uid"()));



CREATE POLICY "tags_insert_org" ON "public"."tags" FOR INSERT WITH CHECK ((("owner_id" = "auth"."uid"()) OR (("org_id" IS NOT NULL) AND "public"."is_member_of_org"("org_id", 'admin'::"text"))));



CREATE POLICY "tags_insert_owner" ON "public"."tags" FOR INSERT WITH CHECK (("owner_id" = "auth"."uid"()));



CREATE POLICY "tags_rw" ON "public"."tags" USING (("auth"."uid"() IS NOT NULL)) WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "tags_select_org" ON "public"."tags" FOR SELECT USING ((("owner_id" = "auth"."uid"()) OR (("org_id" IS NOT NULL) AND "public"."is_member_of_org"("org_id", 'member'::"text"))));



CREATE POLICY "tags_select_owner" ON "public"."tags" FOR SELECT USING (("owner_id" = "auth"."uid"()));



CREATE POLICY "tags_update_org" ON "public"."tags" FOR UPDATE USING ((("owner_id" = "auth"."uid"()) OR (("org_id" IS NOT NULL) AND "public"."is_member_of_org"("org_id", 'admin'::"text")))) WITH CHECK ((("owner_id" = "auth"."uid"()) OR (("org_id" IS NOT NULL) AND "public"."is_member_of_org"("org_id", 'admin'::"text"))));



CREATE POLICY "tags_update_owner" ON "public"."tags" FOR UPDATE USING (("owner_id" = "auth"."uid"())) WITH CHECK (("owner_id" = "auth"."uid"()));



CREATE POLICY "templates_read_all" ON "public"."agreements_templates" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "templates_rw" ON "public"."reminder_templates" TO "authenticated" USING ("public"."is_member_of_org"("org_id", 'member'::"text")) WITH CHECK ("public"."is_member_of_org"("org_id", 'member'::"text"));



CREATE POLICY "templates_select" ON "public"."lab_test_templates" FOR SELECT USING (true);



CREATE POLICY "templates_write" ON "public"."lab_test_templates" USING (("auth"."uid"() = "created_by")) WITH CHECK (("auth"."uid"() = "created_by"));



CREATE POLICY "tp_modify" ON "public"."tag_permissions" USING ("public"."is_member_of_org"("org_id", 'admin'::"text")) WITH CHECK ("public"."is_member_of_org"("org_id", 'admin'::"text"));



CREATE POLICY "tp_select" ON "public"."tag_permissions" FOR SELECT USING ("public"."is_member_of_org"("org_id", 'member'::"text"));



ALTER TABLE "public"."user_prefs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "wa_insert" ON "public"."work_assignments" FOR INSERT WITH CHECK (("public"."is_member_of"("org_id") AND "public"."has_role"(ARRAY['owner'::"text", 'admin'::"text", 'clinician'::"text", 'coach'::"text"])));



CREATE POLICY "wa_read" ON "public"."work_assignments" FOR SELECT USING ("public"."is_member_of"("org_id"));



CREATE POLICY "wa_update" ON "public"."work_assignments" FOR UPDATE USING (("public"."is_member_of"("org_id") AND "public"."has_role"(ARRAY['owner'::"text", 'admin'::"text", 'clinician'::"text", 'coach'::"text"]))) WITH CHECK (("public"."is_member_of"("org_id") AND "public"."has_role"(ARRAY['owner'::"text", 'admin'::"text", 'clinician'::"text", 'coach'::"text"])));



CREATE POLICY "wi_cud" ON "public"."work_items" USING (("public"."is_member_of_org"("org_id", 'member'::"text") OR "public"."patient_has_tag_permission"("patient_id", 'write'::"text") OR "public"."patient_share_allows"("patient_id", 'write'::"text") OR (EXISTS ( SELECT 1
   FROM "public"."patient_permissions" "pp"
  WHERE (("pp"."patient_id" = "work_items"."patient_id") AND ("pp"."user_id" = "auth"."uid"()) AND ("pp"."can_edit_notes" OR "pp"."can_share")))))) WITH CHECK (("public"."is_member_of_org"("org_id", 'member'::"text") OR "public"."patient_has_tag_permission"("patient_id", 'write'::"text") OR "public"."patient_share_allows"("patient_id", 'write'::"text") OR (EXISTS ( SELECT 1
   FROM "public"."patient_permissions" "pp"
  WHERE (("pp"."patient_id" = "work_items"."patient_id") AND ("pp"."user_id" = "auth"."uid"()) AND ("pp"."can_edit_notes" OR "pp"."can_share"))))));



CREATE POLICY "wi_modify" ON "public"."work_items" USING ("public"."is_member_of_org"("org_id", 'member'::"text")) WITH CHECK ("public"."is_member_of_org"("org_id", 'member'::"text"));



CREATE POLICY "wi_rw" ON "public"."work_items" USING (("auth"."uid"() IS NOT NULL)) WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "wi_select" ON "public"."work_items" FOR SELECT USING (("public"."is_member_of_org"("org_id", 'member'::"text") OR "public"."patient_has_explicit_permission"("patient_id", 'read'::"text") OR "public"."patient_has_tag_permission"("patient_id", 'read'::"text")));



ALTER TABLE "public"."work_assignments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."work_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."work_templates" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "wt_read" ON "public"."work_templates" FOR SELECT USING ("public"."is_member_of"("org_id"));



CREATE POLICY "wt_update" ON "public"."work_templates" FOR UPDATE USING (("public"."is_member_of"("org_id") AND "public"."has_role"(ARRAY['owner'::"text", 'admin'::"text", 'clinician'::"text", 'coach'::"text"]))) WITH CHECK (("public"."is_member_of"("org_id") AND "public"."has_role"(ARRAY['owner'::"text", 'admin'::"text", 'clinician'::"text", 'coach'::"text"])));



CREATE POLICY "wt_write" ON "public"."work_templates" FOR INSERT WITH CHECK (("public"."is_member_of"("org_id") AND "public"."has_role"(ARRAY['owner'::"text", 'admin'::"text", 'clinician'::"text", 'coach'::"text"])));





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."patient_notes";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."patients";



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_in"("cstring") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_in"("cstring") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_in"("cstring") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_in"("cstring") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_out"("public"."gtrgm") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_out"("public"."gtrgm") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_out"("public"."gtrgm") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_out"("public"."gtrgm") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_in"("cstring", "oid", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_in"("cstring", "oid", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_in"("cstring", "oid", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_in"("cstring", "oid", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_out"("public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_out"("public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_out"("public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_out"("public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_recv"("internal", "oid", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_recv"("internal", "oid", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_recv"("internal", "oid", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_recv"("internal", "oid", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_send"("public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_send"("public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_send"("public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_send"("public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_typmod_in"("cstring"[]) TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_typmod_in"("cstring"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_typmod_in"("cstring"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_typmod_in"("cstring"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_in"("cstring", "oid", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_in"("cstring", "oid", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_in"("cstring", "oid", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_in"("cstring", "oid", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_out"("public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_out"("public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_out"("public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_out"("public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_recv"("internal", "oid", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_recv"("internal", "oid", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_recv"("internal", "oid", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_recv"("internal", "oid", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_send"("public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_send"("public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_send"("public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_send"("public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_typmod_in"("cstring"[]) TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_typmod_in"("cstring"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_typmod_in"("cstring"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_typmod_in"("cstring"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_in"("cstring", "oid", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_in"("cstring", "oid", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."vector_in"("cstring", "oid", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_in"("cstring", "oid", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_out"("public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_out"("public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_out"("public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_out"("public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_recv"("internal", "oid", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_recv"("internal", "oid", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."vector_recv"("internal", "oid", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_recv"("internal", "oid", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_send"("public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_send"("public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_send"("public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_send"("public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_typmod_in"("cstring"[]) TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_typmod_in"("cstring"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."vector_typmod_in"("cstring"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_typmod_in"("cstring"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_halfvec"(real[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(real[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(real[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(real[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(real[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(real[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(real[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(real[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_vector"(real[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_vector"(real[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_vector"(real[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_vector"(real[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_halfvec"(double precision[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(double precision[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(double precision[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(double precision[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(double precision[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(double precision[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(double precision[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(double precision[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_vector"(double precision[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_vector"(double precision[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_vector"(double precision[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_vector"(double precision[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_halfvec"(integer[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(integer[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(integer[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(integer[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(integer[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(integer[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(integer[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(integer[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_vector"(integer[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_vector"(integer[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_vector"(integer[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_vector"(integer[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_halfvec"(numeric[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(numeric[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(numeric[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(numeric[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(numeric[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(numeric[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(numeric[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(numeric[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_vector"(numeric[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_vector"(numeric[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_vector"(numeric[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_vector"(numeric[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_to_float4"("public"."halfvec", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_to_float4"("public"."halfvec", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_to_float4"("public"."halfvec", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_to_float4"("public"."halfvec", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec"("public"."halfvec", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec"("public"."halfvec", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec"("public"."halfvec", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec"("public"."halfvec", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_to_sparsevec"("public"."halfvec", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_to_sparsevec"("public"."halfvec", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_to_sparsevec"("public"."halfvec", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_to_sparsevec"("public"."halfvec", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_to_vector"("public"."halfvec", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_to_vector"("public"."halfvec", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_to_vector"("public"."halfvec", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_to_vector"("public"."halfvec", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_to_halfvec"("public"."sparsevec", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_to_halfvec"("public"."sparsevec", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_to_halfvec"("public"."sparsevec", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_to_halfvec"("public"."sparsevec", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec"("public"."sparsevec", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec"("public"."sparsevec", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec"("public"."sparsevec", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec"("public"."sparsevec", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_to_vector"("public"."sparsevec", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_to_vector"("public"."sparsevec", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_to_vector"("public"."sparsevec", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_to_vector"("public"."sparsevec", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_to_float4"("public"."vector", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_to_float4"("public"."vector", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."vector_to_float4"("public"."vector", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_to_float4"("public"."vector", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_to_halfvec"("public"."vector", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_to_halfvec"("public"."vector", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."vector_to_halfvec"("public"."vector", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_to_halfvec"("public"."vector", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_to_sparsevec"("public"."vector", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_to_sparsevec"("public"."vector", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."vector_to_sparsevec"("public"."vector", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_to_sparsevec"("public"."vector", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."vector"("public"."vector", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."vector"("public"."vector", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."vector"("public"."vector", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector"("public"."vector", integer, boolean) TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."_reminders_touch"() TO "anon";
GRANT ALL ON FUNCTION "public"."_reminders_touch"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."_reminders_touch"() TO "service_role";



GRANT ALL ON FUNCTION "public"."_set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."_set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."_set_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."agreements_is_patient_cleared"("p_org" "uuid", "p_specialist" "uuid", "p_patient" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."agreements_is_patient_cleared"("p_org" "uuid", "p_specialist" "uuid", "p_patient" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."agreements_is_patient_cleared"("p_org" "uuid", "p_specialist" "uuid", "p_patient" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."audit_trigger"() TO "anon";
GRANT ALL ON FUNCTION "public"."audit_trigger"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."audit_trigger"() TO "service_role";



GRANT ALL ON FUNCTION "public"."auth_email"() TO "anon";
GRANT ALL ON FUNCTION "public"."auth_email"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."auth_email"() TO "service_role";



GRANT ALL ON FUNCTION "public"."bank_flow"("p_org_id" "uuid", "p_from" "date", "p_to" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."bank_flow"("p_org_id" "uuid", "p_from" "date", "p_to" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."bank_flow"("p_org_id" "uuid", "p_from" "date", "p_to" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."bank_flow"("p_org_id" "uuid", "p_from" "date", "p_to" "date", "p_group" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."bank_flow"("p_org_id" "uuid", "p_from" "date", "p_to" "date", "p_group" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."bank_flow"("p_org_id" "uuid", "p_from" "date", "p_to" "date", "p_group" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."bank_pl"("p_org_id" "uuid", "p_from" "date", "p_to" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."bank_pl"("p_org_id" "uuid", "p_from" "date", "p_to" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."bank_pl"("p_org_id" "uuid", "p_from" "date", "p_to" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."binary_quantize"("public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."binary_quantize"("public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."binary_quantize"("public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."binary_quantize"("public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."binary_quantize"("public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."binary_quantize"("public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."binary_quantize"("public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."binary_quantize"("public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."can_revoke_document"("p_doc_type" "text", "p_doc_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."can_revoke_document"("p_doc_type" "text", "p_doc_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."can_revoke_document"("p_doc_type" "text", "p_doc_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."concept_norm_trg"() TO "anon";
GRANT ALL ON FUNCTION "public"."concept_norm_trg"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."concept_norm_trg"() TO "service_role";



GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."delete_note_with_reason"("p_note_id" "uuid", "p_reason" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."delete_note_with_reason"("p_note_id" "uuid", "p_reason" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."delete_note_with_reason"("p_note_id" "uuid", "p_reason" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."drug_norm_trg"() TO "anon";
GRANT ALL ON FUNCTION "public"."drug_norm_trg"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."drug_norm_trg"() TO "service_role";



GRANT ALL ON TABLE "public"."document_ledger" TO "anon";
GRANT ALL ON TABLE "public"."document_ledger" TO "authenticated";
GRANT ALL ON TABLE "public"."document_ledger" TO "service_role";



GRANT ALL ON FUNCTION "public"."ensure_document_folio"("p_doc_type" "text", "p_doc_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."ensure_document_folio"("p_doc_type" "text", "p_doc_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."ensure_document_folio"("p_doc_type" "text", "p_doc_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."ensure_personal_org_for"("uid" "uuid", "email" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."ensure_personal_org_for"("uid" "uuid", "email" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."ensure_personal_org_for"("uid" "uuid", "email" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."ensure_rx_folio"("p_org_id" "uuid", "p_id" "uuid", "p_prefix" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."ensure_rx_folio"("p_org_id" "uuid", "p_id" "uuid", "p_prefix" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."ensure_rx_folio"("p_org_id" "uuid", "p_id" "uuid", "p_prefix" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."ensure_rx_folio"("p_org_id" "uuid", "p_id" "uuid", "p_prefix" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_work_for_appointment"("p_appt" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."generate_work_for_appointment"("p_appt" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_work_for_appointment"("p_appt" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_query_trgm"("text", "internal", smallint, "internal", "internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_query_trgm"("text", "internal", smallint, "internal", "internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_query_trgm"("text", "internal", smallint, "internal", "internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_query_trgm"("text", "internal", smallint, "internal", "internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_value_trgm"("text", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_value_trgm"("text", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_value_trgm"("text", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_value_trgm"("text", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_trgm_consistent"("internal", smallint, "text", integer, "internal", "internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_trgm_consistent"("internal", smallint, "text", integer, "internal", "internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_trgm_consistent"("internal", smallint, "text", integer, "internal", "internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_trgm_consistent"("internal", smallint, "text", integer, "internal", "internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_trgm_triconsistent"("internal", smallint, "text", integer, "internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_trgm_triconsistent"("internal", smallint, "text", integer, "internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_trgm_triconsistent"("internal", smallint, "text", integer, "internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_trgm_triconsistent"("internal", smallint, "text", integer, "internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_compress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_compress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_compress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_compress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_consistent"("internal", "text", smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_consistent"("internal", "text", smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_consistent"("internal", "text", smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_consistent"("internal", "text", smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_decompress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_decompress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_decompress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_decompress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_distance"("internal", "text", smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_distance"("internal", "text", smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_distance"("internal", "text", smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_distance"("internal", "text", smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_options"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_options"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_options"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_options"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_penalty"("internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_penalty"("internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_penalty"("internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_penalty"("internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_picksplit"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_picksplit"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_picksplit"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_picksplit"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_same"("public"."gtrgm", "public"."gtrgm", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_same"("public"."gtrgm", "public"."gtrgm", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_same"("public"."gtrgm", "public"."gtrgm", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_same"("public"."gtrgm", "public"."gtrgm", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_union"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_union"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_union"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_union"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_accum"(double precision[], "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_accum"(double precision[], "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_accum"(double precision[], "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_accum"(double precision[], "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_add"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_add"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_add"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_add"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_avg"(double precision[]) TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_avg"(double precision[]) TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_avg"(double precision[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_avg"(double precision[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_cmp"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_cmp"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_cmp"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_cmp"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_combine"(double precision[], double precision[]) TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_combine"(double precision[], double precision[]) TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_combine"(double precision[], double precision[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_combine"(double precision[], double precision[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_concat"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_concat"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_concat"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_concat"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_eq"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_eq"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_eq"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_eq"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_ge"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_ge"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_ge"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_ge"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_gt"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_gt"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_gt"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_gt"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_l2_squared_distance"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_l2_squared_distance"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_l2_squared_distance"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_l2_squared_distance"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_le"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_le"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_le"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_le"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_lt"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_lt"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_lt"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_lt"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_mul"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_mul"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_mul"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_mul"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_ne"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_ne"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_ne"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_ne"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_negative_inner_product"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_negative_inner_product"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_negative_inner_product"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_negative_inner_product"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_spherical_distance"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_spherical_distance"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_spherical_distance"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_spherical_distance"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_sub"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_sub"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_sub"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_sub"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."hamming_distance"(bit, bit) TO "postgres";
GRANT ALL ON FUNCTION "public"."hamming_distance"(bit, bit) TO "anon";
GRANT ALL ON FUNCTION "public"."hamming_distance"(bit, bit) TO "authenticated";
GRANT ALL ON FUNCTION "public"."hamming_distance"(bit, bit) TO "service_role";



GRANT ALL ON FUNCTION "public"."has_min_role"("p_org" "uuid", "p_min" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."has_min_role"("p_org" "uuid", "p_min" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."has_min_role"("p_org" "uuid", "p_min" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."has_role"("roles" "text"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."has_role"("roles" "text"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."has_role"("roles" "text"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."hnsw_bit_support"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."hnsw_bit_support"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."hnsw_bit_support"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hnsw_bit_support"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."hnsw_halfvec_support"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."hnsw_halfvec_support"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."hnsw_halfvec_support"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hnsw_halfvec_support"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."hnsw_sparsevec_support"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."hnsw_sparsevec_support"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."hnsw_sparsevec_support"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hnsw_sparsevec_support"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."hnswhandler"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."hnswhandler"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."hnswhandler"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hnswhandler"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."immutable_unaccent"("text") TO "anon";
GRANT ALL ON FUNCTION "public"."immutable_unaccent"("text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."immutable_unaccent"("text") TO "service_role";



GRANT ALL ON FUNCTION "public"."inner_product"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."inner_product"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."inner_product"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."inner_product"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."inner_product"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."inner_product"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."inner_product"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."inner_product"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."inner_product"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."inner_product"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."inner_product"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."inner_product"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_member"("org" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_member"("org" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_member"("org" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_member_of"("org" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_member_of"("org" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_member_of"("org" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_member_of_org"("p_org" "uuid", "p_min_role" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."is_member_of_org"("p_org" "uuid", "p_min_role" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_member_of_org"("p_org" "uuid", "p_min_role" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_member_of_org"("p_org" "uuid", "p_min_role" "public"."org_role") TO "anon";
GRANT ALL ON FUNCTION "public"."is_member_of_org"("p_org" "uuid", "p_min_role" "public"."org_role") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_member_of_org"("p_org" "uuid", "p_min_role" "public"."org_role") TO "service_role";



GRANT ALL ON FUNCTION "public"."ivfflat_bit_support"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."ivfflat_bit_support"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."ivfflat_bit_support"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."ivfflat_bit_support"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."ivfflat_halfvec_support"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."ivfflat_halfvec_support"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."ivfflat_halfvec_support"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."ivfflat_halfvec_support"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."ivfflathandler"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."ivfflathandler"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."ivfflathandler"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."ivfflathandler"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."jaccard_distance"(bit, bit) TO "postgres";
GRANT ALL ON FUNCTION "public"."jaccard_distance"(bit, bit) TO "anon";
GRANT ALL ON FUNCTION "public"."jaccard_distance"(bit, bit) TO "authenticated";
GRANT ALL ON FUNCTION "public"."jaccard_distance"(bit, bit) TO "service_role";



GRANT ALL ON FUNCTION "public"."jwt_email"() TO "anon";
GRANT ALL ON FUNCTION "public"."jwt_email"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."jwt_email"() TO "service_role";



GRANT ALL ON FUNCTION "public"."l1_distance"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."l1_distance"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."l1_distance"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l1_distance"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."l1_distance"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."l1_distance"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."l1_distance"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l1_distance"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."l1_distance"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."l1_distance"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."l1_distance"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l1_distance"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."l2_distance"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."l2_distance"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."l2_distance"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l2_distance"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."l2_distance"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."l2_distance"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."l2_distance"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l2_distance"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."l2_distance"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."l2_distance"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."l2_distance"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l2_distance"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."l2_norm"("public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."l2_norm"("public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."l2_norm"("public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l2_norm"("public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."l2_norm"("public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."l2_norm"("public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."l2_norm"("public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l2_norm"("public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."list_file_versions"("p_patient_id" "uuid", "p_group_key" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."list_file_versions"("p_patient_id" "uuid", "p_group_key" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."list_file_versions"("p_patient_id" "uuid", "p_group_key" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."list_latest_files"("p_patient_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."list_latest_files"("p_patient_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."list_latest_files"("p_patient_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."log_audit"("p_entity" "text", "p_action" "text", "p_entity_id" "uuid", "p_payload" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."log_audit"("p_entity" "text", "p_action" "text", "p_entity_id" "uuid", "p_payload" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_audit"("p_entity" "text", "p_action" "text", "p_entity_id" "uuid", "p_payload" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."log_audit"("_patient_id" "uuid", "_entity" "text", "_entity_id" "uuid", "_action" "text", "_data" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."log_audit"("_patient_id" "uuid", "_entity" "text", "_entity_id" "uuid", "_action" "text", "_data" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_audit"("_patient_id" "uuid", "_entity" "text", "_entity_id" "uuid", "_action" "text", "_data" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."log_file_access"("p_patient_id" "uuid", "p_path" "text", "p_action" "text", "p_ip" "text", "p_ua" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."log_file_access"("p_patient_id" "uuid", "p_path" "text", "p_action" "text", "p_ip" "text", "p_ua" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_file_access"("p_patient_id" "uuid", "p_path" "text", "p_action" "text", "p_ip" "text", "p_ua" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."log_note_version"() TO "anon";
GRANT ALL ON FUNCTION "public"."log_note_version"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_note_version"() TO "service_role";



GRANT ALL ON FUNCTION "public"."metrics_new_patients_by_month"("p_org" "uuid", "months" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."metrics_new_patients_by_month"("p_org" "uuid", "months" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."metrics_new_patients_by_month"("p_org" "uuid", "months" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."metrics_notes_by_month"("p_org" "uuid", "months" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."metrics_notes_by_month"("p_org" "uuid", "months" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."metrics_notes_by_month"("p_org" "uuid", "months" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."metrics_patients_by_tag"("p_org" "uuid", "p_from" timestamp with time zone, "p_to" timestamp with time zone) TO "anon";
GRANT ALL ON FUNCTION "public"."metrics_patients_by_tag"("p_org" "uuid", "p_from" timestamp with time zone, "p_to" timestamp with time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."metrics_patients_by_tag"("p_org" "uuid", "p_from" timestamp with time zone, "p_to" timestamp with time zone) TO "service_role";



GRANT ALL ON FUNCTION "public"."moddatetime"() TO "anon";
GRANT ALL ON FUNCTION "public"."moddatetime"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."moddatetime"() TO "service_role";



GRANT ALL ON FUNCTION "public"."moddatetime_org_features"() TO "anon";
GRANT ALL ON FUNCTION "public"."moddatetime_org_features"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."moddatetime_org_features"() TO "service_role";



GRANT ALL ON FUNCTION "public"."next_file_version"("p_patient_id" "uuid", "p_group_key" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."next_file_version"("p_patient_id" "uuid", "p_group_key" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."next_file_version"("p_patient_id" "uuid", "p_group_key" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."norm_text"("p" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."norm_text"("p" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."norm_text"("p" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."org_role_rank"("r" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."org_role_rank"("r" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."org_role_rank"("r" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."patient_has_explicit_permission"("p_patient_id" "uuid", "p_kind" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."patient_has_explicit_permission"("p_patient_id" "uuid", "p_kind" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."patient_has_explicit_permission"("p_patient_id" "uuid", "p_kind" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."patient_has_tag_permission"("p_patient_id" "uuid", "p_kind" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."patient_has_tag_permission"("p_patient_id" "uuid", "p_kind" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."patient_has_tag_permission"("p_patient_id" "uuid", "p_kind" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."patient_labels_summary"("p_org_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."patient_labels_summary"("p_org_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."patient_labels_summary"("p_org_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."patient_share_access_list"("p_org_id" "uuid", "p_patient_id" "uuid", "p_limit" integer, "p_offset" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."patient_share_access_list"("p_org_id" "uuid", "p_patient_id" "uuid", "p_limit" integer, "p_offset" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."patient_share_access_list"("p_org_id" "uuid", "p_patient_id" "uuid", "p_limit" integer, "p_offset" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."patient_share_allows"("p_patient" "uuid", "p_action" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."patient_share_allows"("p_patient" "uuid", "p_action" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."patient_share_allows"("p_patient" "uuid", "p_action" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."patients_autocomplete"("org" "uuid", "q" "text", "uid" "uuid", "show_org" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."patients_autocomplete"("org" "uuid", "q" "text", "uid" "uuid", "show_org" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."patients_autocomplete"("org" "uuid", "q" "text", "uid" "uuid", "show_org" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."patients_ids_by_tags"("tag_ids" "uuid"[], "mode" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."patients_ids_by_tags"("tag_ids" "uuid"[], "mode" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."patients_ids_by_tags"("tag_ids" "uuid"[], "mode" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."patients_search"("p_org_id" "uuid", "p_q" "text", "p_genero" "text", "p_tags_any" "text"[], "p_tags_all" "text"[], "p_from" "date", "p_to" "date", "p_include_deleted" boolean, "p_limit" integer, "p_offset" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."patients_search"("p_org_id" "uuid", "p_q" "text", "p_genero" "text", "p_tags_any" "text"[], "p_tags_all" "text"[], "p_from" "date", "p_to" "date", "p_include_deleted" boolean, "p_limit" integer, "p_offset" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."patients_search"("p_org_id" "uuid", "p_q" "text", "p_genero" "text", "p_tags_any" "text"[], "p_tags_all" "text"[], "p_from" "date", "p_to" "date", "p_include_deleted" boolean, "p_limit" integer, "p_offset" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."patients_search_suggest"("p_org_id" "uuid", "p_q" "text", "p_limit" integer, "p_scope" "text", "p_provider_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."patients_search_suggest"("p_org_id" "uuid", "p_q" "text", "p_limit" integer, "p_scope" "text", "p_provider_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."patients_search_suggest"("p_org_id" "uuid", "p_q" "text", "p_limit" integer, "p_scope" "text", "p_provider_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."patients_suggest"("q" "text", "org" "uuid", "provider" "uuid", "only_mine" boolean, "limit_n" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."patients_suggest"("q" "text", "org" "uuid", "provider" "uuid", "only_mine" boolean, "limit_n" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."patients_suggest"("q" "text", "org" "uuid", "provider" "uuid", "only_mine" boolean, "limit_n" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."patients_suggest"("q" "text", "org" "uuid", "provider" "uuid", "only_mine" boolean, "limit_n" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."patients_with_label_search"("p_org_id" "uuid", "p_label" "text", "p_limit" integer, "p_offset" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."patients_with_label_search"("p_org_id" "uuid", "p_label" "text", "p_limit" integer, "p_offset" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."patients_with_label_search"("p_org_id" "uuid", "p_label" "text", "p_limit" integer, "p_offset" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."recalc_quote_total"("p_quote_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."recalc_quote_total"("p_quote_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."recalc_quote_total"("p_quote_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."recalc_quote_total_trg"() TO "anon";
GRANT ALL ON FUNCTION "public"."recalc_quote_total_trg"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."recalc_quote_total_trg"() TO "service_role";



GRANT ALL ON FUNCTION "public"."reminders_logs_search"("p_org_id" "uuid", "p_q" "text", "p_status" "text"[], "p_channel" "text"[], "p_date_field" "text", "p_from" "date", "p_to" "date", "p_limit" integer, "p_offset" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."reminders_logs_search"("p_org_id" "uuid", "p_q" "text", "p_status" "text"[], "p_channel" "text"[], "p_date_field" "text", "p_from" "date", "p_to" "date", "p_limit" integer, "p_offset" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."reminders_logs_search"("p_org_id" "uuid", "p_q" "text", "p_status" "text"[], "p_channel" "text"[], "p_date_field" "text", "p_from" "date", "p_to" "date", "p_limit" integer, "p_offset" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."revoke_document"("p_doc_type" "text", "p_doc_id" "uuid", "p_reason" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."revoke_document"("p_doc_type" "text", "p_doc_id" "uuid", "p_reason" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."revoke_document"("p_doc_type" "text", "p_doc_id" "uuid", "p_reason" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."role_at_least"("org" "uuid", "min_role" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."role_at_least"("org" "uuid", "min_role" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."role_at_least"("org" "uuid", "min_role" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."role_at_least"("actual" "public"."org_role", "min_required" "public"."org_role") TO "anon";
GRANT ALL ON FUNCTION "public"."role_at_least"("actual" "public"."org_role", "min_required" "public"."org_role") TO "authenticated";
GRANT ALL ON FUNCTION "public"."role_at_least"("actual" "public"."org_role", "min_required" "public"."org_role") TO "service_role";



GRANT ALL ON FUNCTION "public"."role_rank"("role" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."role_rank"("role" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."role_rank"("role" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."search_all"("q" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."search_all"("q" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."search_all"("q" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."search_all"("q" "text", "p_org" "uuid", "p_limit" integer, "p_offset" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."search_all"("q" "text", "p_org" "uuid", "p_limit" integer, "p_offset" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."search_all"("q" "text", "p_org" "uuid", "p_limit" integer, "p_offset" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."search_all_plus"("payload" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."search_all_plus"("payload" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."search_all_plus"("payload" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."search_all_plus"("q" "text", "p_org" "uuid", "p_patient_ids" "uuid"[], "p_from" timestamp with time zone, "p_to" timestamp with time zone, "p_genero" "text", "p_limit" integer, "p_offset" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."search_all_plus"("q" "text", "p_org" "uuid", "p_patient_ids" "uuid"[], "p_from" timestamp with time zone, "p_to" timestamp with time zone, "p_genero" "text", "p_limit" integer, "p_offset" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."search_all_plus"("q" "text", "p_org" "uuid", "p_patient_ids" "uuid"[], "p_from" timestamp with time zone, "p_to" timestamp with time zone, "p_genero" "text", "p_limit" integer, "p_offset" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."search_notes_files"("p_org" "uuid", "p_query" double precision[], "p_limit" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."search_notes_files"("p_org" "uuid", "p_query" double precision[], "p_limit" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."search_notes_files"("p_org" "uuid", "p_query" double precision[], "p_limit" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."seed_bank_defaults"("p_org" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."seed_bank_defaults"("p_org" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."seed_bank_defaults"("p_org" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."set_limit"(real) TO "postgres";
GRANT ALL ON FUNCTION "public"."set_limit"(real) TO "anon";
GRANT ALL ON FUNCTION "public"."set_limit"(real) TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_limit"(real) TO "service_role";



GRANT ALL ON FUNCTION "public"."set_org_on_insert"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_org_on_insert"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_org_on_insert"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_patient_defaults"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_patient_defaults"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_patient_defaults"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_patient_file_defaults"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_patient_file_defaults"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_patient_file_defaults"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_patient_note_defaults"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_patient_note_defaults"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_patient_note_defaults"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."show_limit"() TO "postgres";
GRANT ALL ON FUNCTION "public"."show_limit"() TO "anon";
GRANT ALL ON FUNCTION "public"."show_limit"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."show_limit"() TO "service_role";



GRANT ALL ON FUNCTION "public"."show_trgm"("text") TO "postgres";
GRANT ALL ON FUNCTION "public"."show_trgm"("text") TO "anon";
GRANT ALL ON FUNCTION "public"."show_trgm"("text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."show_trgm"("text") TO "service_role";



GRANT ALL ON FUNCTION "public"."similarity"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."similarity"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."similarity"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."similarity"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."similarity_dist"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."similarity_dist"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."similarity_dist"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."similarity_dist"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."similarity_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."similarity_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."similarity_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."similarity_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_cmp"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_cmp"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_cmp"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_cmp"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_eq"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_eq"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_eq"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_eq"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_ge"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_ge"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_ge"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_ge"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_gt"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_gt"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_gt"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_gt"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_l2_squared_distance"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_l2_squared_distance"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_l2_squared_distance"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_l2_squared_distance"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_le"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_le"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_le"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_le"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_lt"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_lt"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_lt"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_lt"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_ne"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_ne"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_ne"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_ne"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_negative_inner_product"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_negative_inner_product"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_negative_inner_product"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_negative_inner_product"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity_commutator_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_commutator_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_commutator_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_commutator_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_commutator_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_commutator_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_commutator_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_commutator_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."subvector"("public"."halfvec", integer, integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."subvector"("public"."halfvec", integer, integer) TO "anon";
GRANT ALL ON FUNCTION "public"."subvector"("public"."halfvec", integer, integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."subvector"("public"."halfvec", integer, integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."subvector"("public"."vector", integer, integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."subvector"("public"."vector", integer, integer) TO "anon";
GRANT ALL ON FUNCTION "public"."subvector"("public"."vector", integer, integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."subvector"("public"."vector", integer, integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."touch_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."touch_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."touch_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trg_after_lab_result"() TO "anon";
GRANT ALL ON FUNCTION "public"."trg_after_lab_result"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trg_after_lab_result"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trg_audit_files_del"() TO "anon";
GRANT ALL ON FUNCTION "public"."trg_audit_files_del"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trg_audit_files_del"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trg_audit_files_ins"() TO "anon";
GRANT ALL ON FUNCTION "public"."trg_audit_files_ins"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trg_audit_files_ins"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trg_audit_files_upd"() TO "anon";
GRANT ALL ON FUNCTION "public"."trg_audit_files_upd"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trg_audit_files_upd"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trg_audit_notes_del"() TO "anon";
GRANT ALL ON FUNCTION "public"."trg_audit_notes_del"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trg_audit_notes_del"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trg_audit_notes_ins"() TO "anon";
GRANT ALL ON FUNCTION "public"."trg_audit_notes_ins"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trg_audit_notes_ins"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trg_audit_notes_upd"() TO "anon";
GRANT ALL ON FUNCTION "public"."trg_audit_notes_upd"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trg_audit_notes_upd"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trg_audit_patients_del"() TO "anon";
GRANT ALL ON FUNCTION "public"."trg_audit_patients_del"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trg_audit_patients_del"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trg_audit_patients_ins"() TO "anon";
GRANT ALL ON FUNCTION "public"."trg_audit_patients_ins"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trg_audit_patients_ins"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trg_audit_patients_upd"() TO "anon";
GRANT ALL ON FUNCTION "public"."trg_audit_patients_upd"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trg_audit_patients_upd"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trg_generate_work_after_appt"() TO "anon";
GRANT ALL ON FUNCTION "public"."trg_generate_work_after_appt"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trg_generate_work_after_appt"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trg_ps_set_owner_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."trg_ps_set_owner_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trg_ps_set_owner_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trg_ps_sync_emails"() TO "anon";
GRANT ALL ON FUNCTION "public"."trg_ps_sync_emails"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trg_ps_sync_emails"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trg_workitem_closed_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."trg_workitem_closed_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trg_workitem_closed_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."unaccent"("text") TO "postgres";
GRANT ALL ON FUNCTION "public"."unaccent"("text") TO "anon";
GRANT ALL ON FUNCTION "public"."unaccent"("text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."unaccent"("text") TO "service_role";



GRANT ALL ON FUNCTION "public"."unaccent"("regdictionary", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."unaccent"("regdictionary", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."unaccent"("regdictionary", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."unaccent"("regdictionary", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."unaccent_init"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."unaccent_init"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."unaccent_init"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."unaccent_init"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."unaccent_lexize"("internal", "internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."unaccent_lexize"("internal", "internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."unaccent_lexize"("internal", "internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."unaccent_lexize"("internal", "internal", "internal", "internal") TO "service_role";



GRANT ALL ON TABLE "public"."patient_notes" TO "anon";
GRANT ALL ON TABLE "public"."patient_notes" TO "authenticated";
GRANT ALL ON TABLE "public"."patient_notes" TO "service_role";



GRANT ALL ON FUNCTION "public"."update_note_with_reason"("p_note_id" "uuid", "p_titulo" "text", "p_contenido" "text", "p_reason" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."update_note_with_reason"("p_note_id" "uuid", "p_titulo" "text", "p_contenido" "text", "p_reason" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_note_with_reason"("p_note_id" "uuid", "p_titulo" "text", "p_contenido" "text", "p_reason" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_accum"(double precision[], "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_accum"(double precision[], "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_accum"(double precision[], "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_accum"(double precision[], "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_add"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_add"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_add"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_add"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_avg"(double precision[]) TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_avg"(double precision[]) TO "anon";
GRANT ALL ON FUNCTION "public"."vector_avg"(double precision[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_avg"(double precision[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_cmp"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_cmp"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_cmp"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_cmp"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_combine"(double precision[], double precision[]) TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_combine"(double precision[], double precision[]) TO "anon";
GRANT ALL ON FUNCTION "public"."vector_combine"(double precision[], double precision[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_combine"(double precision[], double precision[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_concat"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_concat"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_concat"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_concat"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_dims"("public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_dims"("public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_dims"("public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_dims"("public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_dims"("public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_dims"("public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_dims"("public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_dims"("public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_eq"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_eq"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_eq"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_eq"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_ge"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_ge"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_ge"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_ge"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_gt"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_gt"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_gt"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_gt"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_l2_squared_distance"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_l2_squared_distance"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_l2_squared_distance"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_l2_squared_distance"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_le"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_le"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_le"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_le"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_lt"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_lt"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_lt"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_lt"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_mul"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_mul"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_mul"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_mul"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_ne"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_ne"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_ne"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_ne"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_negative_inner_product"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_negative_inner_product"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_negative_inner_product"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_negative_inner_product"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_norm"("public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_norm"("public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_norm"("public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_norm"("public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_spherical_distance"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_spherical_distance"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_spherical_distance"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_spherical_distance"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_sub"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_sub"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_sub"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_sub"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity_commutator_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity_commutator_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity_commutator_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity_commutator_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity_dist_commutator_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_commutator_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_commutator_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_commutator_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity_dist_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity_op"("text", "text") TO "service_role";












GRANT ALL ON FUNCTION "public"."avg"("public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."avg"("public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."avg"("public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."avg"("public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."avg"("public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."avg"("public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."avg"("public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."avg"("public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."sum"("public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sum"("public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."sum"("public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sum"("public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sum"("public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."sum"("public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."sum"("public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sum"("public"."vector") TO "service_role";









GRANT ALL ON TABLE "public"."agenda_alert_log" TO "anon";
GRANT ALL ON TABLE "public"."agenda_alert_log" TO "authenticated";
GRANT ALL ON TABLE "public"."agenda_alert_log" TO "service_role";



GRANT ALL ON SEQUENCE "public"."agenda_alert_log_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."agenda_alert_log_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."agenda_alert_log_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."agreements" TO "anon";
GRANT ALL ON TABLE "public"."agreements" TO "authenticated";
GRANT ALL ON TABLE "public"."agreements" TO "service_role";



GRANT ALL ON TABLE "public"."agreements_acceptances" TO "anon";
GRANT ALL ON TABLE "public"."agreements_acceptances" TO "authenticated";
GRANT ALL ON TABLE "public"."agreements_acceptances" TO "service_role";



GRANT ALL ON TABLE "public"."agreements_accepted_unique" TO "anon";
GRANT ALL ON TABLE "public"."agreements_accepted_unique" TO "authenticated";
GRANT ALL ON TABLE "public"."agreements_accepted_unique" TO "service_role";



GRANT ALL ON TABLE "public"."agreements_templates" TO "anon";
GRANT ALL ON TABLE "public"."agreements_templates" TO "authenticated";
GRANT ALL ON TABLE "public"."agreements_templates" TO "service_role";



GRANT ALL ON TABLE "public"."appointments" TO "anon";
GRANT ALL ON TABLE "public"."appointments" TO "authenticated";
GRANT ALL ON TABLE "public"."appointments" TO "service_role";



GRANT ALL ON TABLE "public"."appointments_events" TO "anon";
GRANT ALL ON TABLE "public"."appointments_events" TO "authenticated";
GRANT ALL ON TABLE "public"."appointments_events" TO "service_role";



GRANT ALL ON SEQUENCE "public"."appointments_events_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."appointments_events_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."appointments_events_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."audit_entries" TO "anon";
GRANT ALL ON TABLE "public"."audit_entries" TO "authenticated";
GRANT ALL ON TABLE "public"."audit_entries" TO "service_role";



GRANT ALL ON SEQUENCE "public"."audit_entries_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."audit_entries_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."audit_entries_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."audit_log" TO "anon";
GRANT ALL ON TABLE "public"."audit_log" TO "authenticated";
GRANT ALL ON TABLE "public"."audit_log" TO "service_role";



GRANT ALL ON TABLE "public"."bank_accounts" TO "anon";
GRANT ALL ON TABLE "public"."bank_accounts" TO "authenticated";
GRANT ALL ON TABLE "public"."bank_accounts" TO "service_role";



GRANT ALL ON TABLE "public"."bank_budgets" TO "anon";
GRANT ALL ON TABLE "public"."bank_budgets" TO "authenticated";
GRANT ALL ON TABLE "public"."bank_budgets" TO "service_role";



GRANT ALL ON TABLE "public"."bank_categories" TO "anon";
GRANT ALL ON TABLE "public"."bank_categories" TO "authenticated";
GRANT ALL ON TABLE "public"."bank_categories" TO "service_role";



GRANT ALL ON TABLE "public"."bank_rules" TO "anon";
GRANT ALL ON TABLE "public"."bank_rules" TO "authenticated";
GRANT ALL ON TABLE "public"."bank_rules" TO "service_role";



GRANT ALL ON TABLE "public"."bank_tx" TO "anon";
GRANT ALL ON TABLE "public"."bank_tx" TO "authenticated";
GRANT ALL ON TABLE "public"."bank_tx" TO "service_role";



GRANT ALL ON TABLE "public"."cal_bookings_raw" TO "anon";
GRANT ALL ON TABLE "public"."cal_bookings_raw" TO "authenticated";
GRANT ALL ON TABLE "public"."cal_bookings_raw" TO "service_role";



GRANT ALL ON TABLE "public"."cal_webhooks" TO "anon";
GRANT ALL ON TABLE "public"."cal_webhooks" TO "authenticated";
GRANT ALL ON TABLE "public"."cal_webhooks" TO "service_role";



GRANT ALL ON TABLE "public"."concept_dictionary" TO "anon";
GRANT ALL ON TABLE "public"."concept_dictionary" TO "authenticated";
GRANT ALL ON TABLE "public"."concept_dictionary" TO "service_role";



GRANT ALL ON TABLE "public"."contacts" TO "anon";
GRANT ALL ON TABLE "public"."contacts" TO "authenticated";
GRANT ALL ON TABLE "public"."contacts" TO "service_role";



GRANT ALL ON TABLE "public"."dental_budget_items" TO "anon";
GRANT ALL ON TABLE "public"."dental_budget_items" TO "authenticated";
GRANT ALL ON TABLE "public"."dental_budget_items" TO "service_role";



GRANT ALL ON TABLE "public"."dental_budgets" TO "anon";
GRANT ALL ON TABLE "public"."dental_budgets" TO "authenticated";
GRANT ALL ON TABLE "public"."dental_budgets" TO "service_role";



GRANT ALL ON TABLE "public"."dental_charts" TO "anon";
GRANT ALL ON TABLE "public"."dental_charts" TO "authenticated";
GRANT ALL ON TABLE "public"."dental_charts" TO "service_role";



GRANT ALL ON TABLE "public"."discharge_templates" TO "anon";
GRANT ALL ON TABLE "public"."discharge_templates" TO "authenticated";
GRANT ALL ON TABLE "public"."discharge_templates" TO "service_role";



GRANT ALL ON TABLE "public"."discharges" TO "anon";
GRANT ALL ON TABLE "public"."discharges" TO "authenticated";
GRANT ALL ON TABLE "public"."discharges" TO "service_role";



GRANT ALL ON TABLE "public"."doc_folios" TO "anon";
GRANT ALL ON TABLE "public"."doc_folios" TO "authenticated";
GRANT ALL ON TABLE "public"."doc_folios" TO "service_role";



GRANT ALL ON TABLE "public"."doctor_letterheads" TO "anon";
GRANT ALL ON TABLE "public"."doctor_letterheads" TO "authenticated";
GRANT ALL ON TABLE "public"."doctor_letterheads" TO "service_role";



GRANT ALL ON SEQUENCE "public"."document_folio_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."document_folio_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."document_folio_seq" TO "service_role";



GRANT ALL ON TABLE "public"."drug_condition_alerts" TO "anon";
GRANT ALL ON TABLE "public"."drug_condition_alerts" TO "authenticated";
GRANT ALL ON TABLE "public"."drug_condition_alerts" TO "service_role";



GRANT ALL ON TABLE "public"."drug_dictionary" TO "anon";
GRANT ALL ON TABLE "public"."drug_dictionary" TO "authenticated";
GRANT ALL ON TABLE "public"."drug_dictionary" TO "service_role";



GRANT ALL ON TABLE "public"."drug_interactions" TO "anon";
GRANT ALL ON TABLE "public"."drug_interactions" TO "authenticated";
GRANT ALL ON TABLE "public"."drug_interactions" TO "service_role";



GRANT ALL ON TABLE "public"."equilibrio_checkins" TO "anon";
GRANT ALL ON TABLE "public"."equilibrio_checkins" TO "authenticated";
GRANT ALL ON TABLE "public"."equilibrio_checkins" TO "service_role";



GRANT ALL ON TABLE "public"."equilibrio_plan_items" TO "anon";
GRANT ALL ON TABLE "public"."equilibrio_plan_items" TO "authenticated";
GRANT ALL ON TABLE "public"."equilibrio_plan_items" TO "service_role";



GRANT ALL ON TABLE "public"."equilibrio_plans" TO "anon";
GRANT ALL ON TABLE "public"."equilibrio_plans" TO "authenticated";
GRANT ALL ON TABLE "public"."equilibrio_plans" TO "service_role";



GRANT ALL ON TABLE "public"."equilibrio_task_library" TO "anon";
GRANT ALL ON TABLE "public"."equilibrio_task_library" TO "authenticated";
GRANT ALL ON TABLE "public"."equilibrio_task_library" TO "service_role";



GRANT ALL ON TABLE "public"."exercise_plans" TO "anon";
GRANT ALL ON TABLE "public"."exercise_plans" TO "authenticated";
GRANT ALL ON TABLE "public"."exercise_plans" TO "service_role";



GRANT ALL ON TABLE "public"."export_templates" TO "anon";
GRANT ALL ON TABLE "public"."export_templates" TO "authenticated";
GRANT ALL ON TABLE "public"."export_templates" TO "service_role";



GRANT ALL ON TABLE "public"."features" TO "anon";
GRANT ALL ON TABLE "public"."features" TO "authenticated";
GRANT ALL ON TABLE "public"."features" TO "service_role";



GRANT ALL ON TABLE "public"."file_embeddings" TO "anon";
GRANT ALL ON TABLE "public"."file_embeddings" TO "authenticated";
GRANT ALL ON TABLE "public"."file_embeddings" TO "service_role";



GRANT ALL ON TABLE "public"."form_responses" TO "anon";
GRANT ALL ON TABLE "public"."form_responses" TO "authenticated";
GRANT ALL ON TABLE "public"."form_responses" TO "service_role";



GRANT ALL ON TABLE "public"."form_templates" TO "anon";
GRANT ALL ON TABLE "public"."form_templates" TO "authenticated";
GRANT ALL ON TABLE "public"."form_templates" TO "service_role";



GRANT ALL ON TABLE "public"."jotform_webhooks" TO "anon";
GRANT ALL ON TABLE "public"."jotform_webhooks" TO "authenticated";
GRANT ALL ON TABLE "public"."jotform_webhooks" TO "service_role";



GRANT ALL ON TABLE "public"."lab_request_items" TO "anon";
GRANT ALL ON TABLE "public"."lab_request_items" TO "authenticated";
GRANT ALL ON TABLE "public"."lab_request_items" TO "service_role";



GRANT ALL ON TABLE "public"."lab_requests" TO "anon";
GRANT ALL ON TABLE "public"."lab_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."lab_requests" TO "service_role";



GRANT ALL ON TABLE "public"."lab_results" TO "anon";
GRANT ALL ON TABLE "public"."lab_results" TO "authenticated";
GRANT ALL ON TABLE "public"."lab_results" TO "service_role";



GRANT ALL ON TABLE "public"."lab_test_templates" TO "anon";
GRANT ALL ON TABLE "public"."lab_test_templates" TO "authenticated";
GRANT ALL ON TABLE "public"."lab_test_templates" TO "service_role";



GRANT ALL ON TABLE "public"."lab_upload_tokens" TO "anon";
GRANT ALL ON TABLE "public"."lab_upload_tokens" TO "authenticated";
GRANT ALL ON TABLE "public"."lab_upload_tokens" TO "service_role";



GRANT ALL ON TABLE "public"."mente_assessments" TO "anon";
GRANT ALL ON TABLE "public"."mente_assessments" TO "authenticated";
GRANT ALL ON TABLE "public"."mente_assessments" TO "service_role";



GRANT ALL ON TABLE "public"."mente_sessions" TO "anon";
GRANT ALL ON TABLE "public"."mente_sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."mente_sessions" TO "service_role";



GRANT ALL ON TABLE "public"."modules" TO "anon";
GRANT ALL ON TABLE "public"."modules" TO "authenticated";
GRANT ALL ON TABLE "public"."modules" TO "service_role";



GRANT ALL ON TABLE "public"."note_embeddings" TO "anon";
GRANT ALL ON TABLE "public"."note_embeddings" TO "authenticated";
GRANT ALL ON TABLE "public"."note_embeddings" TO "service_role";



GRANT ALL ON TABLE "public"."note_templates" TO "anon";
GRANT ALL ON TABLE "public"."note_templates" TO "authenticated";
GRANT ALL ON TABLE "public"."note_templates" TO "service_role";



GRANT ALL ON TABLE "public"."notify_inbound" TO "anon";
GRANT ALL ON TABLE "public"."notify_inbound" TO "authenticated";
GRANT ALL ON TABLE "public"."notify_inbound" TO "service_role";



GRANT ALL ON SEQUENCE "public"."notify_inbound_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."notify_inbound_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."notify_inbound_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."notify_status" TO "anon";
GRANT ALL ON TABLE "public"."notify_status" TO "authenticated";
GRANT ALL ON TABLE "public"."notify_status" TO "service_role";



GRANT ALL ON SEQUENCE "public"."notify_status_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."notify_status_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."notify_status_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."org_bank_settings" TO "anon";
GRANT ALL ON TABLE "public"."org_bank_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."org_bank_settings" TO "service_role";



GRANT ALL ON TABLE "public"."org_disclaimers" TO "anon";
GRANT ALL ON TABLE "public"."org_disclaimers" TO "authenticated";
GRANT ALL ON TABLE "public"."org_disclaimers" TO "service_role";



GRANT ALL ON TABLE "public"."org_features" TO "anon";
GRANT ALL ON TABLE "public"."org_features" TO "authenticated";
GRANT ALL ON TABLE "public"."org_features" TO "service_role";



GRANT ALL ON TABLE "public"."org_invoices" TO "anon";
GRANT ALL ON TABLE "public"."org_invoices" TO "authenticated";
GRANT ALL ON TABLE "public"."org_invoices" TO "service_role";



GRANT ALL ON TABLE "public"."org_ledger_transactions" TO "anon";
GRANT ALL ON TABLE "public"."org_ledger_transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."org_ledger_transactions" TO "service_role";



GRANT ALL ON TABLE "public"."org_ledger_balances" TO "anon";
GRANT ALL ON TABLE "public"."org_ledger_balances" TO "authenticated";
GRANT ALL ON TABLE "public"."org_ledger_balances" TO "service_role";



GRANT ALL ON TABLE "public"."org_members" TO "anon";
GRANT ALL ON TABLE "public"."org_members" TO "authenticated";
GRANT ALL ON TABLE "public"."org_members" TO "service_role";



GRANT ALL ON TABLE "public"."org_subscriptions" TO "anon";
GRANT ALL ON TABLE "public"."org_subscriptions" TO "authenticated";
GRANT ALL ON TABLE "public"."org_subscriptions" TO "service_role";



GRANT ALL ON TABLE "public"."organization_members" TO "anon";
GRANT ALL ON TABLE "public"."organization_members" TO "authenticated";
GRANT ALL ON TABLE "public"."organization_members" TO "service_role";



GRANT ALL ON TABLE "public"."organizations" TO "anon";
GRANT ALL ON TABLE "public"."organizations" TO "authenticated";
GRANT ALL ON TABLE "public"."organizations" TO "service_role";



GRANT ALL ON TABLE "public"."patient_appointments" TO "anon";
GRANT ALL ON TABLE "public"."patient_appointments" TO "authenticated";
GRANT ALL ON TABLE "public"."patient_appointments" TO "service_role";



GRANT ALL ON TABLE "public"."patient_conditions" TO "anon";
GRANT ALL ON TABLE "public"."patient_conditions" TO "authenticated";
GRANT ALL ON TABLE "public"."patient_conditions" TO "service_role";



GRANT ALL ON TABLE "public"."patient_file_access_log" TO "anon";
GRANT ALL ON TABLE "public"."patient_file_access_log" TO "authenticated";
GRANT ALL ON TABLE "public"."patient_file_access_log" TO "service_role";



GRANT ALL ON TABLE "public"."patient_file_versions" TO "anon";
GRANT ALL ON TABLE "public"."patient_file_versions" TO "authenticated";
GRANT ALL ON TABLE "public"."patient_file_versions" TO "service_role";



GRANT ALL ON TABLE "public"."patient_files" TO "anon";
GRANT ALL ON TABLE "public"."patient_files" TO "authenticated";
GRANT ALL ON TABLE "public"."patient_files" TO "service_role";



GRANT ALL ON TABLE "public"."patient_labels" TO "anon";
GRANT ALL ON TABLE "public"."patient_labels" TO "authenticated";
GRANT ALL ON TABLE "public"."patient_labels" TO "service_role";



GRANT ALL ON TABLE "public"."patient_medications" TO "anon";
GRANT ALL ON TABLE "public"."patient_medications" TO "authenticated";
GRANT ALL ON TABLE "public"."patient_medications" TO "service_role";



GRANT ALL ON TABLE "public"."patient_note_versions" TO "anon";
GRANT ALL ON TABLE "public"."patient_note_versions" TO "authenticated";
GRANT ALL ON TABLE "public"."patient_note_versions" TO "service_role";



GRANT ALL ON TABLE "public"."patient_notes_audit" TO "anon";
GRANT ALL ON TABLE "public"."patient_notes_audit" TO "authenticated";
GRANT ALL ON TABLE "public"."patient_notes_audit" TO "service_role";



GRANT ALL ON SEQUENCE "public"."patient_notes_audit_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."patient_notes_audit_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."patient_notes_audit_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."patient_panels" TO "anon";
GRANT ALL ON TABLE "public"."patient_panels" TO "authenticated";
GRANT ALL ON TABLE "public"."patient_panels" TO "service_role";



GRANT ALL ON TABLE "public"."patient_permissions" TO "anon";
GRANT ALL ON TABLE "public"."patient_permissions" TO "authenticated";
GRANT ALL ON TABLE "public"."patient_permissions" TO "service_role";



GRANT ALL ON TABLE "public"."patient_providers" TO "anon";
GRANT ALL ON TABLE "public"."patient_providers" TO "authenticated";
GRANT ALL ON TABLE "public"."patient_providers" TO "service_role";



GRANT ALL ON TABLE "public"."patient_share_access" TO "anon";
GRANT ALL ON TABLE "public"."patient_share_access" TO "authenticated";
GRANT ALL ON TABLE "public"."patient_share_access" TO "service_role";



GRANT ALL ON SEQUENCE "public"."patient_share_access_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."patient_share_access_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."patient_share_access_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."patient_shares" TO "anon";
GRANT ALL ON TABLE "public"."patient_shares" TO "authenticated";
GRANT ALL ON TABLE "public"."patient_shares" TO "service_role";



GRANT ALL ON TABLE "public"."patient_tags" TO "anon";
GRANT ALL ON TABLE "public"."patient_tags" TO "authenticated";
GRANT ALL ON TABLE "public"."patient_tags" TO "service_role";



GRANT ALL ON TABLE "public"."patient_task_templates" TO "anon";
GRANT ALL ON TABLE "public"."patient_task_templates" TO "authenticated";
GRANT ALL ON TABLE "public"."patient_task_templates" TO "service_role";



GRANT ALL ON TABLE "public"."patient_tasks" TO "anon";
GRANT ALL ON TABLE "public"."patient_tasks" TO "authenticated";
GRANT ALL ON TABLE "public"."patient_tasks" TO "service_role";



GRANT ALL ON TABLE "public"."patients" TO "anon";
GRANT ALL ON TABLE "public"."patients" TO "authenticated";
GRANT ALL ON TABLE "public"."patients" TO "service_role";



GRANT ALL ON TABLE "public"."prescription_items" TO "anon";
GRANT ALL ON TABLE "public"."prescription_items" TO "authenticated";
GRANT ALL ON TABLE "public"."prescription_items" TO "service_role";



GRANT ALL ON TABLE "public"."prescription_templates" TO "anon";
GRANT ALL ON TABLE "public"."prescription_templates" TO "authenticated";
GRANT ALL ON TABLE "public"."prescription_templates" TO "service_role";



GRANT ALL ON TABLE "public"."prescriptions" TO "anon";
GRANT ALL ON TABLE "public"."prescriptions" TO "authenticated";
GRANT ALL ON TABLE "public"."prescriptions" TO "service_role";



GRANT ALL ON TABLE "public"."pulso_measurements" TO "anon";
GRANT ALL ON TABLE "public"."pulso_measurements" TO "authenticated";
GRANT ALL ON TABLE "public"."pulso_measurements" TO "service_role";



GRANT ALL ON TABLE "public"."pulso_targets" TO "anon";
GRANT ALL ON TABLE "public"."pulso_targets" TO "authenticated";
GRANT ALL ON TABLE "public"."pulso_targets" TO "service_role";



GRANT ALL ON TABLE "public"."referral_templates" TO "anon";
GRANT ALL ON TABLE "public"."referral_templates" TO "authenticated";
GRANT ALL ON TABLE "public"."referral_templates" TO "service_role";



GRANT ALL ON TABLE "public"."referrals" TO "anon";
GRANT ALL ON TABLE "public"."referrals" TO "authenticated";
GRANT ALL ON TABLE "public"."referrals" TO "service_role";



GRANT ALL ON TABLE "public"."rehab_sessions" TO "anon";
GRANT ALL ON TABLE "public"."rehab_sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."rehab_sessions" TO "service_role";



GRANT ALL ON TABLE "public"."reminder_logs" TO "anon";
GRANT ALL ON TABLE "public"."reminder_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."reminder_logs" TO "service_role";



GRANT ALL ON SEQUENCE "public"."reminder_logs_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."reminder_logs_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."reminder_logs_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."reminder_prefs" TO "anon";
GRANT ALL ON TABLE "public"."reminder_prefs" TO "authenticated";
GRANT ALL ON TABLE "public"."reminder_prefs" TO "service_role";



GRANT ALL ON TABLE "public"."reminder_queue" TO "anon";
GRANT ALL ON TABLE "public"."reminder_queue" TO "authenticated";
GRANT ALL ON TABLE "public"."reminder_queue" TO "service_role";



GRANT ALL ON TABLE "public"."reminder_templates" TO "anon";
GRANT ALL ON TABLE "public"."reminder_templates" TO "authenticated";
GRANT ALL ON TABLE "public"."reminder_templates" TO "service_role";



GRANT ALL ON TABLE "public"."reminders" TO "anon";
GRANT ALL ON TABLE "public"."reminders" TO "authenticated";
GRANT ALL ON TABLE "public"."reminders" TO "service_role";



GRANT ALL ON TABLE "public"."reminders_daily_stats" TO "anon";
GRANT ALL ON TABLE "public"."reminders_daily_stats" TO "authenticated";
GRANT ALL ON TABLE "public"."reminders_daily_stats" TO "service_role";



GRANT ALL ON TABLE "public"."reminders_logs_view" TO "anon";
GRANT ALL ON TABLE "public"."reminders_logs_view" TO "authenticated";
GRANT ALL ON TABLE "public"."reminders_logs_view" TO "service_role";



GRANT ALL ON TABLE "public"."reminders_templates" TO "anon";
GRANT ALL ON TABLE "public"."reminders_templates" TO "authenticated";
GRANT ALL ON TABLE "public"."reminders_templates" TO "service_role";



GRANT ALL ON TABLE "public"."report_schedules" TO "anon";
GRANT ALL ON TABLE "public"."report_schedules" TO "authenticated";
GRANT ALL ON TABLE "public"."report_schedules" TO "service_role";



GRANT ALL ON TABLE "public"."saved_searches" TO "anon";
GRANT ALL ON TABLE "public"."saved_searches" TO "authenticated";
GRANT ALL ON TABLE "public"."saved_searches" TO "service_role";



GRANT ALL ON TABLE "public"."saved_views" TO "anon";
GRANT ALL ON TABLE "public"."saved_views" TO "authenticated";
GRANT ALL ON TABLE "public"."saved_views" TO "service_role";



GRANT ALL ON TABLE "public"."sonrisa_quote_items" TO "anon";
GRANT ALL ON TABLE "public"."sonrisa_quote_items" TO "authenticated";
GRANT ALL ON TABLE "public"."sonrisa_quote_items" TO "service_role";



GRANT ALL ON TABLE "public"."sonrisa_quotes" TO "anon";
GRANT ALL ON TABLE "public"."sonrisa_quotes" TO "authenticated";
GRANT ALL ON TABLE "public"."sonrisa_quotes" TO "service_role";



GRANT ALL ON TABLE "public"."sonrisa_treatments" TO "anon";
GRANT ALL ON TABLE "public"."sonrisa_treatments" TO "authenticated";
GRANT ALL ON TABLE "public"."sonrisa_treatments" TO "service_role";



GRANT ALL ON TABLE "public"."tag_permissions" TO "anon";
GRANT ALL ON TABLE "public"."tag_permissions" TO "authenticated";
GRANT ALL ON TABLE "public"."tag_permissions" TO "service_role";



GRANT ALL ON TABLE "public"."tags" TO "anon";
GRANT ALL ON TABLE "public"."tags" TO "authenticated";
GRANT ALL ON TABLE "public"."tags" TO "service_role";



GRANT ALL ON TABLE "public"."user_prefs" TO "anon";
GRANT ALL ON TABLE "public"."user_prefs" TO "authenticated";
GRANT ALL ON TABLE "public"."user_prefs" TO "service_role";



GRANT ALL ON TABLE "public"."v_my_orgs" TO "anon";
GRANT ALL ON TABLE "public"."v_my_orgs" TO "authenticated";
GRANT ALL ON TABLE "public"."v_my_orgs" TO "service_role";



GRANT ALL ON TABLE "public"."v_org_features" TO "anon";
GRANT ALL ON TABLE "public"."v_org_features" TO "authenticated";
GRANT ALL ON TABLE "public"."v_org_features" TO "service_role";



GRANT ALL ON TABLE "public"."v_patient_share_access" TO "anon";
GRANT ALL ON TABLE "public"."v_patient_share_access" TO "authenticated";
GRANT ALL ON TABLE "public"."v_patient_share_access" TO "service_role";



GRANT ALL ON TABLE "public"."v_patients" TO "anon";
GRANT ALL ON TABLE "public"."v_patients" TO "authenticated";
GRANT ALL ON TABLE "public"."v_patients" TO "service_role";



GRANT ALL ON TABLE "public"."v_patients_export" TO "anon";
GRANT ALL ON TABLE "public"."v_patients_export" TO "authenticated";
GRANT ALL ON TABLE "public"."v_patients_export" TO "service_role";



GRANT ALL ON TABLE "public"."v_reminders_logs" TO "anon";
GRANT ALL ON TABLE "public"."v_reminders_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."v_reminders_logs" TO "service_role";



GRANT ALL ON TABLE "public"."work_assignments" TO "anon";
GRANT ALL ON TABLE "public"."work_assignments" TO "authenticated";
GRANT ALL ON TABLE "public"."work_assignments" TO "service_role";



GRANT ALL ON TABLE "public"."work_items" TO "anon";
GRANT ALL ON TABLE "public"."work_items" TO "authenticated";
GRANT ALL ON TABLE "public"."work_items" TO "service_role";



GRANT ALL ON TABLE "public"."work_templates" TO "anon";
GRANT ALL ON TABLE "public"."work_templates" TO "authenticated";
GRANT ALL ON TABLE "public"."work_templates" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";






























RESET ALL;
