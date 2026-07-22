-- ============================================================================
-- WEDDING WEBSITE — ONE-CLICK SUPABASE BOOTSTRAP (multi-tenant schema)
-- ============================================================================
-- Run this ONCE in a brand-new Supabase project's SQL Editor to set up a
-- fully separate, isolated wedding-website database — for a client who
-- specifically wants their own dedicated Supabase project instead of sharing
-- the main one.
--
-- IMPORTANT: this matches the CURRENT multi-tenant schema (a `sites` table,
-- every content table scoped by site_id). The app's /admin sites directory
-- and "New Wedding Site" button will work against this database exactly like
-- the main shared one — the couple(s) using this database just won't be
-- mixed in with anyone on the shared database.
--
-- After running this:
--   1. Grab the new project's URL + publishable key (Project Settings → API)
--   2. Set them as VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY in the
--      Vercel project you deploy this codebase to
--   3. Visit /admin, sign up, and click "New Wedding Site" to create the
--      couple's site — no manual data entry into this database needed
-- ============================================================================

-- ── Tenancy root: sites table ───────────────────────────────────────────
create table public.sites (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  bride_name text not null default '',
  groom_name text not null default '',
  owner_user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
alter table public.sites enable row level security;

create policy "public read sites" on public.sites for select using (true);
create policy "authenticated create sites" on public.sites for insert
  with check (auth.uid() is not null and owner_user_id = auth.uid());

-- ── Admin roles (per-site) + helper functions ───────────────────────────
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('admin')),
  site_id uuid not null references public.sites(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, role, site_id)
);
alter table public.user_roles enable row level security;

create or replace function public.is_site_admin(check_site_id uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from public.user_roles
    where user_id = auth.uid() and role = 'admin' and site_id = check_site_id
  );
$$;

-- Used only by storage bucket policies below, where "is this user an admin
-- of *some* site" is enough (uploaded files are namespaced by site_id path).
create or replace function public.is_admin()
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from public.user_roles where user_id = auth.uid() and role = 'admin'
  );
$$;

-- First admin of a specific site (normally the creator is made admin
-- immediately on site creation, but this covers edge cases).
create or replace function public.bootstrap_first_site_admin(target_site_id uuid)
returns boolean language plpgsql security definer set search_path = public as $$
declare admin_count integer;
begin
  if auth.uid() is null then return false; end if;
  select count(*) into admin_count from public.user_roles where role = 'admin' and site_id = target_site_id;
  if admin_count = 0 then
    insert into public.user_roles (user_id, role, site_id) values (auth.uid(), 'admin', target_site_id)
    on conflict (user_id, role, site_id) do nothing;
    return true;
  end if;
  return public.is_site_admin(target_site_id);
end;
$$;

create policy "users can read own roles or site admins can read site roles" on public.user_roles
  for select using (user_id = auth.uid() or public.is_site_admin(site_id));
create policy "users can create own role rows" on public.user_roles
  for insert with check (user_id = auth.uid());

-- Now that user_roles/is_site_admin exist, sites can also be deleted by
-- their owner or any admin of that site.
create policy "owner or admin can delete site" on public.sites for delete
  using (owner_user_id = auth.uid() or public.is_site_admin(id));

-- ── Singleton per-site tables ────────────────────────────────────────────
create table public.site_settings (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null unique references public.sites(id) on delete cascade,
  bride_name text not null default '',
  groom_name text not null default '',
  wedding_title text not null default '',
  tagline text not null default '',
  wedding_date timestamptz,
  wedding_date_label text not null default '',
  hashtag text not null default '',
  rsvp_deadline text not null default '',
  welcome_message text not null default '',
  footer_text text not null default '',
  favicon_url text,
  favicon_path text,
  event_manager_name text not null default '',
  event_manager_whatsapp text not null default '',
  updated_at timestamptz not null default now()
);

create table public.hero (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null unique references public.sites(id) on delete cascade,
  title text not null default '',
  subtitle text not null default '',
  image_url text,
  image_path text,
  visible boolean not null default true,
  updated_at timestamptz not null default now()
);

