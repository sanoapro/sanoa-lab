-- FIX patient_shares.owner_id NOT NULL (backfill + trigger)
create extension if not exists pgcrypto;

update public.patient_shares s
set owner_id = p.user_id
from public.patients p
where s.patient_id = p.id
  and s.owner_id is null;

create or replace function public.trg_ps_set_owner_id()
returns trigger
language plpgsql
as $$
begin
  if new.owner_id is null then
    select user_id into new.owner_id from public.patients where id = new.patient_id;
  end if;
  return new;
end;
$$;

drop trigger if exists set_owner_id on public.patient_shares;
create trigger set_owner_id
before insert on public.patient_shares
for each row execute function public.trg_ps_set_owner_id();

create index if not exists idx_patient_shares_owner on public.patient_shares(owner_id);
create index if not exists idx_patient_shares_patient_owner on public.patient_shares(patient_id, owner_id);
create index if not exists idx_patient_shares_email_lower on public.patient_shares((lower(shared_with_email)));
