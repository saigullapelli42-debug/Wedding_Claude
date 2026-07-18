import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Play, Plus, Upload } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/lib/supabase";
import type { Tables } from "@/lib/database.types";
import { uploadToBucket, deleteFromBucket } from "@/lib/storage";
import { ConfirmDelete } from "../shared/ConfirmDelete";
import { SectionHeader, EmptyState } from "../shared/Layout";

type Track = Tables<"music_tracks">;
type MusicSettings = Tables<"music_settings">;

async function fetchTracks(): Promise<Track[]> {
  const { data, error } = await supabase.from("music_tracks").select("*").order("display_order");
  if (error) throw error;
  return data;
}
async function fetchSettings(): Promise<MusicSettings> {
  const { data, error } = await supabase.from("music_settings").select("*").single();
  if (error) throw error;
  return data;
}

function TrackRow({ track, onChanged }: { track: Track; onChanged: () => void }) {
  const [title, setTitle] = useState(track.title);
  const [dirty, setDirty] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("music_tracks").update({ title }).eq("id", track.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Song renamed");
      setDirty(false);
      onChanged();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to save"),
  });

  const enabledMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      const { error } = await supabase.from("music_tracks").update({ enabled }).eq("id", track.id);
      if (error) throw error;
    },
    onSuccess: onChanged,
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await deleteFromBucket("music", track.file_path).catch(() => {});
      const { error } = await supabase.from("music_tracks").delete().eq("id", track.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Song deleted");
      onChanged();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to delete"),
  });

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border p-3">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => audioRef.current?.play()}
        aria-label={`Preview ${track.title}`}
      >
        <Play className="h-4 w-4" />
      </Button>
      <audio ref={audioRef} src={track.file_url} preload="none" />
      <Input
        value={title}
        onChange={(e) => {
          setTitle(e.target.value);
          setDirty(true);
        }}
        className="max-w-xs"
      />
      <Button size="sm" disabled={!dirty} onClick={() => saveMutation.mutate()}>
        Save
      </Button>
      <div className="flex items-center gap-2 ml-auto">
        <Switch checked={track.enabled} onCheckedChange={(v) => enabledMutation.mutate(v)} />
        <span className="text-xs text-muted-foreground">
          {track.enabled ? "Enabled" : "Disabled"}
        </span>
        <ConfirmDelete itemLabel={`"${track.title}"`} onConfirm={() => deleteMutation.mutate()} />
      </div>
    </div>
  );
}

export function MusicSection() {
  const queryClient = useQueryClient();
  const { data: tracks, isLoading: tracksLoading } = useQuery({
    queryKey: ["music_tracks"],
    queryFn: fetchTracks,
  });
  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ["music_settings"],
    queryFn: fetchSettings,
  });
  const [settingsForm, setSettingsForm] = useState<MusicSettings | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (settings && !settingsForm) setSettingsForm(settings);
  }, [settings]);

  function refresh() {
    queryClient.invalidateQueries({ queryKey: ["music_tracks"] });
    queryClient.invalidateQueries({ queryKey: ["music_settings"] });
    queryClient.invalidateQueries({ queryKey: ["public", "music"] });
  }

  const settingsMutation = useMutation({
    mutationFn: async (update: Partial<MusicSettings>) => {
      const { error } = await supabase.from("music_settings").update(update).eq("id", true);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Music settings saved");
      refresh();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to save"),
  });

  async function handleUpload(file: File) {
    setUploading(true);
    try {
      const { url, path } = await uploadToBucket("music", file);
      const { error } = await supabase.from("music_tracks").insert({
        title: file.name.replace(/\.[^.]+$/, ""),
        file_url: url,
        file_path: path,
        display_order: tracks?.length ?? 0,
      });
      if (error) throw error;
      toast.success("Song uploaded");
      refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  if (tracksLoading || settingsLoading || !tracks || !settingsForm) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading…
      </div>
    );
  }

  return (
    <div>
      <SectionHeader title="Music" description="Background music played on the site." />

      <div className="rounded-xl border p-5 mb-6 max-w-lg space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Enable Background Music</p>
            <p className="text-xs text-muted-foreground">
              Show the music toggle button on the site.
            </p>
          </div>
          <Switch
            checked={settingsForm.enabled}
            onCheckedChange={(v) => {
              setSettingsForm((p) => (p ? { ...p, enabled: v } : p));
              settingsMutation.mutate({ enabled: v });
            }}
          />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Autoplay</p>
            <p className="text-xs text-muted-foreground">
              Try to start music automatically (browsers may block this).
            </p>
          </div>
          <Switch
            checked={settingsForm.autoplay}
            onCheckedChange={(v) => {
              setSettingsForm((p) => (p ? { ...p, autoplay: v } : p));
              settingsMutation.mutate({ autoplay: v });
            }}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Default Song</Label>
          <Select
            value={settingsForm.default_track_id ?? undefined}
            onValueChange={(v) => {
              setSettingsForm((p) => (p ? { ...p, default_track_id: v } : p));
              settingsMutation.mutate({ default_track_id: v });
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Choose a default song" />
            </SelectTrigger>
            <SelectContent>
              {tracks.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleUpload(file);
          e.target.value = "";
        }}
      />
      <Button
        size="sm"
        className="mb-4"
        disabled={uploading}
        onClick={() => fileInputRef.current?.click()}
      >
        {uploading ? (
          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
        ) : (
          <Upload className="h-4 w-4 mr-1" />
        )}
        Upload Song
      </Button>

      {tracks.length === 0 ? (
        <EmptyState>No songs uploaded yet.</EmptyState>
      ) : (
        <div className="space-y-3">
          {tracks.map((t) => (
            <TrackRow key={t.id} track={t} onChanged={refresh} />
          ))}
        </div>
      )}
    </div>
  );
}
