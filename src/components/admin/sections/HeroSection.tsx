import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/lib/supabase";
import type { Tables, TablesUpdate } from "@/lib/database.types";
import { ImageUpload } from "../shared/ImageUpload";
import { SectionHeader, SaveBar } from "../shared/Layout";

type Hero = Tables<"hero">;

async function fetchHero(siteId: string): Promise<Hero> {
  const { data, error } = await supabase.from("hero").select("*").eq("site_id", siteId).single();
  if (error) throw error;
  return data;
}

export function HeroSection({ siteId }: { siteId: string }) {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["hero", siteId],
    queryFn: () => fetchHero(siteId),
  });
  const [form, setForm] = useState<Hero | null>(null);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (data && !form) setForm(data);
  }, [data]);

  const mutation = useMutation({
    mutationFn: async (update: TablesUpdate<"hero">) => {
      const { error } = await supabase.from("hero").update(update).eq("site_id", siteId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Hero section saved");
      setDirty(false);
      queryClient.invalidateQueries({ queryKey: ["hero", siteId] });
      queryClient.invalidateQueries({ queryKey: ["public", "hero", siteId] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to save"),
  });

  function update<K extends keyof Hero>(key: K, value: Hero[K]) {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
    setDirty(true);
  }

  function handleSave() {
    if (!form) return;
    const { id: _id, updated_at: _u, ...update } = form;
    mutation.mutate(update);
  }

  function handleCancel() {
    if (data) setForm(data);
    setDirty(false);
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
      <SectionHeader
        title="Hero Section"
        description="The first thing guests see when they open the site."
      />
      <div className="space-y-5 max-w-lg">
        <div className="flex items-center justify-between rounded-lg border p-3">
          <div>
            <p className="text-sm font-medium">Show Hero Section</p>
            <p className="text-xs text-muted-foreground">Turn the whole hero banner on or off.</p>
          </div>
          <Switch checked={form.visible} onCheckedChange={(v) => update("visible", v)} />
        </div>
        <div className="space-y-1.5">
          <Label>Hero Title</Label>
          <Input value={form.title} onChange={(e) => update("title", e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Hero Subtitle</Label>
          <Input value={form.subtitle} onChange={(e) => update("subtitle", e.target.value)} />
        </div>
        <ImageUpload
          bucket="hero"
          siteId={siteId}
          url={form.image_url}
          path={form.image_path}
          label="Hero Image (leave empty to use the site's default photo)"
          onChange={({ url, path }) => {
            update("image_url", url);
            update("image_path", path);
          }}
        />
      </div>
      <SaveBar
        onSave={handleSave}
        onCancel={handleCancel}
        saving={mutation.isPending}
        dirty={dirty}
      />
    </div>
  );
}
