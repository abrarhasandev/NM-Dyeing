// @ts-nocheck
import connectDB from "@/lib/db";
import Batch from "@/models/Batch";
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { mirrorBatchUpsert } from "@/lib/orders/convexServer";
import { requireAuth } from "@/lib/requireAuth";


export async function GET(req, { params }) {
  const { error: __authError } = await requireAuth();
  if (__authError) return __authError;

  await connectDB();

  try {
    const { batchId } = await params;

    if (!batchId || !mongoose.Types.ObjectId.isValid(batchId)) {
      return NextResponse.json({ error: "Invalid Batch ID format" }, { status: 400 });
    }

    const batchDoc = await Batch.findOne({ "batches._id": batchId });

    if (!batchDoc)
      return NextResponse.json({ error: "Batch not found" }, { status: 404 });

    const batch = batchDoc.batches.id(batchId);

    return NextResponse.json({ batch });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Server error while fetching batch" },
      { status: 500 }
    );
  }
}




export async function PUT(req, { params }) {
  const _authResult = await requireAuth({ roles: ["admin", "user", "moderator"] });
  if (_authResult.error) return _authResult.error;

  const { error: __authError } = await requireAuth();
  if (__authError) return __authError;

  await connectDB();

  try {
    const { batchId } = await params;

    if (!batchId || !mongoose.Types.ObjectId.isValid(batchId)) {
      return NextResponse.json({ error: "Invalid Batch ID format" }, { status: 400 });
    }

    const body = await req.json();

    const { updatedRows } = body;

    const batchDoc = await Batch.findOne({ "batches._id": batchId });

    if (!batchDoc)
      return NextResponse.json({ error: "Batch not found" }, { status: 404 });

    const batch = batchDoc.batches.id(batchId);

    batch.rows = updatedRows;

    await batchDoc.save();
    await mirrorBatchUpsert(batchDoc);

    return NextResponse.json({
      message: "Batch updated successfully",
      batch,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Error updating batch" },
      { status: 500 }
    );
  }
}
