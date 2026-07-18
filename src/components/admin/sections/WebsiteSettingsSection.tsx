import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/lib/supabase";
import type { Tables } from "@/lib/database.types";
import { ConfirmDelete } from "../shared/ConfirmDelete";
import { SectionHeader, EmptyState } from "../shared/Layout";

type Rsvp = Tables<"rsvps">;
type Blessing = Tables<"blessings">;

async function fetchRsvps(): Promise<Rsvp[]> {
  const { data, error } = await supabase
    .from("rsvps")
    .select("*")
    .order("submitted_at", { ascending: false });
  if (error) throw error;
  return data;
}
async function fetchBlessings(): Promise<Blessing[]> {
  const { data, error } = await supabase
    .from("blessings")
    .select("*")
    .order("submitted_at", { ascending: false });
  if (error) throw error;
  return data;
}

export function WebsiteSettingsSection() {
  const queryClient = useQueryClient();
  const { data: rsvps, isLoading: rsvpsLoading } = useQuery({
    queryKey: ["admin_rsvps"],
    queryFn: fetchRsvps,
  });
  const { data: blessings, isLoading: blessingsLoading } = useQuery({
    queryKey: ["admin_blessings"],
    queryFn: fetchBlessings,
  });

  function refresh() {
    queryClient.invalidateQueries({ queryKey: ["admin_rsvps"] });
    queryClient.invalidateQueries({ queryKey: ["admin_blessings"] });
    queryClient.invalidateQueries({ queryKey: ["public", "blessings"] });
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
