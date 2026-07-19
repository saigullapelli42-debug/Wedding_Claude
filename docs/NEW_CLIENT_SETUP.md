# Launching a New Client's Wedding Website

This is the full checklist for setting up a brand-new wedding website for a
client, using this project as the starting point. Every step below is a
click or a copy-paste on a website — no code editor, no terminal, no git
commands.

Budget about 15 minutes once you've done it once.

---

## 1. Copy the codebase (GitHub)

1. Go to this repository on GitHub
2. Click **"Use this template"** (top right, next to the green "Code" button)
3. Click **"Create a new repository"**
4. Name it after the client, e.g. `rahul-anjali-wedding`
5. Click **Create repository**

You now have a brand-new, independent copy of the whole site.

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

This creates every table, security rule, and storage bucket the site needs —
with no leftover content from any previous client. The new site will show
placeholder text until the couple fills in their own details.

## 4. Deploy the website (Vercel)

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click **Import** next to the new GitHub repo from step 1
3. Before clicking Deploy, expand **Environment Variables** and add two:
   - `VITE_SUPABASE_URL` — from Supabase → **Project Settings → API** → "Project URL"
   - `VITE_SUPABASE_PUBLISHABLE_KEY` — from the same page → "Publishable key"
4. Click **Deploy**

You'll get a live URL like `rahul-anjali-wedding.vercel.app`. (Optional:
add the couple's own domain under Vercel → **Settings → Domains**.)

## 5. Create the couple's admin login

1. In the new Supabase project → **Authentication → Users → Add User**
2. Enter their email and a password
3. Check **"Auto Confirm User"**
4. Click **Create user**

## 6. Hand it off

Give the couple:
- Their site URL
- Their login email + password
- A note that their first login at `/site-url/admin` automatically makes
  them the site's admin — no one else can register

They take it from there, filling in their own names, dates, photos, events,
and everything else through the admin panel.

---

## Troubleshooting

- **Site shows a crash / blank page after deploying** — almost always
  missing or mistyped environment variables in Vercel (step 4). Double-check
  `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` match the new
  Supabase project exactly, then redeploy.
- **Login screen says "Not Authorized"** — this means an admin already
  exists on that Supabase project. Only the *first* person to log in
  becomes admin; if that was the wrong account, add the correct `user_id`
  into the `user_roles` table manually via Supabase's Table Editor.
- **Favicon still shows the default icon** — Admin → General Settings →
  scroll to "Browser Tab Icon (Favicon)" and upload one; it's per-client,
  not shared.
