-- Run once in Supabase > SQL Editor.
create table if not exists admins (user_id uuid primary key references auth.users on delete cascade);
alter table admins enable row level security;
create or replace function is_admin() returns boolean language sql security definer stable set search_path = public
as $$ select exists (select 1 from admins where user_id = auth.uid()) $$;
create policy "admin sees own row" on admins for select using (user_id = auth.uid());

create table if not exists services (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 80),
  description text not null default '' check (char_length(description) <= 300),
  price text not null default '' check (char_length(price) <= 40),
  sort int not null default 0,
  status text not null default 'draft' check (status in ('draft','published','unpublished')),
  created_at timestamptz not null default now());
create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 80),
  description text not null default '' check (char_length(description) <= 400),
  url text not null check (url ~ '^https?://' and char_length(url) <= 300),
  sort int not null default 0,
  status text not null default 'draft' check (status in ('draft','published','unpublished')),
  created_at timestamptz not null default now());
create table if not exists site_settings (key text primary key check (key in ('email','whatsapp','tagline')), value text not null default '' check (char_length(value) <= 200));

do $$ declare t text; begin
  foreach t in array array['services','projects'] loop
    execute format('alter table %I enable row level security', t);
    execute format('create policy "public reads published" on %I for select using (status = ''published'' or is_admin())', t);
    execute format('create policy "admin writes" on %I for all using (is_admin()) with check (is_admin())', t);
  end loop;
end $$;
alter table site_settings enable row level security;
create policy "public reads settings" on site_settings for select using (true);
create policy "admin writes settings" on site_settings for all using (is_admin()) with check (is_admin());

-- Seed with what the site shows today
insert into site_settings values ('email','Bringenrabo@gmail.com'),('whatsapp','2348031350375'),('tagline','Your Ideas. Beautifully Built.') on conflict do nothing;
insert into services (title,description,price,sort,status) values
 ('Personal Portfolio Websites','A clean home online for your work, story and contact details.','From ₦10,000',1,'published'),
 ('Landing Pages','One focused page that explains your idea and invites people to act.','From ₦10,000',2,'published'),
 ('Small Business Websites','A professional website that presents your business clearly.','From ₦20,000',3,'published'),
 ('Website Redesigns','Already have a website? Let’s make it look and feel better.','Custom pricing',4,'published');
insert into projects (title,description,url,sort,status) values
 ('The MindCare Initiative','A youth mental health awareness initiative focused on mental health education, awareness and stigma reduction.','https://the-mindcare-initiative.vercel.app',1,'published');

-- AFTER creating your admin user in Authentication > Users, run (with your email):
-- insert into admins select id from auth.users where email = 'you@example.com';
