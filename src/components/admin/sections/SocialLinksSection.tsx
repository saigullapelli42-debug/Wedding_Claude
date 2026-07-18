import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import type { Tables } from "@/lib/database.types";
import { ConfirmDelete } from "../shared/ConfirmDelete";
import { SectionHeader, EmptyState } from "../shared/Layout";

type SocialLink = Tables<"social_links">;

async function fetchLinks(): Promise<SocialLink[]> {
  const { data, error } = await supabase.from("social_links").select("*").order("display_order");
  if (error) throw error;
  return data;
}

function LinkRow({ link, onChanged }: { link: SocialLink; onChanged: () => void }) {
  const [platform, setPlatform] = useState(link.platform);
  const [url, setUrl] = useState(link.url);
  const [dirty, setDirty] = useState(false);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("social_links")
        .update({ platform, url })
        .eq("id", link.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Link saved");
      setDirty(false);
      onChanged();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to save"),
  });

  const enabledMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      const { error } = await supabase.from("social_links").update({ enabled }).eq("id", link.id);
      if (error) throw error;
    },
    onSuccess: onChanged,
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("social_links").delete().eq("id", link.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Link deleted");
      onChanged();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to delete"),
  });

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border p-3">
      <Input
        placeholder="Platform (Instagram)"
        className="w-40"
        value={platform}
        onChange={(e) => {
          setPlatform(e.target.value);
          setDirty(true);
        }}
      />
      <Input
        placeholder="https://..."
        className="flex-1 min-w-[200px]"
        value={url}
        onChange={(e) => {
          setUrl(e.target.value);
          setDirty(true);
        }}
      />
      <Button size="sm" disabled={!dirty} onClick={() => saveMutation.mutate()}>
        Save
      </Button>
      <Switch checked={link.enabled} onCheckedChange={(v) => enabledMutation.mutate(v)} />
      <ConfirmDelete
        itemLabel={`the ${link.platform || "link"}`}
        onConfirm={() => deleteMutation.mutate()}
      />
    </div>
  );
}

export function SocialLinksSection() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["social_links"], queryFn: fetchLinks });

  function refresh() {
    queryClient.invalidateQueries({ queryKey: ["social_links"] });
    queryClient.invalidateQueries({ queryKey: ["public", "social_links"] });
  }

  const addMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("social_links")
        .insert({ platform: "New Link", url: "https://", display_order: data?.length ?? 0 });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Link added");
      refresh();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to add link"),
  });

  if (isLoading || !data) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading…
      </div>
    );
  }

  return (
    <div>
      <SectionHeader
        title="Social Links"
        description="Instagram, YouTube, Facebook, WhatsApp, and more."
      />
      <Button
        size="sm"
        className="mb-4"
        onClick={() => addMutation.mutate()}
        disabled={addMutation.isPending}
      >
        <Plus className="h-4 w-4 mr-1" /> Add Link
      </Button>
      {data.length === 0 ? (
        <EmptyState>No social links added yet.</EmptyState>
      ) : (
        <div className="space-y-3 max-w-2xl">
          {data.map((link) => (
            <LinkRow key={link.id} link={link} onChanged={refresh} />
          ))}
        </div>
      )}
    </div>
  );
}