create table public.venue (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null unique references public.sites(id) on delete cascade,
  name text not null default '',
  address text not null default '',
  description text not null default '',
  image_url text,
  image_path text,
  map_url text,
  map_embed_url text,
  directions_url text,
  updated_at timestamptz not null default now()
);

create table public.gift_settings (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null unique references public.sites(id) on delete cascade,
  enabled boolean not null default true,
  upi_id text not null default '',
  account_name text not null default '',
  bank_name text not null default '',
  bank_details text not null default '',
  qr_image_url text,
  qr_image_path text,
  updated_at timestamptz not null default now()
);

create table public.music_settings (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null unique references public.sites(id) on delete cascade,
  enabled boolean not null default true,
  autoplay boolean not null default false,
  default_track_id uuid,
  updated_at timestamptz not null default now()
);

alter table public.site_settings enable row level security;
alter table public.hero enable row level security;
alter table public.venue enable row level security;
alter table public.gift_settings enable row level security;
alter table public.music_settings enable row level security;

create policy "public read site_settings" on public.site_settings for select using (true);
create policy "admin insert site_settings" on public.site_settings for insert with check (public.is_site_admin(site_id));
create policy "admin write site_settings" on public.site_settings for update using (public.is_site_admin(site_id)) with check (public.is_site_admin(site_id));

create policy "public read hero" on public.hero for select using (true);
create policy "admin insert hero" on public.hero for insert with check (public.is_site_admin(site_id));
create policy "admin write hero" on public.hero for update using (public.is_site_admin(site_id)) with check (public.is_site_admin(site_id));

create policy "public read venue" on public.venue for select using (true);
create policy "admin insert venue" on public.venue for insert with check (public.is_site_admin(site_id));
create policy "admin write venue" on public.venue for update using (public.is_site_admin(site_id)) with check (public.is_site_admin(site_id));

create policy "public read gift_settings" on public.gift_settings for select using (true);
create policy "admin insert gift_settings" on public.gift_settings for insert with check (public.is_site_admin(site_id));
create policy "admin write gift_settings" on public.gift_settings for update using (public.is_site_admin(site_id)) with check (public.is_site_admin(site_id));

create policy "public read music_settings" on public.music_settings for select using (true);
create policy "admin insert music_settings" on public.music_settings for insert with check (public.is_site_admin(site_id));
create policy "admin write music_settings" on public.music_settings for update using (public.is_site_admin(site_id)) with check (public.is_site_admin(site_id));

-- ── Couple + timeline ────────────────────────────────────────────────────
create table public.couple_members (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites(id) on delete cascade,
  side text not null check (side in ('bride','groom')),
  name text not null default '',
  description text not null default '',
  image_url text,
  image_path text,
  social_links jsonb not null default '[]'::jsonb,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (site_id, side)
);

