-- Copia idéntica del SQL aplicado en Supabase (ver SQL Editor)
begin;
alter table storage.objects enable row level security;
drop policy if exists "uploads read own"   on storage.objects;
drop policy if exists "uploads insert own" on storage.objects;
drop policy if exists "uploads update own" on storage.objects;
drop policy if exists "uploads delete own" on storage.objects;

create policy "uploads read own"   on storage.objects for select to authenticated using (bucket_id = 'uploads' and owner = auth.uid());
create policy "uploads insert own" on storage.objects for insert to authenticated with check (bucket_id = 'uploads' and owner = auth.uid());
create policy "uploads update own" on storage.objects for update to authenticated using (bucket_id = 'uploads' and owner = auth.uid());
create policy "uploads delete own" on storage.objects for delete to authenticated using (bucket_id = 'uploads' and owner = auth.uid());

create or replace function public.set_storage_owner() returns trigger language plpgsql security definer as $$
begin
  if new.bucket_id = 'uploads' and new.owner is null then
    new.owner := auth.uid();
  end if;
  return new;
end;
$$;

drop trigger if exists set_owner_on_uploads on storage.objects;
create trigger set_owner_on_uploads before insert on storage.objects for each row execute procedure public.set_storage_owner();
commit;
