# Launching a New Client's Wedding Website

There are two ways to onboard a new couple, depending on whether they need
their own fully separate database.

**Default: use the shared database (recommended for almost everyone).**
No new GitHub repo, no new Supabase project, no new Vercel deployment. Just:

1. Go to `/admin` on the main site and sign in
2. Click **"New Wedding Site"**
3. Enter the groom's and bride's names — a URL slug is generated
   automatically (e.g. `yoursite.com/rahul-anjali`)
4. The site is created instantly, fully populated with sample photos and
   events, ready for the couple to edit through their own `/admin` login

Every couple's data is walled off by database-level security rules, not
just app logic — one couple's login can never see or touch another's data.
This is the fastest path and what you should use by default.

**Exception: a client wants a fully separate, isolated Supabase project**
(their own billing, their own backups, total infrastructure separation from
everyone else). Use the checklist below only in that case. Budget about 15
minutes once you've done it.

---

## 1. Copy the codebase (GitHub)

1. Go to this repository on GitHub
2. Click **"Use this template"** (top right, next to the green "Code" button)
3. Click **"Create a new repository"**
4. Name it after the client, e.g. `rahul-anjali-wedding`
5. Click **Create repository**

You now have a brand-new, independent copy of the whole site's code.

## 2. Create their database (Supabase)

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Click **New Project**
3. Give it a name (e.g. "Rahul & Anjali Wedding"), pick a region, set a
   database password (save it somewhere)
4. Wait ~2 minutes for it to finish setting up

## 3. Set up the database structure

1. In the new Supabase project, open **SQL Editor** in the left sidebar
2. Click **New query**
3. Open `supabase/bootstrap.sql` in the new GitHub repo from step 1, copy
   its entire contents
4. Paste into the SQL Editor and click **Run**

This creates every table, security rule, and storage bucket the app needs,
including the multi-tenant `sites` table — so even on this separate
database, the same `/admin` → "New Wedding Site" flow works. No
couple-specific data is pre-loaded; the site starts as an empty directory.

## 4. Deploy the website (Vercel)

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click **Import** next to the new GitHub repo from step 1
3. Before clicking Deploy, expand **Environment Variables** and add two:
   - `VITE_SUPABASE_URL` — from Supabase → **Project Settings → API** → "Project URL"
   - `VITE_SUPABASE_PUBLISHABLE_KEY` — from the same page → "Publishable key"
4. Click **Deploy**

You'll get a live URL like `rahul-anjali-wedding.vercel.app`. (Optional:
add the couple's own domain under Vercel → **Settings → Domains**.)

## 5. Create the site

1. Visit `/admin` on the new deployment and sign up with the client's email
   and a password
2. Click **"New Wedding Site"**, enter the couple's names
3. The first account to sign up on this database owns everything created
   from it — there's no shared access with your main database

## 6. Hand it off

Give the couple:
- Their site URL (e.g. `rahul-anjali-wedding.vercel.app/rahul-anjali`)
- Their login email + password (for `/rahul-anjali-wedding.vercel.app/admin`)

They take it from there, replacing the sample photos and details with their
own through the admin panel.

---

## Troubleshooting

- **Site shows a crash / blank page after deploying** — almost always
  missing or mistyped environment variables in Vercel (step 4). Double-check
  `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` match the new
  Supabase project exactly, then redeploy.
- **Admin dashboard says "Not Authorized"** — this means someone else is
  already an admin of that specific site. Only the *first* person to visit
  a given site's `/admin` becomes its admin; check the `user_roles` table
  in Supabase's Table Editor if the wrong account got in first.
- **Favicon still shows the default icon** — Admin → General Settings →
  scroll to "Browser Tab Icon (Favicon)" and upload one; it's per-site,
  not shared.
