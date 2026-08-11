/**
 * Canonical public origin, used for metadata, robots.txt and the sitemap.
 *
 * Set NEXT_PUBLIC_SITE_URL per environment. The literal is a last-resort
 * fallback for a build with no env at all; it was previously copy-pasted into
 * layout.tsx, robots.ts and sitemap.ts, so a domain change needed three edits
 * and silently half-applied if one was missed.
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
