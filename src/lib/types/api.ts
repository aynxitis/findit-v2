export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface StatsResponse {
  posted: number;
  reunions: number;
}

export interface RateLimitResult {
  allowed: boolean;
  hourly_remaining: number;
  daily_remaining: number;
  reset_in_seconds: number | null;
}

export interface ClaimResult {
  success: boolean;
  error?: string;
  poster_email?: string;
  poster_name?: string;
}

export interface AdminVerifyResponse {
  isAdmin: boolean;
  email?: string;
}
