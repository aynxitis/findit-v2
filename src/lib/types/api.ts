/**
 * Shapes returned by RPCs and route handlers.
 *
 * `ApiResponse`, `StatsResponse`, `ClaimResult` and `AdminVerifyResponse` were
 * removed in P1-4 — all four were exported and never imported anywhere. The
 * call sites they were meant to describe declare their shapes inline, which is
 * how they drifted out of use without anyone noticing.
 */

export interface RateLimitResult {
  allowed: boolean;
  hourly_remaining: number;
  daily_remaining: number;
  reset_in_seconds: number | null;
}
