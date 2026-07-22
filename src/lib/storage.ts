import { supabase } from "./supabase";

export type UploadBucket =
  "hero" | "couple" | "gallery" | "events" | "family" | "venue" | "qr-codes" | "music" | "branding";

const ALL_BUCKETS: UploadBucket[] = [
  "hero",
  "couple",
  "gallery",
  "events",
  "family",
  "venue",
  "qr-codes",
  "music",
  "branding",
];

/**
 * Uploads a file to the given bucket under a random, collision-free path,
 * namespaced by site so multiple couples' files never collide in a shared
 * bucket. Returns both the public URL (for immediate rendering) and the
 * storage path (needed later to delete/replace the object).
 */
export async function uploadToBucket(
  bucket: UploadBucket,
  file: File,
  siteId: string,
): Promise<{ url: string; path: string }> {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin";
  const path = `${siteId}/${crypto.randomUUID()}.${ext}`;

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
  siteId: string,
  previousPath?: string | null,
): Promise<{ url: string; path: string }> {
  const result = await uploadToBucket(bucket, file, siteId);
  if (previousPath) {
    await deleteFromBucket(bucket, previousPath).catch(() => {
      // Non-fatal: orphaned file, but the new upload already succeeded.
    });
  }
  return result;
}

/**
 * Deletes every uploaded file belonging to a site, across every bucket
 * (files are namespaced under `{siteId}/...`). Call this before deleting the
 * site's database row so nothing is left orphaned in storage. Best-effort:
 * failures on one bucket don't stop cleanup of the others.
 */
export async function deleteAllSiteFiles(siteId: string): Promise<void> {
  await Promise.all(
    ALL_BUCKETS.map(async (bucket) => {
      try {
        const { data, error } = await supabase.storage.from(bucket).list(siteId);
        if (error || !data || data.length === 0) return;
        const paths = data.map((f) => `${siteId}/${f.name}`);
        await supabase.storage.from(bucket).remove(paths);
      } catch {
        // Best-effort cleanup — don't block site deletion if a bucket fails.
      }
    }),
  );
}
