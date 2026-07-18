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

type EventRow = Tables<"events">;

async function fetchEvents(): Promise<EventRow[]> {
  const { data, error } = await supabase.from("events").select("*").order("display_order");
  if (error) throw error;
  return data;
}

const BLANK: TablesInsert<"events"> = {
  name: "New Event",
  event_date: "",
  start_time: "",
  end_time: "",
  venue: "",
  address: "",
  description: "",
  icon: "🎉",
  map_url: "",
  directions_url: "",
  display_order: 0,
  published: true,
};

function EventCard({
  event,
  isFirst,
  isLast,
  onMove,
  onChanged,
}: {
  event: EventRow;
  isFirst: boolean;
  isLast: boolean;
  onMove: (dir: "up" | "down") => void;
  onChanged: () => void;
}) {
  const [form, setForm] = useState(event);
  const [dirty, setDirty] = useState(false);

  function set<K extends keyof EventRow>(key: K, value: EventRow[K]) {
    setForm((p) => ({ ...p, [key]: value }));
    setDirty(true);
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { id: _id, created_at: _c, updated_at: _u, ...update } = form;
      const { error } = await supabase.from("events").update(update).eq("id", form.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Event saved");
      setDirty(false);
      onChanged();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to save"),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await deleteFromBucket("events", form.image_path).catch(() => {});
      const { error } = await supabase.from("events").delete().eq("id", form.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Event deleted");
      onChanged();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to delete"),
  });

  return (
    <div className="rounded-xl border p-5 space-y-4">
      <div className="flex items-start gap-3">
        <ReorderButtons
          disabledUp={isFirst}
          disabledDown={isLast}
          onUp={() => onMove("up")}
          onDown={() => onMove("down")}
        />
        <div className="flex-1 grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Event Name</Label>
            <Input value={form.name} onChange={(e) => set("name", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Icon</Label>
            <Input value={form.icon ?? ""} onChange={(e) => set("icon", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Date</Label>
            <Input
              value={form.event_date}
              onChange={(e) => set("event_date", e.target.value)}
              placeholder="15 Dec 2026"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Start Time</Label>
            <Input
              value={form.start_time}
              onChange={(e) => set("start_time", e.target.value)}
              placeholder="06:30 PM"
            />
          </div>
          <div className="space-y-1.5">
            <Label>End Time</Label>
            <Input value={form.end_time ?? ""} onChange={(e) => set("end_time", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Venue</Label>
            <Input value={form.venue} onChange={(e) => set("venue", e.target.value)} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Address</Label>
            <Input value={form.address ?? ""} onChange={(e) => set("address", e.target.value)} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Description</Label>
            <Textarea
              rows={2}
              value={form.description ?? ""}
              onChange={(e) => set("description", e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Google Maps URL</Label>
            <Input value={form.map_url ?? ""} onChange={(e) => set("map_url", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Directions URL</Label>
            <Input
              value={form.directions_url ?? ""}
              onChange={(e) => set("directions_url", e.target.value)}
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Switch checked={form.published} onCheckedChange={(v) => set("published", v)} />
          <ConfirmDelete
            itemLabel={`the "${form.name}" event`}
            onConfirm={() => deleteMutation.mutate()}
          />
        </div>
      </div>
      <ImageUpload
        bucket="events"
        url={form.image_url}
        path={form.image_path}
        label="Event Image"
        onChange={({ url, path }) => {
          set("image_url", url);
          set("image_path", path);
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
            setForm(event);
            setDirty(false);
          }}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}

export function EventsSection() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["events"], queryFn: fetchEvents });

  function refresh() {
    queryClient.invalidateQueries({ queryKey: ["events"] });
    queryClient.invalidateQueries({ queryKey: ["public", "events"] });
  }

  const addMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("events")
        .insert({ ...BLANK, display_order: data?.length ?? 0 });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Event added");
      refresh();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to add event"),
  });

  async function move(event: EventRow, dir: "up" | "down") {
    if (!data) return;
    const idx = data.findIndex((d) => d.id === event.id);
    const swapIdx = dir === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= data.length) return;
    const other = data[swapIdx];
    await Promise.all([
      supabase.from("events").update({ display_order: other.display_order }).eq("id", event.id),
      supabase.from("events").update({ display_order: event.display_order }).eq("id", other.id),
    ]);
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
      <SectionHeader title="Wedding Events" description="All ceremony and celebration events." />
      <Button
        size="sm"
        className="mb-4"
        onClick={() => addMutation.mutate()}
        disabled={addMutation.isPending}
      >
        <Plus className="h-4 w-4 mr-1" /> Add Event
      </Button>
      {data.length === 0 ? (
        <EmptyState>No events yet. Add your first one above.</EmptyState>
      ) : (
        <div className="space-y-4">
          {data.map((event, i) => (
            <EventCard
              key={event.id}
              event={event}
              isFirst={i === 0}
              isLast={i === data.length - 1}
              onMove={(dir) => move(event, dir)}
              onChanged={refresh}
            />
          ))}
        </div>
      )}
    </div>
  );
}
