import { categoryIcon, categoryLabel } from "@/lib/taxonomy";

/**
 * Composes notification text from the structured keys claim_item() and
 * unclaim_item() write into notifications.message.
 *
 * Migration 007 moved this out of Postgres: the RPCs used to concatenate
 * English inside plpgsql, carrying their own duplicate CASE blocks mapping
 * category slugs to labels and emoji — the 7th and 8th copies of the taxonomy,
 * and the reason renaming a label needed a database migration.
 *
 * Both forms are live in production right now: rows written since 007 hold a
 * bare key, and 7 older rows hold the original prose. Unrecognised values are
 * returned verbatim, which is what makes those old rows keep working without a
 * backfill.
 *
 * The sentences below are copied exactly from migration 005, the last version
 * that composed them in the database. Do not reword them here — that would
 * silently rewrite the history of every notification rendered.
 */

export const NOTIFICATION_KEYS = ["claim.found", "claim.lost", "claim.reopened"] as const;

export type NotificationKey = (typeof NOTIFICATION_KEYS)[number];

interface NotificationSource {
  message: string;
  category?: string | null;
}

function isKey(message: string): message is NotificationKey {
  return (NOTIFICATION_KEYS as readonly string[]).includes(message);
}

export function composeNotificationMessage({ message, category }: NotificationSource): string {
  if (!isKey(message)) {
    // Pre-007 prose, or anything unrecognised. Render as stored.
    return message;
  }

  const slug = category ?? "other";
  const icon = categoryIcon(slug);
  const label = categoryLabel(slug);

  switch (message) {
    case "claim.found":
      return `${icon} Someone thinks your ${label} is theirs and wants to claim it.`;
    case "claim.lost":
      return `${icon} Someone found your ${label} and reached out!`;
    case "claim.reopened":
      return `${icon} The poster reopened the ${label} listing — your claim was cancelled.`;
  }
}
