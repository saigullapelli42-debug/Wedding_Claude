import { supabase } from "./supabase";
import { slugify } from "./slugify";

/** Finds a free slug, appending -2, -3, etc. if the base slug is taken. */
async function findAvailableSlug(base: string): Promise<string> {
  let candidate = base || "our-wedding";
  let suffix = 2;
  // 20 attempts is generous — collisions this deep would be extremely unusual.
  for (let i = 0; i < 20; i++) {
    const { data, error } = await supabase
      .from("sites")
      .select("id")
      .eq("slug", candidate)
      .maybeSingle();
    if (error) throw error;
    if (!data) return candidate;
    candidate = `${base}-${suffix}`;
    suffix++;
  }
  return `${base}-${Date.now()}`;
}

// Free-to-use stock photos (Unsplash) used purely as starter placeholders —
// every one of these is meant to be replaced by the couple's own photos via
// the admin panel's upload buttons.
const STOCK = {
  hero: "https://images.unsplash.com/photo-1519741497674-611481863552?w=1600&q=80&auto=format&fit=crop",
  venue:
    "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=1200&q=80&auto=format&fit=crop",
  timeline1:
    "https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=1200&q=80&auto=format&fit=crop",
  timeline2:
    "https://images.unsplash.com/photo-1502635385003-ee1e6a1a742d?w=1200&q=80&auto=format&fit=crop",
  timeline3:
    "https://images.unsplash.com/photo-1465495976277-4387d4b0e4a6?w=1200&q=80&auto=format&fit=crop",
  timeline4:
    "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=1200&q=80&auto=format&fit=crop",
  eventHaldi:
    "https://images.unsplash.com/photo-1600891964092-4316c288032e?w=800&q=80&auto=format&fit=crop",
  eventMehendi:
    "https://images.unsplash.com/photo-1610123361437-de2b3d4b3d1b?w=800&q=80&auto=format&fit=crop",
  eventSangeet:
    "https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80&auto=format&fit=crop",
  eventWedding:
    "https://images.unsplash.com/photo-1465495976277-4387d4b0e4a6?w=800&q=80&auto=format&fit=crop",
  eventReception:
    "https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=800&q=80&auto=format&fit=crop",
  gallery: [
    "https://images.unsplash.com/photo-1519741497674-611481863552?w=900&q=80&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1591604466107-ec97de577aff?w=900&q=80&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=900&q=80&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=900&q=80&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1465495976277-4387d4b0e4a6?w=900&q=80&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1502635385003-ee1e6a1a742d?w=900&q=80&auto=format&fit=crop",
  ],
  bridePortrait:
    "https://images.unsplash.com/photo-1525258946800-98cfd641d0de?w=600&q=80&auto=format&fit=crop",
  groomPortrait:
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&q=80&auto=format&fit=crop",
  father:
    "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&q=80&auto=format&fit=crop",
  mother:
    "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&q=80&auto=format&fit=crop",
  sibling:
    "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=400&q=80&auto=format&fit=crop",
};

/**
 * Creates a brand-new wedding site: a unique slug, the `sites` row, grants
 * the current user admin on it, then seeds a full replica of sample content —
 * a hero photo, couple portraits, sample family members, sample events, a
 * sample timeline, a starter gallery, a working placeholder gift/UPI QR code,
 * and placeholder social links — so the site looks and works exactly like
 * the Sai & Priya example from the very first click. The couple then just
 * replaces each placeholder with their own photos and details through the
 * admin panel.
 *
 * Note: background music is intentionally left empty — bundling real songs
 * as defaults would require licensing rights we don't have. The couple
 * uploads their own tracks in the Music section.
 */
