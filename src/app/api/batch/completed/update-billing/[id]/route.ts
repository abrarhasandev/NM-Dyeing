// @ts-nocheck
import connectDB from "@/lib/db";
import BillingSummary from "@/models/BillingSummary";
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { requireAuth } from "@/lib/requireAuth";


export async function PUT(req, { params }) {
  const _authResult = await requireAuth({ roles: ["admin", "user", "moderator"] });
  if (_authResult.error) return _authResult.error;

  const { error: __authError } = await requireAuth();
  if (__authError) return __authError;

  await connectDB();

  try {
    const { id } = await params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid Batch ID" },
        { status: 400 }
      );
    }

    const body = await req.json();
    let { price, total } = body;

    // Convert to numbers
    price = Number(price);
    total = Number(total);

    // Validate numbers
    if (isNaN(price) && isNaN(total)) {
      return NextResponse.json(
        { error: "Either price or total must be a valid number" },
        { status: 400 }
      );
    }

    // Fetch the batch first to get totalQty
    const batch = await BillingSummary.findById(id);
    if (!batch) {
      return NextResponse.json({ error: "Batch not found" }, { status: 404 });
    }

    const totalQty = batch.totalQty;

    // Auto-calculate missing value
    if (!isNaN(price) && (total === undefined || total === null)) {
      total = price * totalQty;
    } else if (!isNaN(total) && (price === undefined || price === null)) {
      price = total / totalQty;
    }

    // Update batch
    batch.price = price;
    batch.total = total;

    await batch.save();

    return NextResponse.json(batch, { status: 200 });
  } catch (error) {
    console.error("PUT /update-billing error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update billing" },
      { status: 500 }
    );
  }
}
