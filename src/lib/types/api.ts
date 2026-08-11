export interface RateLimitResult {
  allowed: boolean;
  hourly_remaining: number;
  daily_remaining: number;
  reset_in_seconds: number | null;
}
