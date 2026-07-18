import { useQuery } from "@tanstack/react-query";
import { supabase } from "./supabase";
import type { Tables } from "./database.types";

export function useSiteSettings() {
  return useQuery({
    queryKey: ["public", "site_settings"],
    queryFn: async (): Promise<Tables<"site_settings">> => {
      const { data, error } = await supabase.from("site_settings").select("*").single();
      if (error) throw error;
      return data;
    },
  });
}

export function useHero() {
  return useQuery({
    queryKey: ["public", "hero"],
    queryFn: async (): Promise<Tables<"hero">> => {
      const { data, error } = await supabase.from("hero").select("*").single();
      if (error) throw error;
      return data;
    },
  });
}

export function useCoupleMembers() {
  return useQuery({
    queryKey: ["public", "couple_members"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("couple_members")
        .select("*")
        .order("display_order");
      if (error) throw error;
      return data as Tables<"couple_members">[];
    },
  });
}

export function useTimeline() {
  return useQuery({
    queryKey: ["public", "timeline_items"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("timeline_items")
        .select("*")
        .eq("published", true)
        .order("display_order");
      if (error) throw error;
      return data as Tables<"timeline_items">[];
    },
  });
}

export function useGalleryCategories() {
  return useQuery({
    queryKey: ["public", "gallery_categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gallery_categories")
        .select("*")
        .order("display_order");
      if (error) throw error;
      return data as Tables<"gallery_categories">[];
    },
  });
}

export function useGalleryImages() {
  return useQuery({
    queryKey: ["public", "gallery_images"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gallery_images")
        .select("*")
        .eq("published", true)
        .order("display_order");
      if (error) throw error;
      return data as Tables<"gallery_images">[];
    },
  });
}

export function useEvents() {
  return useQuery({
    queryKey: ["public", "events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("published", true)
        .order("display_order");
      if (error) throw error;
      return data as Tables<"events">[];
    },
  });
}

export function useFamily() {
  return useQuery({
    queryKey: ["public", "family"],
    queryFn: async () => {
      const [groups, members] = await Promise.all([
        supabase.from("family_groups").select("*").order("side"),
        supabase.from("family_members").select("*").order("display_order"),
      ]);
      if (groups.error) throw groups.error;
      if (members.error) throw members.error;
      return {
        groups: groups.data as Tables<"family_groups">[],
        members: members.data as Tables<"family_members">[],
      };
    },
  });
}

export function useVenue() {
  return useQuery({
    queryKey: ["public", "venue"],
    queryFn: async (): Promise<Tables<"venue">> => {
      const { data, error } = await supabase.from("venue").select("*").single();
      if (error) throw error;
      return data;
    },
  });
}

export function useGiftSettings() {
  return useQuery({
    queryKey: ["public", "gift_settings"],
    queryFn: async (): Promise<Tables<"gift_settings">> => {
      const { data, error } = await supabase.from("gift_settings").select("*").single();
      if (error) throw error;
      return data;
    },
  });
}

export function useMusic() {
  return useQuery({
    queryKey: ["public", "music"],
    queryFn: async () => {
      const [tracks, settings] = await Promise.all([
        supabase.from("music_tracks").select("*").eq("enabled", true).order("display_order"),
        supabase.from("music_settings").select("*").single(),
      ]);
      if (tracks.error) throw tracks.error;
      if (settings.error) throw settings.error;
      return {
        tracks: tracks.data as Tables<"music_tracks">[],
        settings: settings.data as Tables<"music_settings">,
      };
    },
  });
}

export function useSocialLinks() {
  return useQuery({
    queryKey: ["public", "social_links"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("social_links")
        .select("*")
        .eq("enabled", true)
        .order("display_order");
      if (error) throw error;
      return data as Tables<"social_links">[];
    },
  });
}

export function useBlessings() {
  return useQuery({
    queryKey: ["public", "blessings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blessings")
        .select("*")
        .eq("published", true)
        .order("submitted_at", { ascending: false })
        .limit(12);
      if (error) throw error;
      return data as Tables<"blessings">[];
    },
  });
}
