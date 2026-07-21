import { useRef, useState } from "react";
import { Loader2, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { replaceInBucket, deleteFromBucket, type UploadBucket } from "@/lib/storage";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
  bucket: UploadBucket;
  siteId: string;
  url: string | null | undefined;
  path: string | null | undefined;
  onChange: (next: { url: string | null; path: string | null }) => void;
  accept?: string;
  label?: string;
  aspect?: "square" | "video" | "portrait";
  disabled?: boolean;
}

export function ImageUpload({
  bucket,
  siteId,
  url,
  path,
  onChange,
  accept = "image/*",
  label = "Image",
  aspect = "video",
  disabled,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const aspectClass =
    aspect === "square" ? "aspect-square" : aspect === "portrait" ? "aspect-[3/4]" : "aspect-video";

  async function handleFile(file: File) {
    setError(null);
    const localPreview = URL.createObjectURL(file);
    setPreview(localPreview);
    setBusy(true);
    try {
      const result = await replaceInBucket(bucket, file, siteId, path);
      onChange({ url: result.url, path: result.path });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
      URL.revokeObjectURL(localPreview);
      setPreview(null);
    }
  }

  async function handleRemove() {
    setError(null);
    setBusy(true);
    try {
      await deleteFromBucket(bucket, path);
      onChange({ url: null, path: null });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to remove image");
    } finally {
      setBusy(false);
    }
  }

  const displaySrc = preview ?? url ?? null;

  return (
    <div className="space-y-2">
      {label && <p className="text-sm font-medium">{label}</p>}
      <div
        className={cn(
          "relative w-full max-w-sm overflow-hidden rounded-lg border border-dashed border-stone-300 bg-stone-50",
          aspectClass,
        )}
      >
        {displaySrc ? (
          <img src={displaySrc} alt={label} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-stone-400 text-sm">
            No image
          </div>
        )}
        {busy && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <Loader2 className="h-6 w-6 animate-spin text-white" />
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          disabled={disabled || busy}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
            e.target.value = "";
          }}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || busy}
          onClick={() => inputRef.current?.click()}
        >
          <Upload className="h-4 w-4 mr-1" />
          {url ? "Replace" : "Upload"}
        </Button>
        {url && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={disabled || busy}
            onClick={handleRemove}
          >
            <X className="h-4 w-4 mr-1" />
            Remove
          </Button>
        )}
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
