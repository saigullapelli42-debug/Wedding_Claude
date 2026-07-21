import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabase";
import type { Tables, TablesUpdate } from "@/lib/database.types";
import { ImageUpload } from "../shared/ImageUpload";
import { SectionHeader, SaveBar } from "../shared/Layout";

type Venue = Tables<"venue">;

async function fetchVenue(siteId: string): Promise<Venue> {
  const { data, error } = await supabase.from("venue").select("*").eq("site_id", siteId).single();
  if (error) throw error;
  return data;
}

export function VenueSection({ siteId }: { siteId: string }) {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["venue", siteId],
    queryFn: () => fetchVenue(siteId),
  });
  const [form, setForm] = useState<Venue | null>(null);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (data && !form) setForm(data);
  }, [data]);

  const mutation = useMutation({
    mutationFn: async (update: TablesUpdate<"venue">) => {
      const { error } = await supabase.from("venue").update(update).eq("site_id", siteId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Venue saved");
      setDirty(false);
      queryClient.invalidateQueries({ queryKey: ["venue", siteId] });
      queryClient.invalidateQueries({ queryKey: ["public", "venue", siteId] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to save"),
  });

  function update<K extends keyof Venue>(key: K, value: Venue[K]) {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
    setDirty(true);
  }

  if (isLoading || !form) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading…
      </div>
    );
  }

  return (
    <div>
      <SectionHeader title="Venue" description="Main wedding venue details." />
      <div className="space-y-5 max-w-lg">
        <div className="space-y-1.5">
          <Label>Venue Name</Label>
          <Input value={form.name} onChange={(e) => update("name", e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Address</Label>
          <Textarea
            rows={2}
            value={form.address}
            onChange={(e) => update("address", e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Description</Label>
          <Textarea
            rows={3}
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Google Maps URL</Label>
          <Input value={form.map_url ?? ""} onChange={(e) => update("map_url", e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Google Maps Embed URL</Label>
          <Input
            value={form.map_embed_url ?? ""}
            onChange={(e) => update("map_embed_url", e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Directions URL</Label>
          <Input
            value={form.directions_url ?? ""}
            onChange={(e) => update("directions_url", e.target.value)}
          />
        </div>
        <ImageUpload
          bucket="venue"
          siteId={siteId}
          url={form.image_url}
          path={form.image_path}
          label="Venue Image"
          onChange={({ url, path }) => {
            update("image_url", url);
            update("image_path", path);
          }}
        />
      </div>
      <SaveBar
        onSave={() => {
          const { id: _id, updated_at: _u, ...update } = form;
          mutation.mutate(update);
        }}
        onCancel={() => {
          if (data) setForm(data);
          setDirty(false);
        }}
        saving={mutation.isPending}
        dirty={dirty}
      />
    </div>
  );
}
