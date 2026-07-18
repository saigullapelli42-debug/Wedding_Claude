import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Plus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import type { Tables } from "@/lib/database.types";
import { ImageUpload } from "../shared/ImageUpload";
import { SectionHeader, SaveBar } from "../shared/Layout";

type CoupleMember = Tables<"couple_members">;
type SocialLink = { platform: string; url: string };

async function fetchCouple(): Promise<CoupleMember[]> {
  const { data, error } = await supabase.from("couple_members").select("*").order("display_order");
  if (error) throw error;
  return data;
}

function CoupleMemberCard({ member, onSaved }: { member: CoupleMember; onSaved: () => void }) {
  const [form, setForm] = useState(member);
  const [dirty, setDirty] = useState(false);
  const links = (Array.isArray(form.social_links)
    ? form.social_links
    : []) as unknown as SocialLink[];

  const mutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("couple_members")
        .update({
          name: form.name,
          description: form.description,
          image_url: form.image_url,
          image_path: form.image_path,
          social_links: form.social_links,
        })
        .eq("id", form.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(`${form.side === "bride" ? "Bride" : "Groom"} details saved`);
      setDirty(false);
      onSaved();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to save"),
  });

  function setLinks(next: SocialLink[]) {
    setForm((prev) => ({ ...prev, social_links: next as unknown as CoupleMember["social_links"] }));
    setDirty(true);
  }

  return (
    <div className="rounded-xl border p-5 space-y-4">
      <h3 className="font-serif text-lg capitalize">{form.side}</h3>
      <ImageUpload
        bucket="couple"
        url={form.image_url}
        path={form.image_path}
        aspect="square"
        label="Profile Photo"
        onChange={({ url, path }) => {
          setForm((p) => ({ ...p, image_url: url, image_path: path }));
          setDirty(true);
        }}
      />
      <div className="space-y-1.5">
        <Label>Name</Label>
        <Input
          value={form.name}
          onChange={(e) => {
            setForm((p) => ({ ...p, name: e.target.value }));
            setDirty(true);
          }}
        />
      </div>
      <div className="space-y-1.5">
        <Label>Short Description</Label>
        <Textarea
          rows={3}
          value={form.description}
          onChange={(e) => {
            setForm((p) => ({ ...p, description: e.target.value }));
            setDirty(true);
          }}
        />
      </div>
      <div className="space-y-2">
        <Label>Social Media Links</Label>
        {links.map((link, i) => (
          <div key={i} className="flex gap-2">
            <Input
              placeholder="Platform (Instagram)"
              className="w-36"
              value={link.platform}
              onChange={(e) => {
                const next = [...links];
                next[i] = { ...next[i], platform: e.target.value };
                setLinks(next);
              }}
            />
            <Input
              placeholder="https://..."
              value={link.url}
              onChange={(e) => {
                const next = [...links];
                next[i] = { ...next[i], url: e.target.value };
                setLinks(next);
              }}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setLinks(links.filter((_, j) => j !== i))}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setLinks([...links, { platform: "", url: "" }])}
        >
          <Plus className="h-4 w-4 mr-1" /> Add Link
        </Button>
      </div>
      <SaveBar
        onSave={() => mutation.mutate()}
        onCancel={() => {
          setForm(member);
          setDirty(false);
        }}
        saving={mutation.isPending}
        dirty={dirty}
      />
    </div>
  );
}

export function CoupleDetails() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["couple_members"], queryFn: fetchCouple });

  function refresh() {
    queryClient.invalidateQueries({ queryKey: ["couple_members"] });
    queryClient.invalidateQueries({ queryKey: ["public", "couple_members"] });
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
        title="Couple Details"
        description="Bride and groom profiles shown on the site."
      />
      <div className="grid gap-6 sm:grid-cols-2">
        {data.map((member) => (
          <CoupleMemberCard key={member.id} member={member} onSaved={refresh} />
        ))}
      </div>
    </div>
  );
}
