"use client";

import { useSearchParams } from "next/navigation";
import { t } from "@/lib/strings";

/**
 * Renders the rejection auth/callback redirects with. Nothing read this before,
 * so a student bounced for using a personal Google account landed on the
 * homepage with no explanation at all.
 *
 * The parameter is looked up in this table rather than printed. `?error=` is
 * attacker-supplied, and echoing it would let any URL put arbitrary text on the
 * homepage inside official-looking notice styling.
 */
const ERROR_MESSAGES: Record<string, string> = {
  domain: t("auth.notice.domain"),
  auth_callback_error: t("auth.notice.generic"),
};

export function AuthNotice() {
  const searchParams = useSearchParams();
  const code = searchParams.get("error");

  if (!code) return null;

  const message = ERROR_MESSAGES[code] ?? t("auth.notice.generic");

  return (
    <div
      className="relative z-5 max-w-[520px] mx-auto mt-6 px-6 mb-6 p-4 rounded-xl bg-red/10 border border-red/40 text-center"
      role="alert"
    >
      <span className="text-red font-semibold">{message}</span>
    </div>
  );
}
