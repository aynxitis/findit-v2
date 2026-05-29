import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = createServiceClient();

    const [totalResult, claimedResult] = await Promise.all([
      supabase.from("items").select("*", { count: "exact", head: true }),
      supabase
        .from("items")
        .select("*", { count: "exact", head: true })
        .eq("status", "claimed"),
    ]);

    return NextResponse.json(
      {
        posted: totalResult.count ?? 0,
        reunions: claimedResult.count ?? 0,
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
