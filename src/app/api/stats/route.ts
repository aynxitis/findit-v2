import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = createServiceClient();

    // `reunions` counts both terminal statuses. It is an outcome figure, not a
    // mechanism one: an item another student claimed is reunited, and so is one
    // the poster closed themselves. Counting 'claimed' alone made this public
    // number fall whenever a poster resolved their own listing.
    const [totalResult, reunitedResult] = await Promise.all([
      supabase.from("items").select("*", { count: "exact", head: true }),
      supabase
        .from("items")
        .select("*", { count: "exact", head: true })
        .in("status", ["claimed", "resolved"]),
    ]);

    return NextResponse.json(
      {
        posted: totalResult.count ?? 0,
        reunions: reunitedResult.count ?? 0,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch {
    return NextResponse.json(
      { posted: 0, reunions: 0, error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
