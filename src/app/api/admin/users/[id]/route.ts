import { createServiceClient } from "@/lib/supabase/server";
import { verifyAdmin } from "@/lib/supabase/admin-auth";
import { NextResponse, type NextRequest } from "next/server";

export const dynamic = "force-dynamic";

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
      return NextResponse.json({ error: "Missing user ID" }, { status: 400 });
    }

    const body = await request.json();
    const { banned } = body;

    if (typeof banned !== "boolean") {
      return NextResponse.json({ error: "banned must be a boolean" }, { status: 400 });
    }

    const supabase = createServiceClient();

    // Check if user exists
    const { data: existingUser, error: fetchError } = await supabase
      .from("users")
      .select("id")
      .eq("id", id)
      .single();

    if (fetchError || !existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { error: updateError } = await supabase
      .from("users")
      .update({ banned })
      .eq("id", id);

    if (updateError) {
      console.error("[admin/users PATCH]", updateError);
      return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[admin/users PATCH]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
