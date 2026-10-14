-- Run in the SQL Editor of your NEW VOLT-IQ Supabase project.
-- Dashboard uploads work immediately. App uploads require Supabase Auth.
-- Authenticated object paths must be: <user UUID>/<unique filename>.pdf
-- Never put a service-role or secret key in a browser application.
begin;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('energy-audits', 'energy-audits', false, 20971520, array['application/pdf'])
on conflict (id) do nothing;

-- Do not silently reuse an existing bucket with different security settings.
do $$
begin
  if not exists (
    select 1 from storage.buckets
    where id = 'energy-audits'
      and public = false
      and file_size_limit = 20971520
      and allowed_mime_types = array['application/pdf']::text[]
  ) then
    raise exception 'energy-audits already exists with different settings. Review its privacy, size and MIME restrictions before continuing.';
  end if;
end $$;

-- Idempotent policy creation; no existing policies are removed.
do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'volt_iq_audits_select_own') then
    create policy volt_iq_audits_select_own on storage.objects
      for select to authenticated
      using (bucket_id = 'energy-audits' and (storage.foldername(name))[1] = (select auth.uid())::text);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'volt_iq_audits_insert_own') then
    create policy volt_iq_audits_insert_own on storage.objects
      for insert to authenticated
      with check (bucket_id = 'energy-audits' and (storage.foldername(name))[1] = (select auth.uid())::text);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'volt_iq_audits_update_own') then
    create policy volt_iq_audits_update_own on storage.objects
      for update to authenticated
      using (bucket_id = 'energy-audits' and (storage.foldername(name))[1] = (select auth.uid())::text)
      with check (bucket_id = 'energy-audits' and (storage.foldername(name))[1] = (select auth.uid())::text);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'volt_iq_audits_delete_own') then
    create policy volt_iq_audits_delete_own on storage.objects
      for delete to authenticated
      using (bucket_id = 'energy-audits' and (storage.foldername(name))[1] = (select auth.uid())::text);
  end if;
end $$;

commit;

-- Verify after execution: private bucket, 20 MiB limit, PDF MIME type, four policies.
select id, public, file_size_limit, allowed_mime_types
from storage.buckets where id = 'energy-audits';
select policyname, cmd, roles from pg_policies
where schemaname = 'storage' and tablename = 'objects'
  and policyname like 'volt_iq_audits_%';
