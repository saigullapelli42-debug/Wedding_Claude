import { useQuery } from "@tanstack/react-query";
import { supabase } from "./supabase";
import type { Tables } from "./database.types";

export function useSiteBySlug(slug: string) {
  return useQuery({
    queryKey: ["public", "site_by_slug", slug],
    queryFn: async (): Promise<Tables<"sites"> | null> => {
      const { data, error } = await supabase
        .from("sites")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });
}

export function useSiteSettings(siteId: string) {
  return useQuery({
    queryKey: ["public", "site_settings", siteId],
    queryFn: async (): Promise<Tables<"site_settings">> => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("*")
        .eq("site_id", siteId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!siteId,
  });
}

export function useHero(siteId: string) {
  return useQuery({
    queryKey: ["public", "hero", siteId],
    queryFn: async (): Promise<Tables<"hero">> => {
      const { data, error } = await supabase
        .from("hero")
        .select("*")
        .eq("site_id", siteId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!siteId,
  });
}

export function useCoupleMembers(siteId: string) {
  return useQuery({
    queryKey: ["public", "couple_members", siteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("couple_members")
        .select("*")
        .eq("site_id", siteId)
        .order("display_order");
      if (error) throw error;
      return data as Tables<"couple_members">[];
    },
    enabled: !!siteId,
  });
}

export function useTimeline(siteId: string) {
  return useQuery({
    queryKey: ["public", "timeline_items", siteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("timeline_items")
        .select("*")
        .eq("site_id", siteId)
        .eq("published", true)
        .order("display_order");
      if (error) throw error;
      return data as Tables<"timeline_items">[];
    },
    enabled: !!siteId,
  });
}

export function useGalleryCategories(siteId: string) {
  return useQuery({
    queryKey: ["public", "gallery_categories", siteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gallery_categories")
        .select("*")
        .eq("site_id", siteId)
        .order("display_order");
      if (error) throw error;
      return data as Tables<"gallery_categories">[];
    },
    enabled: !!siteId,
  });
}

export function useGalleryImages(siteId: string) {
  return useQuery({
    queryKey: ["public", "gallery_images", siteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gallery_images")
        .select("*")
        .eq("site_id", siteId)
        .eq("published", true)
        .order("display_order");
      if (error) throw error;
      return data as Tables<"gallery_images">[];
    },
    enabled: !!siteId,
  });
}

export function useEvents(siteId: string) {
  return useQuery({
    queryKey: ["public", "events", siteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("site_id", siteId)
        .eq("published", true)
        .order("display_order");
      if (error) throw error;
      return data as Tables<"events">[];
    },
    enabled: !!siteId,
  });
}

export function useFamily(siteId: string) {
  return useQuery({
    queryKey: ["public", "family", siteId],
    queryFn: async () => {
      const [groups, members] = await Promise.all([
        supabase.from("family_groups").select("*").eq("site_id", siteId).order("side"),
        supabase.from("family_members").select("*").eq("site_id", siteId).order("display_order"),
      ]);
      if (groups.error) throw groups.error;
      if (members.error) throw members.error;
      return {
        groups: groups.data as Tables<"family_groups">[],
        members: members.data as Tables<"family_members">[],
      };
    },
    enabled: !!siteId,
  });
}

export function useVenue(siteId: string) {
  return useQuery({
    queryKey: ["public", "venue", siteId],
    queryFn: async (): Promise<Tables<"venue">> => {
      const { data, error } = await supabase
        .from("venue")
        .select("*")
        .eq("site_id", siteId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!siteId,
  });
}

export function useGiftSettings(siteId: string) {
  return useQuery({
    queryKey: ["public", "gift_settings", siteId],
    queryFn: async (): Promise<Tables<"gift_settings">> => {
      const { data, error } = await supabase
        .from("gift_settings")
        .select("*")
        .eq("site_id", siteId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!siteId,
  });
}

export function useMusic(siteId: string) {
  return useQuery({
    queryKey: ["public", "music", siteId],
    queryFn: async () => {
      const [tracks, settings] = await Promise.all([
        supabase
          .from("music_tracks")
          .select("*")
          .eq("site_id", siteId)
          .eq("enabled", true)
          .order("display_order"),
        supabase.from("music_settings").select("*").eq("site_id", siteId).single(),
      ]);
      if (tracks.error) throw tracks.error;
      if (settings.error) throw settings.error;
      return {
        tracks: tracks.data as Tables<"music_tracks">[],
        settings: settings.data as Tables<"music_settings">,
      };
    },
    enabled: !!siteId,
  });
}

export function useSocialLinks(siteId: string) {
  return useQuery({
    queryKey: ["public", "social_links", siteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("social_links")
        .select("*")
        .eq("site_id", siteId)
        .eq("enabled", true)
        .order("display_order");
      if (error) throw error;
      return data as Tables<"social_links">[];
    },
    enabled: !!siteId,
  });
}

export function useBlessings(siteId: string) {
  return useQuery({
    queryKey: ["public", "blessings", siteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blessings")
        .select("*")
        .eq("site_id", siteId)
        .eq("published", true)
        .order("submitted_at", { ascending: false })
        .limit(12);
      if (error) throw error;
      return data as Tables<"blessings">[];
    },
    enabled: !!siteId,
  });
}
