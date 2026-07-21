import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, MessageCircle } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import type { Tables } from "@/lib/database.types";
import { ConfirmDelete } from "../shared/ConfirmDelete";
import { SectionHeader, EmptyState } from "../shared/Layout";
import { buildRsvpSummaryMessage, buildWhatsappSendUrl, daysUntil } from "@/lib/whatsapp";

type Rsvp = Tables<"rsvps">;
type Blessing = Tables<"blessings">;
type SiteSettings = Tables<"site_settings">;

async function fetchSiteSettings(siteId: string): Promise<SiteSettings> {
  const { data, error } = await supabase
    .from("site_settings")
    .select("*")
    .eq("site_id", siteId)
    .single();
  if (error) throw error;
  return data;
}

async function fetchRsvps(siteId: string): Promise<Rsvp[]> {
  const { data, error } = await supabase
    .from("rsvps")
    .select("*")
    .eq("site_id", siteId)
    .order("submitted_at", { ascending: false });
  if (error) throw error;
  return data;
}
async function fetchBlessings(siteId: string): Promise<Blessing[]> {
  const { data, error } = await supabase
    .from("blessings")
    .select("*")
    .eq("site_id", siteId)
    .order("submitted_at", { ascending: false });
  if (error) throw error;
  return data;
}

export function WebsiteSettingsSection({ siteId }: { siteId: string }) {
  const queryClient = useQueryClient();
  const { data: rsvps, isLoading: rsvpsLoading } = useQuery({
    queryKey: ["admin_rsvps", siteId],
    queryFn: () => fetchRsvps(siteId),
  });
  const { data: blessings, isLoading: blessingsLoading } = useQuery({
    queryKey: ["admin_blessings", siteId],
    queryFn: () => fetchBlessings(siteId),
  });
  const { data: settings } = useQuery({
    queryKey: ["site_settings", siteId],
    queryFn: () => fetchSiteSettings(siteId),
  });

  const [managerName, setManagerName] = useState("");
  const [managerWhatsapp, setManagerWhatsapp] = useState("");
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (settings && !dirty) {
      setManagerName(settings.event_manager_name);
      setManagerWhatsapp(settings.event_manager_whatsapp);
    }
  }, [settings]);

  const saveManagerMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("site_settings")
        .update({ event_manager_name: managerName, event_manager_whatsapp: managerWhatsapp })
        .eq("site_id", siteId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Event manager contact saved");
      setDirty(false);
      queryClient.invalidateQueries({ queryKey: ["site_settings", siteId] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to save"),
  });

  const daysLeft = settings ? daysUntil(settings.wedding_date) : null;
  const showReminder = daysLeft !== null && daysLeft <= 10 && daysLeft >= 0;

  function sendRsvpSummary() {
    if (!settings || !rsvps) return;
    if (!settings.event_manager_whatsapp.trim()) {
      toast.error("Add the event manager's WhatsApp number first");
      return;
    }
    const message = buildRsvpSummaryMessage({
      groomName: settings.groom_name,
      brideName: settings.bride_name,
      weddingDateLabel: settings.wedding_date_label,
      rsvps,
    });
    const url = buildWhatsappSendUrl(settings.event_manager_whatsapp, message);
    if (!url) {
      toast.error("That WhatsApp number doesn't look valid");
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function refresh() {
    queryClient.invalidateQueries({ queryKey: ["admin_rsvps", siteId] });
    queryClient.invalidateQueries({ queryKey: ["admin_blessings", siteId] });
    queryClient.invalidateQueries({ queryKey: ["public", "blessings", siteId] });
  }

  const deleteRsvp = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("rsvps").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("RSVP removed");
      refresh();
    },
  });

  const publishBlessing = useMutation({
    mutationFn: async ({ id, published }: { id: string; published: boolean }) => {
      const { error } = await supabase.from("blessings").update({ published }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: refresh,
  });

  const deleteBlessing = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("blessings").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Message removed");
      refresh();
    },
  });

  return (
    <div>
      <SectionHeader
        title="Website Settings"
        description="Guest RSVPs and blessing-wall messages submitted through the public site."
      />

      {showReminder && (
        <div className="mb-6 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-medium">
            {daysLeft === 0
              ? "The wedding is today!"
              : `Only ${daysLeft} day${daysLeft === 1 ? "" : "s"} until the wedding.`}
          </p>
          <p className="mt-1">
            This is a good time to send the latest RSVP list to your event manager — use the button
            below.
          </p>
        </div>
      )}

      <div className="rounded-xl border p-5 mb-8 max-w-lg space-y-4">
        <h3 className="font-medium">Event Manager Contact</h3>
        <div className="space-y-1.5">
          <Label>Name</Label>
          <Input
            value={managerName}
            onChange={(e) => {
              setManagerName(e.target.value);
              setDirty(true);
            }}
            placeholder="e.g. Ramesh (Event Coordinator)"
          />
        </div>
        <div className="space-y-1.5">
          <Label>WhatsApp Number (with country code)</Label>
          <Input
            value={managerWhatsapp}
            onChange={(e) => {
              setManagerWhatsapp(e.target.value);
              setDirty(true);
            }}
            placeholder="+91 98765 43210"
          />
        </div>
        <div className="flex items-center gap-3">
          <Button
            size="sm"
            disabled={!dirty || saveManagerMutation.isPending}
            onClick={() => saveManagerMutation.mutate()}
          >
            {saveManagerMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save Contact
          </Button>
        </div>
        <div className="border-t pt-4">
          <Button size="sm" variant="outline" onClick={sendRsvpSummary} disabled={!rsvps}>
            <MessageCircle className="h-4 w-4 mr-2" />
            Send RSVP Summary via WhatsApp
          </Button>
          <p className="text-xs text-muted-foreground mt-2">
            Opens WhatsApp with the current RSVP count and guest list pre-filled — you just hit
            send. Works anytime, not only near the wedding date.
          </p>
        </div>
      </div>

      <h3 className="font-medium mb-3">RSVP Responses</h3>
      {rsvpsLoading || !rsvps ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : rsvps.length === 0 ? (
        <EmptyState>No RSVPs submitted yet.</EmptyState>
      ) : (
        <div className="mb-8 overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="p-2">Name</th>
                <th className="p-2">Phone</th>
                <th className="p-2">Guests</th>
                <th className="p-2">Attending</th>
                <th className="p-2">Message</th>
                <th className="p-2"></th>
              </tr>
            </thead>
            <tbody>
              {rsvps.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="p-2">{r.name}</td>
                  <td className="p-2">{r.phone}</td>
                  <td className="p-2">{r.guests}</td>
                  <td className="p-2 capitalize">{r.attending}</td>
                  <td className="p-2 max-w-xs truncate">{r.message}</td>
                  <td className="p-2">
                    <ConfirmDelete
                      itemLabel={`${r.name}'s RSVP`}
                      onConfirm={() => deleteRsvp.mutate(r.id)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h3 className="font-medium mb-3">Blessings Wall Moderation</h3>
      {blessingsLoading || !blessings ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : blessings.length === 0 ? (
        <EmptyState>No blessings submitted yet.</EmptyState>
      ) : (
        <div className="space-y-2">
          {blessings.map((b) => (
            <div key={b.id} className="flex items-center gap-3 rounded-lg border p-3">
              <div className="flex-1">
                <p className="text-sm font-medium">{b.name}</p>
                <p className="text-sm text-muted-foreground">{b.message}</p>
              </div>
              <Switch
                checked={b.published}
                onCheckedChange={(v) => publishBlessing.mutate({ id: b.id, published: v })}
              />
              <ConfirmDelete
                itemLabel={`${b.name}'s message`}
                onConfirm={() => deleteBlessing.mutate(b.id)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
