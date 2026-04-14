export const CATEGORY_LABELS: Record<string, string> = {
  keys: "Keys",
  card: "Card / ID",
  phone: "Phone",
  bag: "Bag",
  clothing: "Clothing",
  electronics: "Electronics",
  other: "Other",
};

export const CATEGORY_ICONS: Record<string, string> = {
  keys: "\uD83D\uDD11",
  card: "\uD83E\uDEAA",
  phone: "\uD83D\uDCF1",
  bag: "\uD83C\uDF92",
  clothing: "\uD83D\uDC55",
  electronics: "\uD83D\uDCBB",
  other: "\uD83D\uDCE6",
};

export const LOCATION_LABELS: Record<string, string> = {
  library: "Library",
  foyer: "Foyer (\u00E9cole)",
  td_halls: "TD Halls",
  tp_halls: "TP Halls",
  restau: "Restau",
  res_foyer: "Foyer (r\u00E9sidence)",
  unknown: "Not sure",
};

export const WHERE_LEFT_LABELS: Record<string, string> = {
  with_me: "Still with me",
  admin: "Handed to admin",
  left_there: "Left where found",
};

export const SPOT_OPTIONS = {
  school: [
    { value: "library", label: "\uD83D\uDCDA Library" },
    { value: "foyer", label: "\uD83E\uDE91 Foyer" },
    { value: "td_halls", label: "\uD83D\uDEAA TD Halls" },
    { value: "tp_halls", label: "\uD83D\uDD2C TP Halls" },
    { value: "other", label: "\uD83D\uDCE6 Other" },
  ],
  residence: [
    { value: "restau", label: "\uD83C\uDF7D\uFE0F Restau" },
    { value: "res_foyer", label: "\uD83E\uDE91 Foyer" },
    { value: "other", label: "\uD83D\uDCE6 Other" },
  ],
} as const;

export const CATEGORIES = [
  { value: "keys", label: "\uD83D\uDD11 Keys" },
  { value: "card", label: "\uD83E\uDEAA Card / ID" },
  { value: "phone", label: "\uD83D\uDCF1 Phone" },
  { value: "bag", label: "\uD83C\uDF92 Bag" },
  { value: "clothing", label: "\uD83D\uDC55 Clothing" },
  { value: "electronics", label: "\uD83D\uDCBB Electronics" },
  { value: "other", label: "\uD83D\uDCE6 Other" },
] as const;

export const ZONES = [
  { value: "school", label: "\uD83C\uDFEB \u00C9cole" },
  { value: "residence", label: "\uD83C\uDFE0 R\u00E9sidence" },
  { value: "unknown", label: "\u2753 Not sure" },
] as const;

export const WHERE_LEFT_OPTIONS = [
  { value: "with_me", label: "\uD83D\uDE4B I still have it" },
  { value: "admin", label: "\uD83C\uDFE2 Handed to admin / lost & found desk" },
  { value: "left_there", label: "\uD83D\uDCCD Left it where I found it" },
] as const;

export const VALID_TYPES = ["found", "lost"];
export const VALID_STATUSES = ["open", "claimed"];
export const VALID_CATEGORIES = ["keys", "card", "phone", "bag", "clothing", "electronics", "other"];
export const VALID_LOCATIONS = ["library", "foyer", "td_halls", "tp_halls", "restau", "res_foyer", "unknown"];
export const VALID_ZONES = ["school", "residence", "unknown"];
export const VALID_WHERE_LEFT = ["with_me", "admin", "left_there"];
