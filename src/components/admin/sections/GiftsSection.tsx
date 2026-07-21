import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/lib/supabase";
import type { Tables, TablesUpdate } from "@/lib/database.types";
import { ImageUpload } from "../shared/ImageUpload";
import { SectionHeader, SaveBar } from "../shared/Layout";
import { buildUpiQrUrl } from "@/lib/upi";

type GiftSettings = Tables<"gift_settings">;

async function fetchGift(siteId: string): Promise<GiftSettings> {
  const { data, error } = await supabase
    .from("gift_settings")
    .select("*")
    .eq("site_id", siteId)
    .single();
  if (error) throw error;
  return data;
}

export function GiftsSection({ siteId }: { siteId: string }) {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["gift_settings", siteId],
    queryFn: () => fetchGift(siteId),
  });
  const [form, setForm] = useState<GiftSettings | null>(null);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (data && !form) setForm(data);
  }, [data]);

  const mutation = useMutation({
    mutationFn: async (update: TablesUpdate<"gift_settings">) => {
      const { error } = await supabase.from("gift_settings").update(update).eq("site_id", siteId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Gift settings saved");
      setDirty(false);
      queryClient.invalidateQueries({ queryKey: ["gift_settings", siteId] });
      queryClient.invalidateQueries({ queryKey: ["public", "gift_settings", siteId] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to save"),
  });

  function update<K extends keyof GiftSettings>(key: K, value: GiftSettings[K]) {
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
      <SectionHeader
        title="Gifts / UPI"
        description="Payment details shown to guests who want to send a gift."
      />
      <div className="space-y-5 max-w-lg">
        <div className="flex items-center justify-between rounded-lg border p-3">
          <div>
            <p className="text-sm font-medium">Show Gift Section</p>
            <p className="text-xs text-muted-foreground">
              Turn the whole gift/UPI section on or off.
            </p>
          </div>
          <Switch checked={form.enabled} onCheckedChange={(v) => update("enabled", v)} />
        </div>
        <div className="space-y-1.5">
          <Label>UPI ID</Label>
          <Input
            value={form.upi_id}
            onChange={(e) => update("upi_id", e.target.value)}
            placeholder="name@bank"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Account Holder Name</Label>
          <Input
            value={form.account_name}
            onChange={(e) => update("account_name", e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Bank Name</Label>
          <Input value={form.bank_name} onChange={(e) => update("bank_name", e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Other Bank Details (account no., IFSC, etc.)</Label>
          <Textarea
            rows={3}
            value={form.bank_details}
            onChange={(e) => update("bank_details", e.target.value)}
          />
        </div>
        <div className="rounded-lg border p-4 space-y-3">
          <div>
            <p className="text-sm font-medium">UPI QR Code</p>
            <p className="text-xs text-muted-foreground">
              Generated automatically from your UPI ID above — no upload needed. Upload a custom
              image below only if you want to override it (e.g. your bank's official QR).
            </p>
          </div>
          {form.qr_image_url ? (
            <p className="text-xs text-muted-foreground">
              Using your uploaded QR code. Remove it below to switch back to the auto-generated one.
            </p>
          ) : form.upi_id.trim() ? (
            <img
              src={buildUpiQrUrl(form.upi_id, form.account_name, 160) ?? undefined}
              alt="Auto-generated UPI QR preview"
              className="w-40 h-40 rounded-lg border bg-white p-2"
            />
          ) : (
            <p className="text-xs text-muted-foreground">Enter a UPI ID above to preview the QR.</p>
          )}
          <ImageUpload
            bucket="qr-codes"
            siteId={siteId}
            url={form.qr_image_url}
            path={form.qr_image_path}
            aspect="square"
            label="Custom QR Code (optional override)"
            onChange={({ url, path }) => {
              update("qr_image_url", url);
              update("qr_image_path", path);
            }}
          />
        </div>
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
