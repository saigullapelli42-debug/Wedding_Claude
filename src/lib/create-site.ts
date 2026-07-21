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

/**
 * Creates a brand-new wedding site: a unique slug, the `sites` row, grants
 * the current user admin on it, then seeds the default content rows so the
 * public page and admin panel both work immediately (with placeholder text
 * the couple can edit right away).
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
      welcome_message: "Together with their families",
      footer_text: "Join us as we begin the next chapter of our lives.",
    }),
    supabase.from("hero").insert({
      site_id: siteId,
      title: `${groomName} & ${brideName}`,
      subtitle: "We're Getting Married",
    }),
    supabase.from("venue").insert({ site_id: siteId }),
    supabase.from("gift_settings").insert({ site_id: siteId, enabled: false }),
    supabase.from("music_settings").insert({ site_id: siteId, enabled: false }),
  ]);
  for (const r of [settings, hero, venue, gift, music]) {
    if (r.error) throw r.error;
  }

  const [brideMember, groomMember, brideFamily, groomFamily] = await Promise.all([
    supabase
      .from("couple_members")
      .insert({ site_id: siteId, side: "bride", name: brideName, display_order: 0 }),
    supabase
      .from("couple_members")
      .insert({ site_id: siteId, side: "groom", name: groomName, display_order: 1 }),
    supabase
      .from("family_groups")
      .insert({ site_id: siteId, side: "bride", title: "Bride's Family" }),
    supabase
      .from("family_groups")
      .insert({ site_id: siteId, side: "groom", title: "Groom's Family" }),
  ]);
  for (const r of [brideMember, groomMember, brideFamily, groomFamily]) {
    if (r.error) throw r.error;
  }

  return { slug };
}
