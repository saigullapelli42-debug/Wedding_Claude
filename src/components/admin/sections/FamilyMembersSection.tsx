import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import type { Tables, TablesInsert } from "@/lib/database.types";
import { ImageUpload } from "../shared/ImageUpload";
import { ConfirmDelete } from "../shared/ConfirmDelete";
import { ReorderButtons, SectionHeader, EmptyState } from "../shared/Layout";
import { deleteFromBucket } from "@/lib/storage";

type FamilyGroup = Tables<"family_groups">;
type FamilyMember = Tables<"family_members">;

async function fetchGroups(): Promise<FamilyGroup[]> {
  const { data, error } = await supabase.from("family_groups").select("*").order("side");
  if (error) throw error;
  return data;
}
async function fetchMembers(): Promise<FamilyMember[]> {
  const { data, error } = await supabase.from("family_members").select("*").order("display_order");
  if (error) throw error;
  return data;
}

function MemberCard({
  member,
  isFirst,
  isLast,
  onMove,
  onChanged,
}: {
  member: FamilyMember;
  isFirst: boolean;
  isLast: boolean;
  onMove: (dir: "up" | "down") => void;
  onChanged: () => void;
}) {
  const [form, setForm] = useState(member);
  const [dirty, setDirty] = useState(false);

  function set<K extends keyof FamilyMember>(key: K, value: FamilyMember[K]) {
    setForm((p) => ({ ...p, [key]: value }));
    setDirty(true);
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("family_members")
        .update({
          name: form.name,
          relationship: form.relationship,
          description: form.description,
          image_url: form.image_url,
          image_path: form.image_path,
        })
        .eq("id", form.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Family member saved");
      setDirty(false);
      onChanged();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to save"),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await deleteFromBucket("family", form.image_path).catch(() => {});
      const { error } = await supabase.from("family_members").delete().eq("id", form.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Family member deleted");
      onChanged();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to delete"),
  });

  return (
    <div className="rounded-xl border p-4 space-y-3">
      <div className="flex items-start gap-3">
        <ReorderButtons
          disabledUp={isFirst}
          disabledDown={isLast}
          onUp={() => onMove("up")}
          onDown={() => onMove("down")}
        />
        <ImageUpload
          bucket="family"
          url={form.image_url}
          path={form.image_path}
          aspect="square"
          label="Photo"
          onChange={({ url, path }) => {
            set("image_url", url);
            set("image_path", path);
          }}
        />
        <div className="flex-1 space-y-2">
          <Input
            placeholder="Name"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
          />
          <Input
            placeholder="Relationship (Father, Mother...)"
            value={form.relationship}
            onChange={(e) => set("relationship", e.target.value)}
          />
          <Textarea
            placeholder="Short description (optional)"
            rows={2}
            value={form.description ?? ""}
            onChange={(e) => set("description", e.target.value)}
          />
        </div>
        <ConfirmDelete
          itemLabel={`${form.name || "this family member"}`}
          onConfirm={() => deleteMutation.mutate()}
        />
      </div>
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
            setForm(member);
            setDirty(false);
          }}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}

function FamilyGroupPanel({
  group,
  members,
  onChanged,
}: {
  group: FamilyGroup;
  members: FamilyMember[];
  onChanged: () => void;
}) {
  const addMutation = useMutation({
    mutationFn: async () => {
      const payload: TablesInsert<"family_members"> = {
        family_group_id: group.id,
        name: "New Member",
        relationship: "",
        display_order: members.length,
      };
      const { error } = await supabase.from("family_members").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Family member added");
      onChanged();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to add member"),
  });

  async function move(member: FamilyMember, dir: "up" | "down") {
    const idx = members.findIndex((m) => m.id === member.id);
    const swapIdx = dir === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= members.length) return;
    const other = members[swapIdx];
    await Promise.all([
      supabase
        .from("family_members")
        .update({ display_order: other.display_order })
        .eq("id", member.id),
      supabase
        .from("family_members")
        .update({ display_order: member.display_order })
        .eq("id", other.id),
    ]);
    onChanged();
  }

  return (
    <div className="mb-8">
      <h3 className="font-serif text-lg mb-3">{group.title}</h3>
      <Button
        size="sm"
        variant="outline"
        className="mb-3"
        onClick={() => addMutation.mutate()}
        disabled={addMutation.isPending}
      >
        <Plus className="h-4 w-4 mr-1" /> Add Member
      </Button>
      {members.length === 0 ? (
        <EmptyState>No family members added yet.</EmptyState>
      ) : (
        <div className="space-y-3">
          {members.map((m, i) => (
            <MemberCard
              key={m.id}
              member={m}
              isFirst={i === 0}
              isLast={i === members.length - 1}
              onMove={(dir) => move(m, dir)}
              onChanged={onChanged}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function FamilyMembersSection() {
  const queryClient = useQueryClient();
  const { data: groups, isLoading: groupsLoading } = useQuery({
    queryKey: ["family_groups"],
    queryFn: fetchGroups,
  });
  const { data: members, isLoading: membersLoading } = useQuery({
    queryKey: ["family_members"],
    queryFn: fetchMembers,
  });

  function refresh() {
    queryClient.invalidateQueries({ queryKey: ["family_groups"] });
    queryClient.invalidateQueries({ queryKey: ["family_members"] });
    queryClient.invalidateQueries({ queryKey: ["public", "family"] });
  }

  if (groupsLoading || membersLoading || !groups || !members) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading…
      </div>
    );
  }

  return (
    <div>
      <SectionHeader
        title="Family Members"
        description="Bride's and groom's family, shown on the site."
      />
      {groups.map((group) => (
        <FamilyGroupPanel
          key={group.id}
          group={group}
          members={members.filter((m) => m.family_group_id === group.id)}
          onChanged={refresh}
        />
      ))}
    </div>
  );
}
