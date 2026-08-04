import { createServiceClient } from "@/lib/supabase/server";
import { verifyAdmin } from "@/lib/supabase/admin-auth";
import { NextResponse, type NextRequest } from "next/server";

export const dynamic = "force-dynamic";

const LIMIT = 200;

/**
 * Admin read of items and users.
 *
 * Migration 004 dropped the table-level SELECT grant on public.items and
 * narrowed users_select to the caller's own row, so the browser anon client
 * cannot serve either table to the admin screens any more. Both reads run
 * here with the service role, behind the same verifyAdmin gate the admin
 * writes already use.
 */
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 });
    }

    const adminResult = await verifyAdmin(token);
    if (!adminResult.isAdmin) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const supabase = createServiceClient();

    const [itemsResult, usersResult] = await Promise.all([
      supabase
        .from("items")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(LIMIT),
      supabase.from("users").select("*").limit(LIMIT),
    ]);

    if (itemsResult.error || usersResult.error) {
      console.error("[admin/overview GET]", itemsResult.error ?? usersResult.error);
      return NextResponse.json({ error: "Failed to load admin data" }, { status: 500 });
    }

    return NextResponse.json(
      { items: itemsResult.data ?? [], users: usersResult.data ?? [] },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err) {
    console.error("[admin/overview GET]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
