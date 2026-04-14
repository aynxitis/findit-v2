import "server-only";

import { createServiceClient } from "./server";

const ADMIN_EMAILS: string[] = (process.env.ADMIN_EMAILS || "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export interface AdminVerifyResult {
  isAdmin: boolean;
  email?: string;
}

/**
 * Verify if a Supabase access token belongs to an admin user.
 * Uses the service role client to validate the JWT.
 */
export async function verifyAdmin(token: string): Promise<AdminVerifyResult> {
  const supabase = createServiceClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user || !user.email) {
    return { isAdmin: false };
  }

  const isAdmin = ADMIN_EMAILS.includes(user.email.toLowerCase());

  return {
    isAdmin,
    email: user.email,
  };
}