create table public.timeline_items (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites(id) on delete cascade,
  date_label text not null default '',
  title text not null default '',
  description text not null default '',
  image_url text,
  image_path text,
  icon text default '',
  display_order integer not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.couple_members enable row level security;
alter table public.timeline_items enable row level security;

create policy "public read couple_members" on public.couple_members for select using (true);
create policy "admin insert couple_members" on public.couple_members for insert with check (public.is_site_admin(site_id));
create policy "admin update couple_members" on public.couple_members for update using (public.is_site_admin(site_id)) with check (public.is_site_admin(site_id));
create policy "admin delete couple_members" on public.couple_members for delete using (public.is_site_admin(site_id));

create policy "public read published timeline_items" on public.timeline_items for select using (published = true);
create policy "admin read all timeline_items" on public.timeline_items for select using (public.is_site_admin(site_id));
create policy "admin insert timeline_items" on public.timeline_items for insert with check (public.is_site_admin(site_id));
create policy "admin update timeline_items" on public.timeline_items for update using (public.is_site_admin(site_id)) with check (public.is_site_admin(site_id));
create policy "admin delete timeline_items" on public.timeline_items for delete using (public.is_site_admin(site_id));

-- ── Gallery ──────────────────────────────────────────────────────────────
create table public.gallery_categories (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites(id) on delete cascade,
  name text not null,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (site_id, name)
);
create table public.gallery_images (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites(id) on delete cascade,
  category_id uuid references public.gallery_categories(id) on delete set null,
  image_url text not null,
  image_path text,
  title text not null default '',
  alt_text text not null default '',
  display_order integer not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.gallery_categories enable row level security;
alter table public.gallery_images enable row level security;

create policy "public read gallery_categories" on public.gallery_categories for select using (true);
create policy "admin insert gallery_categories" on public.gallery_categories for insert with check (public.is_site_admin(site_id));
create policy "admin update gallery_categories" on public.gallery_categories for update using (public.is_site_admin(site_id)) with check (public.is_site_admin(site_id));
create policy "admin delete gallery_categories" on public.gallery_categories for delete using (public.is_site_admin(site_id));

create policy "public read published gallery_images" on public.gallery_images for select using (published = true);
create policy "admin read all gallery_images" on public.gallery_images for select using (public.is_site_admin(site_id));
create policy "admin insert gallery_images" on public.gallery_images for insert with check (public.is_site_admin(site_id));
create policy "admin update gallery_images" on public.gallery_images for update using (public.is_site_admin(site_id)) with check (public.is_site_admin(site_id));
create policy "admin delete gallery_images" on public.gallery_images for delete using (public.is_site_admin(site_id));

-- ── Events ───────────────────────────────────────────────────────────────
create table public.events (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites(id) on delete cascade,
  name text not null default '',
  event_date text not null default '',
  start_time text not null default '',
  end_time text default '',
  venue text not null default '',
  address text default '',
  description text default '',
  image_url text,
  image_path text,
  icon text default '',
  map_url text,
  directions_url text,
  display_order integer not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.events enable row level security;

create policy "public read published events" on public.events for select using (published = true);
create policy "admin read all events" on public.events for select using (public.is_site_admin(site_id));
create policy "admin insert events" on public.events for insert with check (public.is_site_admin(site_id));
create policy "admin update events" on public.events for update using (public.is_site_admin(site_id)) with check (public.is_site_admin(site_id));
create policy "admin delete events" on public.events for delete using (public.is_site_admin(site_id));

-- ── Family ───────────────────────────────────────────────────────────────
create table public.family_groups (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites(id) on delete cascade,
  side text not null check (side in ('bride','groom')),
  title text not null default '',
  unique (site_id, side)
);
create table public.family_members (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites(id) on delete cascade,
  family_group_id uuid not null references public.family_groups(id) on delete cascade,
  name text not null default '',
  relationship text not null default '',
  image_url text,
  image_path text,
  description text default '',
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.family_groups enable row level security;
alter table public.family_members enable row level security;

create policy "public read family_groups" on public.family_groups for select using (true);
create policy "admin insert family_groups" on public.family_groups for insert with check (public.is_site_admin(site_id));
create policy "admin update family_groups" on public.family_groups for update using (public.is_site_admin(site_id)) with check (public.is_site_admin(site_id));
create policy "admin delete family_groups" on public.family_groups for delete using (public.is_site_admin(site_id));

create policy "public read family_members" on public.family_members for select using (true);
create policy "admin insert family_members" on public.family_members for insert with check (public.is_site_admin(site_id));
create policy "admin update family_members" on public.family_members for update using (public.is_site_admin(site_id)) with check (public.is_site_admin(site_id));
create policy "admin delete family_members" on public.family_members for delete using (public.is_site_admin(site_id));

-- ── Music + social links ─────────────────────────────────────────────────
create table public.music_tracks (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites(id) on delete cascade,
  title text not null default '',
  file_url text not null,
  file_path text,
  display_order integer not null default 0,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.music_settings
  add constraint music_settings_default_track_fk
  foreign key (default_track_id) references public.music_tracks(id) on delete set null;

create table public.social_links (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites(id) on delete cascade,
  platform text not null default '',
  url text not null default '',
  enabled boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.music_tracks enable row level security;
alter table public.social_links enable row level security;

create policy "public read enabled music_tracks" on public.music_tracks for select using (enabled = true);
create policy "admin read all music_tracks" on public.music_tracks for select using (public.is_site_admin(site_id));
create policy "admin insert music_tracks" on public.music_tracks for insert with check (public.is_site_admin(site_id));
create policy "admin update music_tracks" on public.music_tracks for update using (public.is_site_admin(site_id)) with check (public.is_site_admin(site_id));
create policy "admin delete music_tracks" on public.music_tracks for delete using (public.is_site_admin(site_id));

create policy "public read enabled social_links" on public.social_links for select using (enabled = true);
create policy "admin read all social_links" on public.social_links for select using (public.is_site_admin(site_id));
create policy "admin insert social_links" on public.social_links for insert with check (public.is_site_admin(site_id));
create policy "admin update social_links" on public.social_links for update using (public.is_site_admin(site_id)) with check (public.is_site_admin(site_id));
create policy "admin delete social_links" on public.social_links for delete using (public.is_site_admin(site_id));

-- ── RSVPs + blessings ────────────────────────────────────────────────────
create table public.rsvps (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites(id) on delete cascade,
  name text not null,
  phone text default '',
  guests text default '1',
  attending text not null default 'yes',
  message text default '',
  submitted_at timestamptz not null default now()
);
create table public.blessings (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites(id) on delete cascade,
  name text not null,
  message text not null,
  published boolean not null default true,
  submitted_at timestamptz not null default now()
);

alter table public.rsvps enable row level security;
alter table public.blessings enable row level security;

-- Anyone (including anonymous public visitors) can submit an RSVP for a
-- given site, but only that site's admins can read the responses back
-- (guest phone numbers are private).
create policy "public insert rsvps" on public.rsvps for insert with check (true);
create policy "admin read rsvps" on public.rsvps for select using (public.is_site_admin(site_id));
create policy "admin delete rsvps" on public.rsvps for delete using (public.is_site_admin(site_id));

-- Blessings are shown on the public wall once published; anyone can submit,
-- only that site's admins moderate.
create policy "public insert blessings" on public.blessings for insert with check (true);
create policy "public read published blessings" on public.blessings for select using (published = true);
create policy "admin read all blessings" on public.blessings for select using (public.is_site_admin(site_id));
create policy "admin update blessings" on public.blessings for update using (public.is_site_admin(site_id)) with check (public.is_site_admin(site_id));
create policy "admin delete blessings" on public.blessings for delete using (public.is_site_admin(site_id));

-- ── Storage buckets ──────────────────────────────────────────────────────
-- Files are uploaded under a `{site_id}/...` path within each bucket, so
-- storage policies only need "is this user an admin of *some* site"
-- (is_admin()) rather than a path-aware per-site check.
insert into storage.buckets (id, name, public) values
  ('hero', 'hero', true), ('couple', 'couple', true), ('gallery', 'gallery', true),
  ('events', 'events', true), ('family', 'family', true), ('venue', 'venue', true),
  ('qr-codes', 'qr-codes', true), ('music', 'music', true), ('branding', 'branding', true)
on conflict (id) do nothing;

do $$
declare b text;
begin
  foreach b in array array['hero','couple','gallery','events','family','venue','qr-codes','music','branding']
  loop
    execute format('create policy "admin read %1$s bucket" on storage.objects for select using (bucket_id = %1$L and public.is_admin())', b);
    execute format('create policy "admin write %1$s bucket" on storage.objects for insert with check (bucket_id = %1$L and public.is_admin())', b);
    execute format('create policy "admin update %1$s bucket" on storage.objects for update using (bucket_id = %1$L and public.is_admin())', b);
    execute format('create policy "admin delete %1$s bucket" on storage.objects for delete using (bucket_id = %1$L and public.is_admin())', b);
  end loop;
end $$;

-- ============================================================================
-- Done. Visit /admin on the deployed app pointed at this database, sign up,
-- and click "New Wedding Site" — no manual data entry into this database
-- is needed. No couple-specific data is seeded by this script.
-- ============================================================================
