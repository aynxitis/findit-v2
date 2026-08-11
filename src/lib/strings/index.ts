import { en, type StringKey } from "./en";

export { en };
export type { StringKey };

/**
 * Look up a user-facing string.
 *
 * Deliberately not an i18n library: one locale, no plural rules, no runtime
 * negotiation. The key type is derived from the catalogue, so a typo or a
 * deleted entry is a build error rather than a blank space on the page.
 */
export function t(key: StringKey): string {
  return en[key];
}
