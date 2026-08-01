/**
 * The single source of truth for FINDit's taxonomy.
 *
 * Categories, locations, zones and where-left were previously defined 5–7 times
 * each — a Postgres enum, a TS union, a labels map, an icons map, a validation
 * array, an options array for the report form, plus a stray hardcoded copy in
 * the admin modal and `CASE` blocks inside `claim_item`. Adding one category
 * meant seven coordinated edits and there was no compiler help if you missed
 * one.
 *
 * Everything below is derived from the four `as const` objects. To add a
 * category you edit `CATEGORIES` here and add the value to the `item_category`
 * enum in a migration. That is the whole change.
 *
 * Ordering is meaningful: object key order drives the order of the derived
 * arrays, which is the order chips and dropdowns render in.
 */

// ── Categories ───────────────────────────────────────────────────────────────

export const CATEGORIES = {
  keys:        { label: "Keys",        icon: "🔑" },
  card:        { label: "Card / ID",   icon: "🪪" },
  phone:       { label: "Phone",       icon: "📱" },
  bag:         { label: "Bag",         icon: "🎒" },
  clothing:    { label: "Clothing",    icon: "👕" },
  electronics: { label: "Electronics", icon: "💻" },
  other:       { label: "Other",       icon: "📦" },
} as const;

export type ItemCategory = keyof typeof CATEGORIES;

// ── Locations ────────────────────────────────────────────────────────────────
// `zone` groups locations for the report form's two-step picker. It is not
// stored on new items (P1-5 drops it from the form) but the column still
// exists and the admin modal still filters by it.

export const LOCATIONS = {
  library:   { label: "Library",             icon: "📚", zone: "school"    },
  foyer:     { label: "Foyer (école)",  icon: "🪑", zone: "school"    },
  td_halls:  { label: "TD Halls",            icon: "🚪", zone: "school"    },
  tp_halls:  { label: "TP Halls",            icon: "🔬", zone: "school"    },
  restau:    { label: "Restau",              icon: "🍽️", zone: "residence" },
  res_foyer: { label: "Foyer (résidence)", icon: "🪑", zone: "residence" },
  unknown:   { label: "Not sure",            icon: "❓",       zone: "unknown"   },
} as const;

export type ItemLocation = keyof typeof LOCATIONS;

// ── Zones ────────────────────────────────────────────────────────────────────

export const ZONES = {
  school:    { label: "École",     icon: "🏫" },
  residence: { label: "Résidence", icon: "🏠" },
  unknown:   { label: "Not sure",       icon: "❓" },
} as const;

export type ItemZone = keyof typeof ZONES;

// ── Where the finder left the item ───────────────────────────────────────────

export const WHERE_LEFT = {
  with_me:    { label: "Still with me",      icon: "🙋", formLabel: "I still have it" },
  admin:      { label: "Handed to admin",    icon: "🏢", formLabel: "Handed to admin / lost & found desk" },
  left_there: { label: "Left where found",   icon: "📍", formLabel: "Left it where I found it" },
} as const;

export type ItemWhereLeft = keyof typeof WHERE_LEFT;

// ── Derived lookups ──────────────────────────────────────────────────────────
// Every map and array below is generated. Do not hand-maintain any of them.

function labelsOf<T extends Record<string, { label: string }>>(
  source: T
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(source).map(([slug, v]) => [slug, v.label])
  );
}

function iconsOf<T extends Record<string, { icon: string }>>(
  source: T
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(source).map(([slug, v]) => [slug, v.icon])
  );
}

export const CATEGORY_LABELS = labelsOf(CATEGORIES);
export const CATEGORY_ICONS = iconsOf(CATEGORIES);
export const LOCATION_LABELS = labelsOf(LOCATIONS);
export const LOCATION_ICONS = iconsOf(LOCATIONS);
export const ZONE_LABELS = labelsOf(ZONES);
export const WHERE_LEFT_LABELS = labelsOf(WHERE_LEFT);

