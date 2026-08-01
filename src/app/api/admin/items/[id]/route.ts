import { createServiceClient } from "@/lib/supabase/server";
import { verifyAdmin } from "@/lib/supabase/admin-auth";
import { itemStoragePath, PHOTO_BUCKET } from "@/lib/photos";
import {
  VALID_TYPES,
  VALID_STATUSES,
  VALID_CATEGORIES,
  VALID_ZONES,
  VALID_WHERE_LEFT,
} from "@/lib/taxonomy";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

const adminUpdateItemSchema = z.object({
  type: z.enum(VALID_TYPES as [string, ...string[]]).optional(),
  category: z.enum(VALID_CATEGORIES as [string, ...string[]]).optional(),
  location: z.string().min(1).max(100).optional(),
  zone: z.enum(VALID_ZONES as [string, ...string[]]).nullable().optional(),
  where_left: z.enum(VALID_WHERE_LEFT as [string, ...string[]]).nullable().optional(),
  description: z.string().max(500).nullable().optional(),
  photo_url: z.string().url().max(500).nullable().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  status: z.enum(VALID_STATUSES as [string, ...string[]]).optional(),
  user_id: z.string().min(1).max(128).optional(),
  user_name: z.string().max(100).nullable().optional(),
  user_email: z.string().email().max(200).nullable().optional(),
}).strict();

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 });
    }

    const adminResult = await verifyAdmin(token);
    if (!adminResult.isAdmin) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Missing item ID" }, { status: 400 });
    }

    const body = await request.json();
    const result = adminUpdateItemSchema.safeParse(body);
    if (!result.success) {
      const firstError = result.error.issues[0];
      return NextResponse.json(
        { error: `Invalid field "${firstError.path.join(".")}": ${firstError.message}` },
        { status: 400 }
      );
    }

    const sanitized = result.data;
    if (Object.keys(sanitized).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const supabase = createServiceClient();

    const { error: updateError, count } = await supabase
      .from("items")
      .update(sanitized)
      .eq("id", id);

    if (updateError) {
      console.error("[admin/items PATCH]", updateError);
      return NextResponse.json({ error: "Failed to update item" }, { status: 500 });
    }

    if (count === 0) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[admin/items PATCH]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 });
    }

    const adminResult = await verifyAdmin(token);
    if (!adminResult.isAdmin) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Missing item ID" }, { status: 400 });
    }

    const supabase = createServiceClient();

    // Fetch item first to get photo_url for storage cleanup
    const { data: item } = await supabase
      .from("items")
      .select("photo_url,photo_path")
      .eq("id", id)
      .single();

    // Clean up photo from storage if present
    const storagePath = item ? itemStoragePath(item) : null;
    if (storagePath) {
      await supabase.storage
        .from(PHOTO_BUCKET)
        .remove([storagePath])
        .catch((err: unknown) => console.warn("[admin/items DELETE] storage cleanup failed:", err));
    }

    const { error: deleteError } = await supabase
      .from("items")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("[admin/items DELETE]", deleteError);
      return NextResponse.json({ error: "Failed to delete item" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[admin/items DELETE]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
