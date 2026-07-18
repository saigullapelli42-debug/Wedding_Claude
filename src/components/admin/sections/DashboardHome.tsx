import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { SectionHeader } from "../shared/Layout";

async function fetchCounts() {
  const [gallery, events, timeline, family, rsvps, blessings] = await Promise.all([
    supabase.from("gallery_images").select("id", { count: "exact", head: true }),
    supabase.from("events").select("id", { count: "exact", head: true }),
    supabase.from("timeline_items").select("id", { count: "exact", head: true }),
    supabase.from("family_members").select("id", { count: "exact", head: true }),
    supabase.from("rsvps").select("id", { count: "exact", head: true }),
    supabase.from("blessings").select("id", { count: "exact", head: true }),
  ]);
  return {
    gallery: gallery.count ?? 0,
    events: events.count ?? 0,
    timeline: timeline.count ?? 0,
    family: family.count ?? 0,
    rsvps: rsvps.count ?? 0,
    blessings: blessings.count ?? 0,
  };
}

export function DashboardHome({ onNavigate }: { onNavigate: (section: string) => void }) {
  const { data, isLoading } = useQuery({
    queryKey: ["admin_dashboard_counts"],
    queryFn: fetchCounts,
  });

  const cards = [
    { key: "gallery", label: "Gallery Photos", value: data?.gallery },
    { key: "events", label: "Wedding Events", value: data?.events },
    { key: "story", label: "Timeline Moments", value: data?.timeline },
    { key: "family", label: "Family Members", value: data?.family },
    { key: "website", label: "RSVPs Received", value: data?.rsvps },
    { key: "website", label: "Blessings Received", value: data?.blessings },
  ];

  return (
    <div>
      <SectionHeader title="Dashboard" description="Overview of your wedding website content." />
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((c, i) => (
            <button
              key={i}
              onClick={() => onNavigate(c.key)}
              className="rounded-xl border p-5 text-left transition hover:border-primary hover:shadow-sm"
            >
              <p className="text-3xl font-serif">{c.value}</p>
              <p className="text-sm text-muted-foreground mt-1">{c.label}</p>
            </button>
          ))}
        </div>
      )}
      <p className="text-sm text-muted-foreground mt-8">
        Use the sidebar to edit every part of your website. Changes save straight to your database
        and appear on the live site immediately for all visitors.
      </p>
    </div>
  );
}
