/**
 * Columns on public.items readable by the `authenticated` role.
 *
 * Migration 004 revokes the table-level SELECT grant and re-grants these
 * columns individually, so `select('*')` now fails with "permission denied".
 * Every browser-client query on items must pass this list. `user_email` is
 * deliberately absent — it reaches the claimer only through claim_item(), and
 * the admin UI only through the service-role route at /api/admin/data.
 */
export const ITEM_SELECT_COLUMNS =
  "id,ref,type,category,location,zone,where_left,date,description,photo_url,photo_path,status,user_id,user_name,created_at";

/**
 * Canonical origin, used for metadata, robots.txt and the sitemap.
 *
 * Set NEXT_PUBLIC_SITE_URL in .env.local and in the Vercel project settings.
 * The literal below is only a last-resort fallback — it was previously copied
 * into three separate files.
 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://findit-estin.vercel.app";

export const APP_CONFIG = {
  name: "FINDit",
  description: "Campus lost and found platform for ESTIN students",
  domain: "estin.dz",
  author: {
    name: "Mohamed Anis BELAMRI",
    email: "findit@estin.dz",
    github: "https://github.com/aynxitis",
    linkedin: "https://www.linkedin.com/in/anis-belamri/",
    instagram: "https://instagram.com/aynxitis",
  },
} as const;
