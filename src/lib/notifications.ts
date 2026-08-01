import { categoryIcon, categoryLabel } from "@/lib/taxonomy";
import type { Notification } from "@/lib/types/item";

/**
 * Notification copy, composed on the client.
 *
 * `claim_item` and `unclaim_item` used to build these strings inside Postgres,
 * with their own duplicate `CASE` blocks mapping category slugs to labels and
 * emoji. That put user-facing English in a `.sql` file, duplicated the taxonomy
 * an eighth time, and meant changing a category label required a migration.
 *
 * The RPCs now write a stable key into `notifications.message` and the client
 * renders it from the row's `category` and `item_type` columns.
 *
 * `message` is `NOT NULL`, so a key is stored rather than nothing at all.
 */
export const NOTIFICATION_KEYS = {
  claimFound: "claim.found",
  claimLost: "claim.lost",
  unclaim: "claim.reopened",
} as const;

export function renderNotification(
  notif: Pick<Notification, "message" | "category">
): string {
  const slug = notif.category ?? "other";
  const icon = categoryIcon(slug);
  const label = categoryLabel(slug);

  switch (notif.message) {
    case NOTIFICATION_KEYS.claimFound:
      return `${icon} Someone thinks your ${label} is theirs and wants to claim it.`;
    case NOTIFICATION_KEYS.claimLost:
      return `${icon} Someone found your ${label} and reached out!`;
    case NOTIFICATION_KEYS.unclaim:
      return `${icon} The poster reopened the ${label} listing — your claim was cancelled.`;
    default:
      // Rows written before this change hold fully composed prose. Render it
      // as-is rather than showing a key to the user.
      return notif.message || "Someone interacted with your post.";
  }
}