// Deliberately typed `string[]`, not the narrow unions. These exist to validate
// untrusted input — form state, request bodies, database rows written by an
// older client. Narrowing them would mean every caller had to cast the very
// value it is trying to check, which defeats the purpose. The unions above are
// where the type safety lives.
export const VALID_CATEGORIES: string[] = Object.keys(CATEGORIES);
export const VALID_LOCATIONS: string[] = Object.keys(LOCATIONS);
export const VALID_ZONES: string[] = Object.keys(ZONES);
export const VALID_WHERE_LEFT: string[] = Object.keys(WHERE_LEFT);

// `type` and `status` carry no labels or icons, so they are plain unions rather
// than records. They still mirror the item_type / item_status Postgres enums.
export type ItemType = "found" | "lost";
export type ItemStatus = "open" | "claimed";

export const VALID_TYPES: string[] = ["found", "lost"];
export const VALID_STATUSES: string[] = ["open", "claimed"];

// ── Option lists for form controls ───────────────────────────────────────────
// `label` carries the icon because the existing selects render a single string.

export const CATEGORY_OPTIONS = Object.entries(CATEGORIES).map(
  ([value, { label, icon }]) => ({ value, label: `${icon} ${label}` })
);

export const ZONE_OPTIONS = Object.entries(ZONES).map(
  ([value, { label, icon }]) => ({ value, label: `${icon} ${label}` })
);

export const WHERE_LEFT_OPTIONS = Object.entries(WHERE_LEFT).map(
  ([value, { formLabel, icon }]) => ({ value, label: `${icon} ${formLabel}` })
);

/**
 * Locations belonging to a zone, plus the free-text "other" escape hatch the
 * report form offers. `unknown` is excluded — it is the fallback the form
 * writes when nothing is picked, not something a user selects from a zone list.
 *
 * NOTE: the free-text `other` option writes raw strings to `items.location`,
 * which makes those items unfilterable. P3-5 resolves that; do not paper over
 * it here.
 */
export function locationsForZone(
  zone: ItemZone | null | undefined
): Array<{ value: string; label: string }> {
  const inZone = Object.entries(LOCATIONS).filter(
    ([slug, v]) => v.zone === zone && slug !== "unknown"
  );
  const source = inZone.length > 0 ? inZone : Object.entries(LOCATIONS);
  return [
    ...source.map(([value, { label, icon }]) => ({
      value,
      label: `${icon} ${label}`,
    })),
    { value: LOCATION_OTHER, label: `${CATEGORIES.other.icon} Other` },
  ];
}

/**
 * UI-only sentinel for the report form's "Other" spot, which reveals a
 * free-text input. Not a `LOCATIONS` key and never stored — the typed string is
 * written to `items.location` verbatim, which is exactly why those items are
 * unfilterable today. P3-5 decides whether to bucket or drop it.
 */
export const LOCATION_OTHER = "other";

/** Slugs valid for a zone, unlabelled — used by the admin modal. */
export function locationSlugsForZone(zone: string | null | undefined): string[] {
  const inZone = Object.entries(LOCATIONS)
    .filter(([slug, v]) => v.zone === zone && slug !== "unknown")
    .map(([slug]) => slug);
  return inZone.length > 0 ? inZone : Object.keys(LOCATIONS);
}

// ── Display helpers ──────────────────────────────────────────────────────────
// Unknown slugs fall through to the raw value rather than rendering blank:
// `items.location` can hold free text, and enums can gain values before the
// client that renders them is redeployed.

export function categoryLabel(slug: string): string {
  return CATEGORY_LABELS[slug] ?? slug;
}

export function categoryIcon(slug: string): string {
  return CATEGORY_ICONS[slug] ?? CATEGORIES.other.icon;
}

export function locationLabel(slug: string): string {
  return LOCATION_LABELS[slug] ?? slug;
}

export function whereLeftLabel(slug: string): string {
  return WHERE_LEFT_LABELS[slug] ?? slug;
}
