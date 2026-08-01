export function toTitleCase(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatTimestamp(isoStr: string | null): string {
  if (!isoStr) return "\u2014";
  return new Date(isoStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function timeAgo(isoStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(isoStr).getTime()) / 1000);

  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return formatTimestamp(isoStr);
}

/**
 * Render an item reference as `#0142` — zero-padded to four digits, per §2.
 *
 * Four digits is a deliberate ceiling on how long the number stays sayable:
 * at ~26 items a year it will not reach five for a very long time, and refs
 * past 9999 simply render wider rather than breaking.
 *
 * Always pair with a monospace class. The padding only reads as a reference
 * number if the digits align.
 */
export function formatRef(ref: number | null | undefined): string {
  if (ref === null || ref === undefined) return "";
  return `#${String(ref).padStart(4, "0")}`;
}
