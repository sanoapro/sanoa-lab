-- Ejecuta en Supabase SQL Editor: copia/pega bloques según tu necesidad
-- 1) Simular sesión con el usuario más reciente
select set_config(
  'request.jwt.claims',
  (select json_build_object('sub', id, 'email', email, 'role', 'authenticated')::text from auth.users order by created_at desc limit 1),
  true
);

-- 2) Verificar helpers y permisos via share
with shared_to_me as (
  select s.patient_id as id
  from public.patient_shares s
  where s.revoked_at is null
    and (s.shared_with_user_id = auth.uid() or lower(s.shared_with_email) = public.auth_email())
  limit 1
)
select
  (select public.patient_share_allows(id, 'read')  from shared_to_me)  as can_read_via_share,
  (select public.patient_share_allows(id, 'write') from shared_to_me)  as can_write_via_share;

-- 3) Verificar índices FTS y triggers
select indexname from pg_indexes where tablename in ('patients','patient_notes') and indexname like '%search%';
select tgname, tgrelid::regclass from pg_trigger where tgname like 'trg_set_updated_at_%';
