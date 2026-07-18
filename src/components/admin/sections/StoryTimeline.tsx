import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import type { Tables, TablesInsert } from "@/lib/database.types";
import { ImageUpload } from "../shared/ImageUpload";
import { ConfirmDelete } from "../shared/ConfirmDelete";
import { ReorderButtons, SectionHeader, EmptyState } from "../shared/Layout";
import { deleteFromBucket } from "@/lib/storage";

type TimelineItem = Tables<"timeline_items">;

async function fetchTimeline(): Promise<TimelineItem[]> {
  const { data, error } = await supabase.from("timeline_items").select("*").order("display_order");
  if (error) throw error;
  return data;
}

const BLANK: TablesInsert<"timeline_items"> = {
  date_label: "",
  title: "",
  description: "",
  icon: "💕",
  image_url: null,
  display_order: 0,
  published: true,
};

function TimelineItemCard({
  item,
  isFirst,
  isLast,
  onMove,
  onChanged,
}: {
  item: TimelineItem;
  isFirst: boolean;
  isLast: boolean;
  onMove: (dir: "up" | "down") => void;
  onChanged: () => void;
}) {
  const [form, setForm] = useState(item);
  const [dirty, setDirty] = useState(false);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("timeline_items")
        .update({
          date_label: form.date_label,
          title: form.title,
          description: form.description,
          icon: form.icon,
          image_url: form.image_url,
          image_path: form.image_path,
          published: form.published,
        })
        .eq("id", form.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Timeline item saved");
      setDirty(false);
      onChanged();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to save"),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await deleteFromBucket("gallery", form.image_path).catch(() => {});
      const { error } = await supabase.from("timeline_items").delete().eq("id", form.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Timeline item deleted");
      onChanged();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to delete"),
  });

  return (
    <div className="rounded-xl border p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <ReorderButtons
          disabledUp={isFirst}
          disabledDown={isLast}
          onUp={() => onMove("up")}
          onDown={() => onMove("down")}
        />
        <div className="flex-1 grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Date</Label>
            <Input
              value={form.date_label}
              onChange={(e) => {
                setForm((p) => ({ ...p, date_label: e.target.value }));
                setDirty(true);
              }}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Icon (emoji)</Label>
            <Input
              value={form.icon ?? ""}
              onChange={(e) => {
                setForm((p) => ({ ...p, icon: e.target.value }));
                setDirty(true);
              }}
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Title</Label>
            <Input
              value={form.title}
              onChange={(e) => {
                setForm((p) => ({ ...p, title: e.target.value }));
                setDirty(true);
              }}
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Description</Label>
            <Textarea
              rows={3}
              value={form.description}
              onChange={(e) => {
                setForm((p) => ({ ...p, description: e.target.value }));
                setDirty(true);
              }}
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            checked={form.published}
            onCheckedChange={(v) => {
              setForm((p) => ({ ...p, published: v }));
              setDirty(true);
            }}
          />
          <ConfirmDelete itemLabel="this timeline item" onConfirm={() => deleteMutation.mutate()} />
        </div>
      </div>
      <ImageUpload
        bucket="gallery"
        url={form.image_url}
        path={form.image_path}
        label="Photo"
        onChange={({ url, path }) => {
          setForm((p) => ({ ...p, image_url: url, image_path: path }));
          setDirty(true);
        }}
      />
      <div className="flex items-center gap-3">
        <Button
          size="sm"
          disabled={!dirty || saveMutation.isPending}
          onClick={() => saveMutation.mutate()}
        >
          {saveMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Save
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={!dirty}
          onClick={() => {
            setForm(item);
            setDirty(false);
          }}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}

export function StoryTimeline() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["timeline_items"], queryFn: fetchTimeline });

  function refresh() {
    queryClient.invalidateQueries({ queryKey: ["timeline_items"] });
    queryClient.invalidateQueries({ queryKey: ["public", "timeline_items"] });
  }

  const addMutation = useMutation({
    mutationFn: async () => {
      const nextOrder = data?.length ?? 0;
      const { error } = await supabase
        .from("timeline_items")
        .insert({ ...BLANK, title: "New Moment", display_order: nextOrder });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Timeline item added");
      refresh();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to add item"),
  });

  async function move(item: TimelineItem, dir: "up" | "down") {
    if (!data) return;
    const idx = data.findIndex((d) => d.id === item.id);
    const swapIdx = dir === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= data.length) return;
    const other = data[swapIdx];
    const { error: e1 } = await supabase
      .from("timeline_items")
      .update({ display_order: other.display_order })
      .eq("id", item.id);
    const { error: e2 } = await supabase
      .from("timeline_items")
      .update({ display_order: item.display_order })
      .eq("id", other.id);
    if (e1 || e2) {
      toast.error("Failed to reorder");
      return;
    }
    refresh();
  }

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
        title="Our Story / Timeline"
        description="The love-story timeline on the site."
      />
      <Button
        size="sm"
        className="mb-4"
        onClick={() => addMutation.mutate()}
        disabled={addMutation.isPending}
      >
        <Plus className="h-4 w-4 mr-1" /> Add Timeline Item
      </Button>
      {data.length === 0 ? (
        <EmptyState>No timeline items yet. Add your first one above.</EmptyState>
      ) : (
        <div className="space-y-4">
          {data.map((item, i) => (
            <TimelineItemCard
              key={item.id}
              item={item}
              isFirst={i === 0}
              isLast={i === data.length - 1}
              onMove={(dir) => move(item, dir)}
              onChanged={refresh}
            />
          ))}
        </div>
      )}
    </div>
  );
}
