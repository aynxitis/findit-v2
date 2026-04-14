import { createClient } from "@/lib/supabase/client";
import type { RateLimitResult } from "@/lib/types/api";

/**
 * Check if user can create a new post based on rate limiting.
 * Calls the Postgres RPC `check_post_rate_limit` function.
 * Limits: 3 posts per hour, 10 posts per day.
 */
export async function checkPostRateLimit(userId: string): Promise<RateLimitResult> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc("check_post_rate_limit", {
    p_user_id: userId,
  });

  if (error || !data) {
    // Default to allowed if rate limit check fails (fail-open for UX)
    return {
      allowed: true,
      hourly_remaining: 3,
      daily_remaining: 10,
      reset_in_seconds: null,
    };
  }

  return data as RateLimitResult;
}
