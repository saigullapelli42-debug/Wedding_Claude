import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Plus, Upload } from "lucide-react";
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
import { ReorderButtons, SectionHeader, EmptyState } from "../shared/Layout";

type GalleryCategory = Tables<"gallery_categories">;
type GalleryImage = Tables<"gallery_images">;

async function fetchCategories(siteId: string): Promise<GalleryCategory[]> {
  const { data, error } = await supabase
    .from("gallery_categories")
    .select("*")
    .eq("site_id", siteId)
    .order("display_order");
  if (error) throw error;
  return data;
}
async function fetchImages(siteId: string): Promise<GalleryImage[]> {
  const { data, error } = await supabase
    .from("gallery_images")
    .select("*")
    .eq("site_id", siteId)
    .order("display_order");
  if (error) throw error;
  return data;
}

function CategoryManager({
  categories,
  siteId,
  onChanged,
}: {
  categories: GalleryCategory[];
  siteId: string;
  onChanged: () => void;
}) {
  const [newName, setNewName] = useState("");
  const [editing, setEditing] = useState<Record<string, string>>({});

  const addMutation = useMutation({
    mutationFn: async (name: string) => {
      const { error } = await supabase
        .from("gallery_categories")
        .insert({ site_id: siteId, name, display_order: categories.length });
      if (error) throw error;
    },
    onSuccess: () => {
      setNewName("");
      toast.success("Category added");
      onChanged();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to add category"),
  });

  const renameMutation = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { error } = await supabase.from("gallery_categories").update({ name }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Category updated");
      onChanged();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to update category"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("gallery_categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Category deleted");
      onChanged();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to delete category"),
  });

  return (
    <div className="rounded-xl border p-5 mb-6">
      <h3 className="font-medium mb-3">Categories</h3>
      <div className="space-y-2 mb-3">
        {categories.map((c) => (
          <div key={c.id} className="flex items-center gap-2">
            <Input
              value={editing[c.id] ?? c.name}
              onChange={(e) => setEditing((p) => ({ ...p, [c.id]: e.target.value }))}
              className="max-w-xs"
            />
            <Button
              size="sm"
              variant="outline"
              disabled={!editing[c.id] || editing[c.id] === c.name}
              onClick={() => renameMutation.mutate({ id: c.id, name: editing[c.id] })}
            >
              Save
            </Button>
            <ConfirmDelete
              itemLabel={`the "${c.name}" category`}
              onConfirm={() => deleteMutation.mutate(c.id)}
            />
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          placeholder="New category name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          className="max-w-xs"
        />
        <Button
          size="sm"
          disabled={!newName.trim() || addMutation.isPending}
          onClick={() => addMutation.mutate(newName.trim())}
        >
          <Plus className="h-4 w-4 mr-1" /> Add Category
        </Button>
      </div>
    </div>
  );
}

function ImageCard({
  image,
  categories,
  siteId,
  isFirst,
  isLast,
  onMove,
  onChanged,
}: {
  image: GalleryImage;
  categories: GalleryCategory[];
  siteId: string;
  isFirst: boolean;
  isLast: boolean;
  onMove: (dir: "up" | "down") => void;
  onChanged: () => void;
}) {
  const [title, setTitle] = useState(image.title);
  const [alt, setAlt] = useState(image.alt_text);
  const [dirty, setDirty] = useState(false);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("gallery_images")
        .update({ title, alt_text: alt })
        .eq("id", image.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Image details saved");
      setDirty(false);
      onChanged();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to save"),
  });

  const categoryMutation = useMutation({
    mutationFn: async (categoryId: string) => {
      const { error } = await supabase
        .from("gallery_images")
        .update({ category_id: categoryId })
        .eq("id", image.id);
      if (error) throw error;
    },
    onSuccess: onChanged,
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to update category"),
  });

  const publishMutation = useMutation({
    mutationFn: async (published: boolean) => {
      const { error } = await supabase
        .from("gallery_images")
        .update({ published })
        .eq("id", image.id);
      if (error) throw error;
    },
    onSuccess: onChanged,
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to update"),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await deleteFromBucket("gallery", image.image_path).catch(() => {});
      const { error } = await supabase.from("gallery_images").delete().eq("id", image.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Image deleted");
      onChanged();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to delete"),
  });

  return (
    <div className="rounded-xl border overflow-hidden">
      <img
        src={image.image_url}
        alt={image.alt_text}
        className="w-full aspect-square object-cover"
      />
      <div className="p-3 space-y-2">
        <Input
          placeholder="Title"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            setDirty(true);
          }}
        />
        <Input
          placeholder="Alt text"
          value={alt}
          onChange={(e) => {
            setAlt(e.target.value);
            setDirty(true);
          }}
        />
        <Select
          value={image.category_id ?? undefined}
          onValueChange={(v) => categoryMutation.mutate(v)}
        >
          <SelectTrigger className="h-8 text-sm">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            <Switch checked={image.published} onCheckedChange={(v) => publishMutation.mutate(v)} />
            <span className="text-xs text-muted-foreground">
              {image.published ? "Published" : "Draft"}
            </span>
          </div>
          <ReorderButtons
            disabledUp={isFirst}
            disabledDown={isLast}
            onUp={() => onMove("up")}
            onDown={() => onMove("down")}
          />
        </div>
        <div className="flex items-center gap-2 pt-1">
          <Button size="sm" disabled={!dirty} onClick={() => saveMutation.mutate()}>
            Save
          </Button>
          <ConfirmDelete itemLabel="this image" onConfirm={() => deleteMutation.mutate()} />
        </div>
      </div>
    </div>
  );
}

export function GallerySection({ siteId }: { siteId: string }) {
  const queryClient = useQueryClient();
  const { data: categories, isLoading: catLoading } = useQuery({
    queryKey: ["gallery_categories", siteId],
    queryFn: () => fetchCategories(siteId),
  });
  const { data: images, isLoading: imgLoading } = useQuery({
    queryKey: ["gallery_images", siteId],
    queryFn: () => fetchImages(siteId),
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  function refresh() {
    queryClient.invalidateQueries({ queryKey: ["gallery_categories", siteId] });
    queryClient.invalidateQueries({ queryKey: ["gallery_images", siteId] });
    queryClient.invalidateQueries({ queryKey: ["public", "gallery_images", siteId] });
    queryClient.invalidateQueries({ queryKey: ["public", "gallery_categories", siteId] });
  }

  async function handleUpload(files: FileList) {
    setUploading(true);
    try {
      const startOrder = images?.length ?? 0;
      let i = 0;
      for (const file of Array.from(files)) {
        const { url, path } = await uploadToBucket("gallery", file, siteId);
        const { error } = await supabase.from("gallery_images").insert({
          site_id: siteId,
          image_url: url,
          image_path: path,
          title: file.name.replace(/\.[^.]+$/, ""),
          alt_text: file.name.replace(/\.[^.]+$/, ""),
          display_order: startOrder + i,
          category_id: categories?.[0]?.id ?? null,
        });
        if (error) throw error;
        i++;
      }
      toast.success(`Uploaded ${files.length} image${files.length > 1 ? "s" : ""}`);
      refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function move(image: GalleryImage, dir: "up" | "down") {
    if (!images) return;
    const idx = images.findIndex((d) => d.id === image.id);
    const swapIdx = dir === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= images.length) return;
    const other = images[swapIdx];
    await Promise.all([
      supabase
        .from("gallery_images")
        .update({ display_order: other.display_order })
        .eq("id", image.id),
      supabase
        .from("gallery_images")
        .update({ display_order: image.display_order })
        .eq("id", other.id),
    ]);
    refresh();
  }

  if (catLoading || imgLoading || !categories || !images) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading…
      </div>
    );
  }

  return (
    <div>
      <SectionHeader
        title="Gallery"
        description="Photos shown in the site gallery, grouped by category."
      />
      <CategoryManager categories={categories} siteId={siteId} onChanged={refresh} />

      <div className="mb-4">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) handleUpload(e.target.files);
            e.target.value = "";
          }}
        />
        <Button size="sm" disabled={uploading} onClick={() => fileInputRef.current?.click()}>
          {uploading ? (
            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
          ) : (
            <Upload className="h-4 w-4 mr-1" />
          )}
          Upload Images
        </Button>
      </div>

      {images.length === 0 ? (
        <EmptyState>No gallery images yet. Upload your first photos above.</EmptyState>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {images.map((img, i) => (
            <ImageCard
              key={img.id}
              image={img}
              categories={categories}
              siteId={siteId}
              isFirst={i === 0}
              isLast={i === images.length - 1}
              onMove={(dir) => move(img, dir)}
              onChanged={refresh}
            />
          ))}
        </div>
      )}
    </div>
  );
}
