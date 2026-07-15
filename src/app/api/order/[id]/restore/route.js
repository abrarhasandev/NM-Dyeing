import connectDB from "@/lib/db";
import Order from "@/models/Order";
import mongoose from "mongoose";
import { mirrorOrderRestore } from "@/lib/orders/convexServer";
import { requireAuth } from "@/lib/requireAuth";

export async function PATCH(request, { params }) {
  const _authResult = await requireAuth({ roles: ["admin", "user", "moderator"] });
  if (_authResult.error) return _authResult.error;

  const { error: __authError } = await requireAuth();
  if (__authError) return __authError;

  try {
    await connectDB();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return new Response(JSON.stringify({ error: "Invalid ID format" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const order = await Order.findByIdAndUpdate(
      id,
      { isTrash: false },
      { new: true }
    );

    if (!order) {
      return new Response(JSON.stringify({ error: "Order not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    await mirrorOrderRestore(id);

    return new Response(
      JSON.stringify({ message: "Order restored successfully", order }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("PATCH Restore Error:", error);
    return new Response(JSON.stringify({ error: "Server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
