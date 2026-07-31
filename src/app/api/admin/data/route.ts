import { createServiceClient } from "@/lib/supabase/server";
import { verifyAdmin } from "@/lib/supabase/admin-auth";
import { NextResponse, type NextRequest } from "next/server";
import type { Item, User } from "@/lib/types/item";

export const dynamic = "force-dynamic";

const ROW_LIMIT = 200;

/**
 * Admin dashboard read path.
 *
 * The admin UI used to read `items` and `users` straight from the browser with
 * the anon key, which only worked because the blanket "any authenticated user
 * can read everything" policies were in place. Migration 004 removed those, so
 * these reads run server-side with the service role behind an admin check.
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
        .limit(ROW_LIMIT),
      supabase
        .from("users")
        .select("*")
        .order("joined_at", { ascending: false })
        .limit(ROW_LIMIT),
    ]);

    if (itemsResult.error || usersResult.error) {
      console.error("[admin/data GET]", itemsResult.error ?? usersResult.error);
      return NextResponse.json({ error: "Failed to load data" }, { status: 500 });
    }

    return NextResponse.json(
      {
        items: (itemsResult.data ?? []) as Item[],
        users: (usersResult.data ?? []) as User[],
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err) {
    console.error("[admin/data GET]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
