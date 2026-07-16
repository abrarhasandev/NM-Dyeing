// @ts-nocheck
import connectDB from "@/lib/db";
import User from "@/models/User";
import { NextResponse } from "next/server";
import { mirrorUserRemove } from "@/lib/orders/convexServer";
import { requireAdmin } from "@/lib/requireAuth";

export async function DELETE(request, { params }) {
  const _authResult = await requireAuth({ roles: ["admin", "user", "moderator"] });
  if (_authResult.error) return _authResult.error;

  const { error: __authError } = await requireAdmin();
  if (__authError) return __authError;

  try {
    await connectDB();
    const { id } = await params;

    const deletedAdmin = await User.findByIdAndDelete(id);
    if (!deletedAdmin) {
      return NextResponse.json({ message: "Admin not found" }, { status: 404 });
    }

    await mirrorUserRemove(String(deletedAdmin._id));

    return NextResponse.json({ message: "Admin deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error deleting admin:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
