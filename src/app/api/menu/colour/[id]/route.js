// app/api/menu/colour/[id]/route.js

import connectDB from "@/lib/db";
import Colour from "@/models/menu/Colour";
import {
  mirrorColourUpsert,
  mirrorColourRemove,
} from "@/lib/orders/convexServer";
import { requireAuth, requireAdmin } from "@/lib/requireAuth";

export async function PUT(req, { params }) {
  const _authResult = await requireAuth({ roles: ["admin", "user", "moderator"] });
  if (_authResult.error) return _authResult.error;

  const { error: __authError } = await requireAuth();
  if (__authError) return __authError;

  try {
    await connectDB();
    const { id } = params;
    const { name } = await req.json();

    if (!name || !name.trim()) {
      return new Response(JSON.stringify({ error: "Name is required" }), { status: 400 });
    }

    const updated = await Colour.findByIdAndUpdate(
      id,
      { name: name.trim() },
      { new: true }
    );

    if (!updated) {
      return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
    }

    await mirrorColourUpsert(updated);

    return new Response(JSON.stringify(updated), { status: 200 });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: "Server Error" }), { status: 500 });
  }
}

export async function DELETE(_, { params }) {
  const _authResult = await requireAuth({ roles: ["admin", "user", "moderator"] });
  if (_authResult.error) return _authResult.error;

  const { error: __authError } = await requireAdmin();
  if (__authError) return __authError;

  try {
    await connectDB();
    const { id } = params;

    const deleted = await Colour.findByIdAndDelete(id);

    if (!deleted) {
      return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
    }

    await mirrorColourRemove(String(deleted._id));

    return new Response(JSON.stringify({ message: "Deleted" }), { status: 200 });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: "Server Error" }), { status: 500 });
  }
}
