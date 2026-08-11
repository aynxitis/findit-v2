/**
 * The single source of truth for FINDit's taxonomy.
 *
 * Categories were previously defined five times (the item_category enum,
 * ItemCategory, CATEGORIES, CATEGORY_LABELS, CATEGORY_ICONS, VALID_CATEGORIES)
 * and locations six (ItemLocation, LOCATION_LABELS, VALID_LOCATIONS,
 * SPOT_OPTIONS, a private icon map in item-filters, and a hardcoded array in
 * admin-item-modal). Everything below is derived from these four arrays.
 *
 * Labels and icons are moved verbatim. Nothing here changes what a student
 * sees; if a string looks wrong, it was already wrong.
 *
 * Note on shape: the P1-1 brief called for "slug, label key, and icon". The
 * entries carry the label *text*, not a catalogue key — the string catalogue
 * does not exist until P1-3, and inventing keys here would have meant building
 * half of that step early. P1-3 can lift these labels into the catalogue
 * without touching any consumer.
 */

// ── Categories ───────────────────────────────────────────────────────────────

export const CATEGORIES = [
  { slug: "keys", label: "Keys", icon: "🔑" },
  { slug: "card", label: "Card / ID", icon: "🪪" },
  { slug: "phone", label: "Phone", icon: "📱" },
  { slug: "bag", label: "Bag", icon: "🎒" },
  { slug: "clothing", label: "Clothing", icon: "👕" },
  { slug: "electronics", label: "Electronics", icon: "💻" },
  { slug: "other", label: "Other", icon: "📦" },
] as const;

// ── Zones ────────────────────────────────────────────────────────────────────

export const ZONES = [
  { slug: "school", label: "École", icon: "🏫" },
  { slug: "residence", label: "Résidence", icon: "🏠" },
  { slug: "unknown", label: "Not sure", icon: "❓" },
] as const;

/**
 * Known locations.
 *
 * `label` is the full display name; `shortLabel` is the form-chip name, which
 * differs for the two foyers — the chips are already grouped under a zone
 * heading, so they read "Foyer" rather than "Foyer (école)". Both spellings
 * predate this file and are preserved exactly.
 *
 * `zone` is null for `unknown`, which is reachable from either zone.
 *
 * IMPORTANT: items.location is a `text` column, NOT an enum — verified against
 * production, where 4 of 26 rows hold free text a student typed ("Amphi",
 * "Banc entre amphi 9 et 10"). This array is therefore the set of *known*
 * slugs, not the set of permitted values. Resolve display names through
 * locationLabel(), which falls back to the raw string.
 */
export const LOCATIONS = [
  { slug: "library", label: "Library", shortLabel: "Library", icon: "📚", zone: "school" },
  { slug: "foyer", label: "Foyer (école)", shortLabel: "Foyer", icon: "🪑", zone: "school" },
  { slug: "td_halls", label: "TD Halls", shortLabel: "TD Halls", icon: "🚪", zone: "school" },
  { slug: "tp_halls", label: "TP Halls", shortLabel: "TP Halls", icon: "🔬", zone: "school" },
  { slug: "restau", label: "Restau", shortLabel: "Restau", icon: "🍽️", zone: "residence" },
  { slug: "res_foyer", label: "Foyer (résidence)", shortLabel: "Foyer", icon: "🪑", zone: "residence" },
  { slug: "unknown", label: "Not sure", shortLabel: "Not sure", icon: "❓", zone: null },
] as const;

/**
 * The "let me type my own" affordance in the report form's spot picker.
 *
 * This is a UI sentinel, deliberately NOT a member of LOCATIONS. Choosing it
 * makes the form submit the student's typed text as items.location; the value
 * "other" itself never reaches the database, and no production row contains
 * it. It previously sat inside SPOT_OPTIONS alongside real slugs, which made
 * it look like a location and put it at odds with VALID_LOCATIONS.
 */
export const OTHER_SPOT = {
  slug: "other",
  label: "Other",
  shortLabel: "Other",
  icon: "📦",
} as const;

// ── Where a found item ended up ──────────────────────────────────────────────

