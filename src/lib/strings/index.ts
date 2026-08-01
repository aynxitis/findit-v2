import { en, type StringKey } from "./en";

export type { StringKey };
export { en };

/**
 * Look up a user-facing string by key.
 *
 * `key` is typed against the catalogue, so a typo or a deleted string is a
 * build error rather than a blank space on the page. That type safety is the
 * main reason this exists as a function instead of `en[key]` at call sites.
 *
 * Optional `{placeholder}` interpolation:
 *
 *     t("profile.empty.title", { type: "found" })
 *
 * No pluralisation, no date or number formatting, no locale negotiation. D1 is
 * answered English-only; if a second locale ever lands, it is another file with
 * the same keys and a swap here.
 */
export function t(
  key: StringKey,
  vars?: Record<string, string | number>
): string {
  const value: string = en[key];
  if (!vars) return value;

  return value.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in vars ? String(vars[name]) : match
  );
}
