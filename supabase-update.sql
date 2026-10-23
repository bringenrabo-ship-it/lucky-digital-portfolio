-- Additive, idempotent migration. Run ONCE after supabase.sql. Creates only what is missing; deletes no data.
alter table site_settings drop constraint if exists site_settings_key_check;
alter table site_settings drop constraint if exists site_settings_value_check;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'site_settings_key_format') then
    alter table site_settings add constraint site_settings_key_format check (key ~ '^[a-z0-9_]{1,40}$'); end if;
  if not exists (select 1 from pg_constraint where conname = 'site_settings_value_len') then
    alter table site_settings add constraint site_settings_value_len check (char_length(value) <= 2000); end if;
end $$;

alter table projects add column if not exists category text not null default '' check (char_length(category) <= 60);
alter table projects add column if not exists featured boolean not null default false;
alter table projects add column if not exists image_url text not null default '' check (image_url = '' or image_url ~ '^https://');

create table if not exists achievements (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 120),
  issuer text not null default '' check (char_length(issuer) <= 120),
  description text not null default '' check (char_length(description) <= 600),
  date date,
  image_url text not null default '' check (image_url = '' or image_url ~ '^https://'),
  link text not null default '' check (link = '' or link ~ '^https?://'),
  sort int not null default 0,
  status text not null default 'draft' check (status in ('draft','published','unpublished')),
  created_at timestamptz not null default now());
create table if not exists experience (
  id uuid primary key default gen_random_uuid(),
  role text not null check (char_length(role) between 1 and 120),
  organisation text not null default '' check (char_length(organisation) <= 120),
  kind text not null default 'Professional' check (kind in ('Leadership','Volunteer','Professional')),
  start_date date, end_date date,
  description text not null default '' check (char_length(description) <= 800),
  sort int not null default 0,
  status text not null default 'draft' check (status in ('draft','published','unpublished')),
  created_at timestamptz not null default now());

create index if not exists achievements_status_sort on achievements (status, sort);
create index if not exists experience_status_sort on experience (status, sort);
create index if not exists projects_status_sort on projects (status, sort);
create index if not exists services_status_sort on services (status, sort);

do $$ declare t text; begin
  foreach t in array array['achievements','experience'] loop
    execute format('alter table %I enable row level security', t);
    if not exists (select 1 from pg_policies where schemaname='public' and tablename=t and policyname='public reads published') then
      execute format('create policy "public reads published" on %I for select using (status = ''published'' or is_admin())', t); end if;
    if not exists (select 1 from pg_policies where schemaname='public' and tablename=t and policyname='admin writes') then
      execute format('create policy "admin writes" on %I for all using (is_admin()) with check (is_admin())', t); end if;
  end loop;
end $$;

-- Storage bucket for uploads (public read, admin-only write, 5 MB, images + PDF)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media','media',true,5242880,array['image/jpeg','image/png','image/webp','image/gif','application/pdf'])
on conflict (id) do nothing;
do $$ declare op text; begin
  foreach op in array array['insert','update','delete'] loop
    if not exists (select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='media admin '||op) then
      if op = 'insert' then execute 'create policy "media admin insert" on storage.objects for insert to authenticated with check (bucket_id = ''media'' and public.is_admin())';
      elsif op = 'update' then execute 'create policy "media admin update" on storage.objects for update to authenticated using (bucket_id = ''media'' and public.is_admin())';
      else execute 'create policy "media admin delete" on storage.objects for delete to authenticated using (bucket_id = ''media'' and public.is_admin())'; end if;
    end if;
  end loop;
end $$;
