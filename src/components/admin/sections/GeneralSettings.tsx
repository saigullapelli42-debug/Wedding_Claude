import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabase";
import type { Tables, TablesUpdate } from "@/lib/database.types";
import { SectionHeader, SaveBar } from "../shared/Layout";
import { ImageUpload } from "../shared/ImageUpload";

type SiteSettings = Tables<"site_settings">;

async function fetchSettings(siteId: string): Promise<SiteSettings> {
  const { data, error } = await supabase
    .from("site_settings")
    .select("*")
    .eq("site_id", siteId)
    .single();
  if (error) throw error;
  return data;
}

export function GeneralSettings({ siteId }: { siteId: string }) {
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ["site_settings", siteId],
    queryFn: () => fetchSettings(siteId),
  });
  const [form, setForm] = useState<SiteSettings | null>(null);
  const [dirty, setDirty] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (data && !form) setForm(data);
  }, [data]);

  const mutation = useMutation({
    mutationFn: async (update: TablesUpdate<"site_settings">) => {
      const { error } = await supabase.from("site_settings").update(update).eq("site_id", siteId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("General settings saved");
      setDirty(false);
      queryClient.invalidateQueries({ queryKey: ["site_settings", siteId] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to save"),
  });

  function update<K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
    setDirty(true);
  }

  function handleSave() {
    if (!form) return;
    if (!form.bride_name.trim() || !form.groom_name.trim()) {
      setValidationError("Bride name and groom name are required.");
      return;
    }
    setValidationError(null);
    const { id: _id, updated_at: _u, ...update } = form;
    mutation.mutate(update);
  }

  function handleCancel() {
    if (data) setForm(data);
    setDirty(false);
    setValidationError(null);
  }

  if (isLoading || !form) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading settings…
      </div>
    );
  }
  if (error) return <p className="text-destructive text-sm">Failed to load settings.</p>;

  return (
    <div>
      <SectionHeader
        title="General Settings"
        description="Core details shown across the whole website."
      />
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Bride Name</Label>
          <Input value={form.bride_name} onChange={(e) => update("bride_name", e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Groom Name</Label>
          <Input value={form.groom_name} onChange={(e) => update("groom_name", e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Wedding Title</Label>
          <Input
            value={form.wedding_title}
            onChange={(e) => update("wedding_title", e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Tagline</Label>
          <Input value={form.tagline} onChange={(e) => update("tagline", e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Wedding Date &amp; Time</Label>
          <Input
            type="datetime-local"
            value={form.wedding_date ? form.wedding_date.slice(0, 16) : ""}
            onChange={(e) =>
              update("wedding_date", e.target.value ? new Date(e.target.value).toISOString() : null)
            }
          />
        </div>
        <div className="space-y-1.5">
          <Label>Display Date (shown to guests)</Label>
          <Input
            value={form.wedding_date_label}
            onChange={(e) => update("wedding_date_label", e.target.value)}
            placeholder="15 December 2026"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Hashtag</Label>
          <Input value={form.hashtag} onChange={(e) => update("hashtag", e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>RSVP Deadline</Label>
          <Input
            value={form.rsvp_deadline}
            onChange={(e) => update("rsvp_deadline", e.target.value)}
            placeholder="15 November 2026"
          />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label>Welcome Message</Label>
          <Textarea
            rows={2}
            value={form.welcome_message}
            onChange={(e) => update("welcome_message", e.target.value)}
          />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label>Footer Text</Label>
          <Textarea
            rows={3}
            value={form.footer_text}
            onChange={(e) => update("footer_text", e.target.value)}
          />
        </div>
        <div className="sm:col-span-2">
          <ImageUpload
            bucket="branding"
            siteId={siteId}
            url={form.favicon_url}
            path={form.favicon_path}
            aspect="square"
            label="Browser Tab Icon (Favicon) — square image works best"
            onChange={({ url, path }) => {
              update("favicon_url", url);
              update("favicon_path", path);
            }}
          />
        </div>
      </div>
      {validationError && <p className="text-sm text-destructive mt-4">{validationError}</p>}
      <SaveBar
        onSave={handleSave}
        onCancel={handleCancel}
        saving={mutation.isPending}
        dirty={dirty}
      />
    </div>
  );
}
