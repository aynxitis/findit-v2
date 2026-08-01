import type { SupabaseClient } from "@supabase/supabase-js";
import type { Item } from "@/lib/types/item";

export const PHOTO_BUCKET = "item-photos";

/**
 * Marker separating the origin from the object name in a legacy public URL.
 * This string used to be duplicated at three call sites, each re-implementing
 * the same slice. It lives here now and nowhere else.
 */
const PUBLIC_URL_MARKER = `/object/public/${PHOTO_BUCKET}/`;

/** Signed URLs are short-lived; a board view refetches them on every load. */
export const SIGNED_URL_TTL_SECONDS = 60 * 60;

/**
 * The storage path for an item's photo, or null if it has none.
 *
 * Reads `photo_path` first and falls back to deriving it from the legacy
 * `photo_url`. Both columns exist simultaneously — migration 010 added the
 * path and deliberately kept the URL so a rollback still renders images, and
 * `photo_url` is not dropped until a later migration.
 *
 * The derived branch percent-decodes, because a public URL encodes the object
 * name while the storage API expects the raw one. Two live photos are named
 * "unnamed (1).jpg" with a literal space; without decoding, signing them 404s.
 */
export function itemStoragePath(
  item: Pick<Item, "photo_path" | "photo_url">
): string | null {
  if (item.photo_path) return item.photo_path;
  if (!item.photo_url) return null;

  const idx = item.photo_url.indexOf(PUBLIC_URL_MARKER);
  if (idx === -1) return null;

  const encoded = item.photo_url.substring(idx + PUBLIC_URL_MARKER.length);
  try {
    return decodeURIComponent(encoded);
  } catch {
    // Malformed escape sequence — the raw value is a better guess than null.
    return encoded;
  }
}

/**
 * Batch-sign storage paths, returning a path → URL map.
 *
 * Batched rather than per-card: a board of 40 items would otherwise open 40
 * requests. Paths that fail to sign are simply absent from the map, and the
 * caller falls back to `photo_url` while the bucket is still public.
 */
export async function signPhotoPaths(
  supabase: SupabaseClient,
  paths: string[]
): Promise<Record<string, string>> {
  const unique = Array.from(new Set(paths.filter(Boolean)));
  if (unique.length === 0) return {};

  const { data, error } = await supabase.storage
    .from(PHOTO_BUCKET)
    .createSignedUrls(unique, SIGNED_URL_TTL_SECONDS);

  if (error || !data) return {};

  const map: Record<string, string> = {};
  for (const entry of data) {
    // `path` echoes back the requested path; signedUrl is null on failure.
    if (entry.signedUrl && entry.path) map[entry.path] = entry.signedUrl;
  }
  return map;
}
