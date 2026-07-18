// @ts-nocheck
import connectDB from "@/lib/db";
import Order from "@/models/Order";
import mongoose from "mongoose";
import {
  mirrorOrderUpsert,
  mirrorOrderPatchStatus,
  mirrorOrderTrash,
  mirrorOrderRemove,
} from "@/lib/orders/convexServer";
import { requireAuth, requireAdmin } from "@/lib/requireAuth";

export async function GET(request, { params }) {
  const { error: __authError } = await requireAuth();
  if (__authError) return __authError;

  try {
    const { id } = await params;
    
    // Use Convex fetchQuery instead of MongoDB
    const { fetchQuery } = require("convex/nextjs");
    const { api } = require("../../../../../convex/_generated/api");

    const order = await fetchQuery(api.orderQueries.getOrderById, { id });

    if (!order) {
      return new Response(JSON.stringify({ error: "Order not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(order), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: "Server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function DELETE(request, { params }) {
  const _authResult = await requireAuth({ roles: ["admin", "user", "moderator"] });
  if (_authResult.error) return _authResult.error;

  const { error: __authError } = await requireAdmin();
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

    const order = await Order.findById(id);

    if (!order) {
      return new Response(JSON.stringify({ error: "Order not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { searchParams } = new URL(request.url);
    const isPermanent = searchParams.get("permanent") === "true";

    if (isPermanent) {
      await Order.deleteOne({ _id: id });
      await mirrorOrderRemove(id);
    } else {
      await Order.findByIdAndUpdate(id, { isTrash: true });
      await mirrorOrderTrash(id);
    }

    return new Response(
      JSON.stringify({ message: "Order deleted successfully" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: "Server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function PUT(request, { params }) {
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
      });
    }

    const body = await request.json();

    // ── Mass-assignment protection — only allow known editable fields ────────
    const ALLOWED_FIELDS = [
      "companyName", "orderNo", "chalanNo", "date", "clotheType",
      "finishingType", "colour", "sillName", "quality", "process",
      "totalGoj", "tableData", "remark", "status", "transporterName",
    ];

    const safeUpdate = {};
    for (const key of ALLOWED_FIELDS) {
      if (key in body) safeUpdate[key] = body[key];
    }

    if (safeUpdate.tableData && Array.isArray(safeUpdate.tableData)) {
      safeUpdate.tableData = safeUpdate.tableData.map((row, index) => ({
        ...row,
        rollNo: index + 1,
      }));
    }

    // Parse incoming date string robustly like POST does
    if (safeUpdate.date && typeof safeUpdate.date === "string") {
      if (safeUpdate.date.includes("/")) {
        const [d, m, y] = safeUpdate.date.split("/").map(Number);
        if (d && m && y) {
          safeUpdate.date = new Date(Date.UTC(y, m - 1, d));
        }
      } else {
        const parsed = new Date(safeUpdate.date);
        if (!isNaN(parsed)) safeUpdate.date = parsed;
      }
    }

    const order = await Order.findById(id);
    if (!order) {
      return new Response(JSON.stringify({ error: "Order not found" }), {
        status: 404,
      });
    }

    Object.assign(order, safeUpdate);
    await order.save();
    await mirrorOrderUpsert(order.toObject ? order.toObject() : order);

    return new Response(
      JSON.stringify({ message: "Order updated successfully", order }),
      { status: 200 }
    );
  } catch (error) {
    console.error("PUT Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
}



// ⬇️ শুধু status update করার জন্য PATCH method
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
      });
    }

    let { status } = await request.json();

    if (!status) {
      return new Response(JSON.stringify({ error: "Status is required" }), {
        status: 400,
      });
    }

    // small letter এ convert করে save হবে
    status = status.toLowerCase();

    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!updatedOrder) {
      return new Response(JSON.stringify({ error: "Order not found" }), {
        status: 404,
      });
    }

    await mirrorOrderPatchStatus(id, status);

    return new Response(
      JSON.stringify({
        message: "Order status updated successfully",
        order: updatedOrder,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("PATCH Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
}
