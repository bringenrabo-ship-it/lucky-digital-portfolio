# Lucky Digital: admin setup guide

## 1. Create the backend (about 10 minutes)
1. Create a free project at supabase.com.
2. SQL Editor > paste all of `supabase.sql` > Run. This creates the tables, Row Level Security policies and seeds your current services, project and contact details.
3. Authentication > Providers > Email: keep enabled. Authentication > Sign In / Providers settings: **turn OFF "Allow new users to sign up"**.
4. Authentication > Users > Add user (your email + a strong password).
5. SQL Editor, run (use your email): `insert into admins select id from auth.users where email = 'you@example.com';`

## 2. Connect the site
Project Settings > API: copy the **Project URL** and the **anon public** key into `config.js`.
The anon key is public by design; the database is protected by RLS, not by hiding this key. Never use the `service_role` key anywhere in this project.

## 3. Deploy
Commit everything to your GitHub repo. Vercel redeploys automatically. Open `/admin.html` and sign in.

## What takes effect immediately (no redeploy)
Services and projects (add, edit, delete, reorder, publish, unpublish, draft), contact email, WhatsApp number and footer tagline. Contact and footer links across the site update from these settings. "Preview (with drafts)" opens `index.html?preview=1`, which shows drafts only while you are signed in.

## What needs a redeploy (edit files, push to GitHub)
Layout, colours, fonts, new page sections, page copy in `index.html` (hero, about, process steps), navigation links, and any code change.

## Safety behaviour
- Authorization is enforced by Supabase RLS (`is_admin()`); the public can only read published rows.
- Field lengths and URL format are checked in the admin and again by database constraints.
- If Supabase is unreachable, empty, or `config.js` is blank, the site shows the built-in static content.
- Deleting asks for confirmation.

## Not included in this version
Page creation, a section builder, a media library, FAQ/testimonial/education/experience content types, a visual style editor and a navigation editor. These were in your brief but are not built, so the admin shows no controls for them. Each can be added as its own table and admin tab in the same pattern as services and projects.

## Theme
The public site and admin each remember light/dark separately (`ld-theme`, `ld-admin-theme`) in the visitor's browser.
