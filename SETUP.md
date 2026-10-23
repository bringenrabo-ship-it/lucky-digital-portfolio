# Lucky Digital: admin deployment guide

## 1. What to change in GitHub
- **Replace** (same names): `index.html`, `style.css`, `live.js`, `admin.html`, `admin.js`, `config.js`, `SETUP.md`
- **Add** (new): `supabase-update.sql`
- **Leave unchanged**: `script.js`, `theme.js`, `supabase.sql` (already run), `favicon.svg`, `README.md`

`config.js` was missing from the files you uploaded (you sent `config.pdf`), which caused the "Supabase URL and anon key" error. Both pages load `config.js`; it now holds your project URL (base URL only, no `/rest/v1/`) and publishable key. No Vercel environment variables are needed because this is a static site.

## 2. SQL
Open Supabase > SQL Editor, paste `supabase-update.sql`, run it once. It is safe to re-run. It adds missing columns, `achievements` and `experience` tables, indexes, RLS policies and the `media` Storage bucket (public read, admin-only write, 5 MB, images and PDF). Existing tables and data are untouched. Security uses your existing `public.admins` table and `is_admin()`.

## 3. Deploy and check
Commit and push; Vercel redeploys. In Vercel > Deployments, the latest one should say Ready. Opening the site should show no error.

## 4. Open the admin and sign in
Go to `https://YOUR-SITE/admin.html` (there is no `/admin` route). Sign in with the email and password of the Supabase Auth user whose ID is `3c363552-ffcc-4e37-bd59-dd44edb315c2`. If that user has no password, set one in Supabase > Authentication > Users. Other accounts are rejected.

## 5. Check a change is live
Admin > Homepage: change the hero heading > Save changes > reload the public site. For items, set the status to published.

## Honest limits
- Not tested against your live project; I only syntax-checked the code. Test sign-in, one save and one upload first.
- Appearance loads after the page paints, so a brief flash of default colours is possible. The big hero heading keeps its built-in gradient, so the text colour does not change it.
- Fonts are limited to five safe system fonts (no outside font service).
- The existing site has no Skills section, so "Skills and services" manages Services; skills text lives under About me.
- There is no separate "short description" field; the Introduction is that text. Profile photo shows in About.
- Page/section builders, a media-library browser and nav editor are still not included.
