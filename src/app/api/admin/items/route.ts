import { createServiceClient } from "@/lib/supabase/server";
import { verifyAdmin } from "@/lib/supabase/admin-auth";
import {
  VALID_TYPES,
  VALID_STATUSES,
  VALID_CATEGORIES,
  VALID_ZONES,
  VALID_WHERE_LEFT,
} from "@/lib/constants/labels";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

const adminCreateItemSchema = z.object({
  type: z.enum(VALID_TYPES as [string, ...string[]]),
  category: z.enum(VALID_CATEGORIES as [string, ...string[]]),
  location: z.string().min(1).max(100),
  zone: z.enum(VALID_ZONES as [string, ...string[]]).nullable().optional(),
  where_left: z.enum(VALID_WHERE_LEFT as [string, ...string[]]).nullable().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  status: z.enum(VALID_STATUSES as [string, ...string[]]),
  user_id: z.string().min(1).max(128),
  user_name: z.string().max(100).nullable().optional(),
  user_email: z.string().email().max(200).nullable().optional(),
  description: z.string().max(400).nullable().optional(),
  photo_url: z.string().url().max(500).nullable().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 });
    }

    const adminResult = await verifyAdmin(token);
    if (!adminResult.isAdmin) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const body = await request.json();
    const result = adminCreateItemSchema.safeParse(body);
    if (!result.success) {
      const firstError = result.error.issues[0];
      return NextResponse.json(
        { error: `Invalid field "${firstError.path.join(".")}": ${firstError.message}` },
        { status: 400 }
      );
    }

    const data = result.data;
    const supabase = createServiceClient();

    const { data: inserted, error: insertError } = await supabase
      .from("items")
      .insert({
        type: data.type,
        category: data.category,
        location: data.location,
        zone: data.zone ?? null,
        where_left: data.type === "found" ? (data.where_left ?? null) : null,
        description: data.description ?? null,
        photo_url: data.photo_url ?? null,
        date: data.date,
        status: data.status,
        user_id: data.user_id,
        user_name: data.user_name ?? null,
        user_email: data.user_email ?? null,
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("[admin/items POST]", insertError);
      return NextResponse.json({ error: "Failed to create item" }, { status: 500 });
    }

    return NextResponse.json({ id: inserted.id }, { status: 201 });
  } catch (err) {
    console.error("[admin/items POST]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
