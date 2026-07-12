import connectDB from "@/lib/db";
import ClothType from "@/models/menu/ClothType";
import mongoose from "mongoose";
import {
  mirrorClothTypeUpsert,
  mirrorClothTypeRemove,
} from "@/lib/orders/convexServer";
import { requireAuth, requireAdmin } from "@/lib/requireAuth";

export async function PUT(req, { params }) {
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

    const result = await ClothType.findByIdAndUpdate(id, { name }, { new: true });

    if (!result) {
      return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
    }

    await mirrorClothTypeUpsert(result);

    return new Response(JSON.stringify({ updated: true }), { status: 200 });
  } catch (error) {
    console.error("PUT error:", error);
    return new Response(JSON.stringify({ error: "Server error" }), { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  const { error: __authError } = await requireAdmin();
  if (__authError) return __authError;

  const { id } = params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return new Response(JSON.stringify({ error: "Invalid ID format" }), { status: 400 });
  }

  try {
    await connectDB();

    const result = await ClothType.findByIdAndDelete(id);

    if (!result) {
      return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
    }

    await mirrorClothTypeRemove(String(result._id));

    return new Response(JSON.stringify({ deleted: true }), { status: 200 });
  } catch (error) {
    console.error("DELETE error:", error);
    return new Response(JSON.stringify({ error: "Server error" }), { status: 500 });
  }
}