export async function createNewSite(
  brideName: string,
  groomName: string,
): Promise<{ slug: string }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("You must be signed in to create a site.");

  const baseSlug = slugify(`${groomName}-${brideName}`) || "our-wedding";
  const slug = await findAvailableSlug(baseSlug);

  const { data: site, error: siteError } = await supabase
    .from("sites")
    .insert({ slug, bride_name: brideName, groom_name: groomName, owner_user_id: user.id })
    .select()
    .single();
  if (siteError) throw siteError;

  const { error: roleError } = await supabase
    .from("user_roles")
    .insert({ user_id: user.id, role: "admin", site_id: site.id });
  if (roleError) throw roleError;

  const siteId = site.id;

  const [settings, hero, venue, gift, music] = await Promise.all([
    supabase.from("site_settings").insert({
      site_id: siteId,
      bride_name: brideName,
      groom_name: groomName,
      wedding_title: `${groomName} & ${brideName}`,
      tagline: "We're Getting Married",
      wedding_date_label: "Date to be announced",
      hashtag: `#${slugify(`${groomName}${brideName}`).replace(/-/g, "")}`,
      rsvp_deadline: "Date to be announced",
      welcome_message: "Together with their families",
      footer_text: "Join us as we begin the next chapter of our lives.",
    }),
    supabase.from("hero").insert({
      site_id: siteId,
      title: `${groomName} & ${brideName}`,
      subtitle: "We're Getting Married",
      image_url: STOCK.hero,
    }),
    supabase.from("venue").insert({
      site_id: siteId,
      name: "Venue Name",
      address: "Venue address goes here",
      description: "A short description of the venue.",
      image_url: STOCK.venue,
    }),
    supabase.from("gift_settings").insert({
      site_id: siteId,
      enabled: true,
      upi_id: "yourname@upi",
      account_name: `${groomName} & ${brideName}`,
      bank_name: "Your Bank Name",
    }),
    supabase.from("music_settings").insert({ site_id: siteId, enabled: false }),
  ]);
  for (const r of [settings, hero, venue, gift, music]) {
    if (r.error) throw r.error;
  }

  const [brideMember, groomMember, brideFamily, groomFamily] = await Promise.all([
    supabase.from("couple_members").insert({
      site_id: siteId,
      side: "bride",
      name: brideName,
      description: "A short description about the bride.",
      image_url: STOCK.bridePortrait,
      display_order: 0,
    }),
    supabase.from("couple_members").insert({
      site_id: siteId,
      side: "groom",
      name: groomName,
      description: "A short description about the groom.",
      image_url: STOCK.groomPortrait,
      display_order: 1,
    }),
    supabase
      .from("family_groups")
      .insert({ site_id: siteId, side: "bride", title: "Bride's Family" })
      .select()
      .single(),
    supabase
      .from("family_groups")
      .insert({ site_id: siteId, side: "groom", title: "Groom's Family" })
      .select()
      .single(),
  ]);
  for (const r of [brideMember, groomMember, brideFamily, groomFamily]) {
    if (r.error) throw r.error;
  }

  const brideFamilyId = brideFamily.data!.id;
  const groomFamilyId = groomFamily.data!.id;

  const { error: familyMembersError } = await supabase.from("family_members").insert([
    {
      site_id: siteId,
      family_group_id: brideFamilyId,
      name: "Father's Name",
      relationship: "Father",
      image_url: STOCK.father,
      display_order: 0,
    },
    {
      site_id: siteId,
      family_group_id: brideFamilyId,
      name: "Mother's Name",
      relationship: "Mother",
      image_url: STOCK.mother,
      display_order: 1,
    },
    {
      site_id: siteId,
      family_group_id: brideFamilyId,
      name: "Sibling's Name",
      relationship: "Sibling",
      image_url: STOCK.sibling,
      display_order: 2,
    },
    {
      site_id: siteId,
      family_group_id: groomFamilyId,
      name: "Father's Name",
      relationship: "Father",
      image_url: STOCK.father,
      display_order: 0,
    },
    {
      site_id: siteId,
      family_group_id: groomFamilyId,
      name: "Mother's Name",
      relationship: "Mother",
      image_url: STOCK.mother,
      display_order: 1,
    },
    {
      site_id: siteId,
      family_group_id: groomFamilyId,
      name: "Sibling's Name",
      relationship: "Sibling",
      image_url: STOCK.sibling,
      display_order: 2,
    },
  ]);
  if (familyMembersError) throw familyMembersError;

  const { error: timelineError } = await supabase.from("timeline_items").insert([
    {
      site_id: siteId,
      date_label: "How We Met",
      title: "The First Meeting",
      icon: "💕",
      description: "Replace this with the story of how you first met.",
      image_url: STOCK.timeline1,
      display_order: 0,
    },
    {
      site_id: siteId,
      date_label: "Our First Trip",
      title: "An Adventure Together",
      icon: "📸",
      description: "Replace this with a favorite memory from your time together.",
      image_url: STOCK.timeline2,
      display_order: 1,
    },
    {
      site_id: siteId,
      date_label: "The Proposal",
      title: "Saying Yes",
      icon: "💍",
      description: "Replace this with the story of the proposal.",
      image_url: STOCK.timeline3,
      display_order: 2,
    },
    {
      site_id: siteId,
      date_label: "The Wedding",
      title: "Forever Together",
      icon: "❤️",
      description: "Replace this with what this day means to you both.",
      image_url: STOCK.timeline4,
      display_order: 3,
    },
  ]);
  if (timelineError) throw timelineError;

  const { error: eventsError } = await supabase.from("events").insert([
    {
      site_id: siteId,
      name: "Haldi",
      event_date: "Date TBD",
      start_time: "10:00 AM",
      venue: "Venue name",
      icon: "🌼",
      image_url: STOCK.eventHaldi,
      display_order: 0,
    },
    {
      site_id: siteId,
      name: "Mehendi",
      event_date: "Date TBD",
      start_time: "04:00 PM",
      venue: "Venue name",
      icon: "🌿",
      image_url: STOCK.eventMehendi,
      display_order: 1,
    },
    {
      site_id: siteId,
      name: "Sangeet",
      event_date: "Date TBD",
      start_time: "07:00 PM",
      venue: "Venue name",
      icon: "🎶",
      image_url: STOCK.eventSangeet,
      display_order: 2,
    },
    {
      site_id: siteId,
      name: "Wedding Ceremony",
      event_date: "Date TBD",
      start_time: "06:30 PM",
      venue: "Venue name",
      icon: "💍",
      image_url: STOCK.eventWedding,
      display_order: 3,
    },
    {
      site_id: siteId,
      name: "Reception",
      event_date: "Date TBD",
      start_time: "07:30 PM",
      venue: "Venue name",
      icon: "🥂",
      image_url: STOCK.eventReception,
      display_order: 4,
    },
  ]);
  if (eventsError) throw eventsError;

  const { data: category, error: categoryError } = await supabase
    .from("gallery_categories")
    .insert({ site_id: siteId, name: "Photos", display_order: 0 })
    .select()
    .single();
  if (categoryError) throw categoryError;

  const { error: galleryError } = await supabase.from("gallery_images").insert(
    STOCK.gallery.map((url, i) => ({
      site_id: siteId,
      category_id: category.id,
      image_url: url,
      alt_text: "Sample photo — replace with your own",
      title: "",
      display_order: i,
    })),
  );
  if (galleryError) throw galleryError;

  const { error: socialError } = await supabase.from("social_links").insert([
    {
      site_id: siteId,
      platform: "Instagram",
      url: "https://instagram.com/",
      enabled: false,
      display_order: 0,
    },
    {
      site_id: siteId,
      platform: "YouTube",
      url: "https://youtube.com/",
      enabled: false,
      display_order: 1,
    },
    {
      site_id: siteId,
      platform: "Facebook",
      url: "https://facebook.com/",
      enabled: false,
      display_order: 2,
    },
    {
      site_id: siteId,
      platform: "WhatsApp",
      url: "https://wa.me/",
      enabled: false,
      display_order: 3,
    },
  ]);
  if (socialError) throw socialError;

  return { slug };
}
