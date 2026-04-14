import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/supabase/admin-auth";

// Simple in-memory rate limiting.
// Note: Vercel serverless instances are ephemeral, so this is best-effort;
// a persistent in-instance Map is acceptable for burst protection.
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAP_MAX_SIZE = 10_000;

function pruneExpired(now: number): void {
  for (const [key, entry] of rateLimitMap) {
    if (now > entry.resetTime) rateLimitMap.delete(key);
  }
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetTime) {
    // Defensive cleanup — prevents unbounded growth on a long-lived instance.
    if (rateLimitMap.size >= RATE_LIMIT_MAP_MAX_SIZE) pruneExpired(now);
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return false;
  }

  entry.count++;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";

    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { isAdmin: false, error: "Too many requests" },
        { status: 429 }
      );
    }

    // Extract token
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json(
        { isAdmin: false, error: "No token provided" },
        { status: 401 }
      );
    }

    const result = await verifyAdmin(token);

    if (!result.isAdmin) {
      return NextResponse.json({ isAdmin: false }, { status: 403 });
    }

    return NextResponse.json({
      isAdmin: true,
      email: result.email,
    });
  } catch {
    return NextResponse.json(
      { isAdmin: false, error: "Verification failed" },
      { status: 500 }
    );
  }
}
