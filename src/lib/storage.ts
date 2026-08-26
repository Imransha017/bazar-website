/**
 * Portable object-storage helper.
 *
 * Works against any Supabase-compatible storage (Lovable Cloud today, a
 * self-hosted Supabase / S3-compatible gateway on your own VPS later).
 *
 * Configuration is environment-driven — no hardcoded hosts or bucket modes:
 *   VITE_STORAGE_PUBLIC_BUCKETS   comma separated buckets served publicly
 *                                 (e.g. "products,public"). Empty => all private.
 *   VITE_STORAGE_SIGNED_URL_TTL   seconds a signed URL stays valid (default 1 year)
 */
import { supabase } from "@/integrations/supabase/client";

const PUBLIC_BUCKETS = String(import.meta.env["VITE_STORAGE_PUBLIC_BUCKETS"] ?? "")
  .split(",")
  .map((b) => b.trim())
  .filter(Boolean);

export const SIGNED_URL_TTL = Number(
  import.meta.env["VITE_STORAGE_SIGNED_URL_TTL"] ?? 60 * 60 * 24 * 365,
);

export function isPublicBucket(bucket: string) {
  return PUBLIC_BUCKETS.includes(bucket);
}

/** Upload a file and return its storage path (portable, host independent). */
export async function uploadToBucket(
  bucket: string,
  path: string,
  file: File,
  opts: { upsert?: boolean } = {},
): Promise<string> {
  const { data, error } = await supabase.storage.from(bucket).upload(path, file, {
    contentType: file.type,
    upsert: opts.upsert ?? false,
  });
  if (error) throw error;
  return data.path;
}

/** Resolve a storage path to a browser-usable URL for the current deployment. */
export async function getStorageUrl(bucket: string, path: string): Promise<string> {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  if (isPublicBucket(bucket)) {
    return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
  }
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, SIGNED_URL_TTL);
  if (error) throw error;
  return data.signedUrl;
}

/** Upload and immediately resolve to a usable URL. */
export async function uploadAndGetUrl(
  bucket: string,
  path: string,
  file: File,
  opts: { upsert?: boolean } = {},
): Promise<{ path: string; url: string }> {
  const stored = await uploadToBucket(bucket, path, file, opts);
  return { path: stored, url: await getStorageUrl(bucket, stored) };
}
