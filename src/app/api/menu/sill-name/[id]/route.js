// PUT and DELETE handlers
import connectDB from "@/lib/db";
import SillName from "@/models/menu/SillName";
import mongoose from "mongoose";
import {
  mirrorSillNameUpsert,
  mirrorSillNameRemove,
} from "@/lib/orders/convexServer";
import { requireAuth, requireAdmin } from "@/lib/requireAuth";

export async function PUT(req, { params }) {
  const _authResult = await requireAuth({ roles: ["admin", "user", "moderator"] });
  if (_authResult.error) return _authResult.error;

  const { error: __authError } = await requireAuth();
  if (__authError) return __authError;

  const { id } = params;
  const { name } = await req.json();

  if (!name) {
    return new Response(JSON.stringify({ error: "Name required" }), { status: 400 });
  }

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return new Response(JSON.stringify({ error: "Invalid ID format" }), { status: 400 });
  }

  try {
    await connectDB();

    const result = await SillName.findByIdAndUpdate(id, { name: name.trim() }, { new: true });

    if (!result) {
      return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
    }

    await mirrorSillNameUpsert(result);

    return new Response(JSON.stringify({ updated: true }), { status: 200 });
  } catch (error) {
    console.error("PUT error:", error);
    return new Response(JSON.stringify({ error: "Server error" }), { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  const _authResult = await requireAuth({ roles: ["admin", "user", "moderator"] });
  if (_authResult.error) return _authResult.error;

  const { error: __authError } = await requireAdmin();
  if (__authError) return __authError;

  const { id } = params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return new Response(JSON.stringify({ error: "Invalid ID format" }), { status: 400 });
  }

  try {
    await connectDB();

    const result = await SillName.findByIdAndDelete(id);

    if (!result) {
      return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
    }

    await mirrorSillNameRemove(String(result._id));

    return new Response(JSON.stringify({ deleted: true }), { status: 200 });
  } catch (error) {
    console.error("DELETE error:", error);
    return new Response(JSON.stringify({ error: "Server error" }), { status: 500 });
  }
}
