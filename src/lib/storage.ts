import { supabase } from "./supabase";

export type UploadBucket =
  "hero" | "couple" | "gallery" | "events" | "family" | "venue" | "qr-codes" | "music" | "branding";

/**
 * Uploads a file to the given bucket under a random, collision-free path.
 * Returns both the public URL (for immediate rendering) and the storage path
 * (needed later to delete/replace the object).
 */
export async function uploadToBucket(
  bucket: UploadBucket,
  file: File,
): Promise<{ url: string; path: string }> {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin";
  const path = `${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return { url: data.publicUrl, path };
}

/** Deletes a previously-uploaded object. Safe to call with null/undefined. */
export async function deleteFromBucket(bucket: UploadBucket, path?: string | null) {
  if (!path) return;
  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) throw error;
}

/**
 * Replaces an existing file: uploads the new one first, then deletes the old
 * one so a failed upload never leaves the record pointing at nothing.
 */
export async function replaceInBucket(
  bucket: UploadBucket,
  file: File,
  previousPath?: string | null,
): Promise<{ url: string; path: string }> {
  const result = await uploadToBucket(bucket, file);
  if (previousPath) {
    await deleteFromBucket(bucket, previousPath).catch(() => {
      // Non-fatal: orphaned file, but the new upload already succeeded.
    });
  }
  return result;
}