/**
 * `label` is the past-tense display form used on cards and summaries;
 * `optionLabel` is the first-person form used on the form's chips. They are
 * genuinely different sentences, not the same string with an emoji bolted on,
 * so both are carried.
 */
export const WHERE_LEFT = [
  {
    slug: "with_me",
    label: "Still with me",
    optionLabel: "I still have it",
    icon: "🙋",
  },
  {
    slug: "admin",
    label: "Handed to admin",
    optionLabel: "Handed to admin / lost & found desk",
    icon: "🏢",
  },
  {
    slug: "left_there",
    label: "Left where found",
    optionLabel: "Left it where I found it",
    icon: "📍",
  },
] as const;

// ── Derived types ────────────────────────────────────────────────────────────

export type ItemCategory = (typeof CATEGORIES)[number]["slug"];
export type ItemZone = (typeof ZONES)[number]["slug"];
export type ItemWhereLeft = (typeof WHERE_LEFT)[number]["slug"];

/** A location slug the app knows about. items.location may hold any string. */
export type KnownLocation = (typeof LOCATIONS)[number]["slug"];

// ── Derived lookups ──────────────────────────────────────────────────────────

const bySlug = <T extends { slug: string }, V>(
  entries: readonly T[],
  pick: (entry: T) => V
): Record<string, V> => Object.fromEntries(entries.map((e) => [e.slug, pick(e)]));

export const CATEGORY_LABELS = bySlug(CATEGORIES, (c) => c.label);
export const CATEGORY_ICONS = bySlug(CATEGORIES, (c) => c.icon);
export const ZONE_LABELS = bySlug(ZONES, (z) => z.label);
export const LOCATION_LABELS = bySlug(LOCATIONS, (l) => l.label);
export const LOCATION_ICONS = bySlug(LOCATIONS, (l) => l.icon);
export const WHERE_LEFT_LABELS = bySlug(WHERE_LEFT, (w) => w.label);

// ── Derived validation arrays ────────────────────────────────────────────────

export const VALID_TYPES: string[] = ["found", "lost"];

/**
 * Deliberately excludes 'resolved', which the item_status enum has held since
 * migration 011. Adding it here is P2-3's job, not this deduplication's.
 */
export const VALID_STATUSES: string[] = ["open", "claimed"];
export const VALID_CATEGORIES: string[] = CATEGORIES.map((c) => c.slug);
export const VALID_ZONES: string[] = ZONES.map((z) => z.slug);
export const VALID_WHERE_LEFT: string[] = WHERE_LEFT.map((w) => w.slug);

/**
 * Known location slugs. Not a whitelist for items.location — the column is
 * free text by design, via OTHER_SPOT. The report form uses this to decide
 * whether a value came from a chip or from the free-text box.
 */
export const KNOWN_LOCATIONS: string[] = LOCATIONS.map((l) => l.slug);

// ── Helpers ──────────────────────────────────────────────────────────────────

export function categoryLabel(slug: string): string {
  return CATEGORY_LABELS[slug] ?? slug;
}

export function categoryIcon(slug: string): string {
  return CATEGORY_ICONS[slug] ?? "📦";
}

/**
 * Display name for a location. Falls back to the stored string, because
 * items.location legitimately holds free text a student typed.
 */
export function locationLabel(value: string): string {
  return LOCATION_LABELS[value] ?? value;
}

export function locationIcon(value: string): string {
  return LOCATION_ICONS[value] ?? "📍";
}

/** Spot chips for a zone, with the free-text sentinel last. */
export function spotOptionsForZone(zone: string) {
  return [...LOCATIONS.filter((l) => l.zone === zone), OTHER_SPOT];
}

/** Location slugs an admin may pick for a zone; all of them when unset. */
export function locationsForZone(zone: string | null | undefined): string[] {
  if (!zone) return KNOWN_LOCATIONS;
  const scoped = LOCATIONS.filter((l) => l.zone === zone).map((l) => l.slug);
  return scoped.length > 0 ? scoped : KNOWN_LOCATIONS;
}
