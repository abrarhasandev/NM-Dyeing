import connectDB from "@/lib/db";
import Batch from "@/models/Batch";
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { mirrorBatchUpsert } from "@/lib/orders/convexServer";

export async function PUT(req, { params }) {
  try {
    await connectDB();
    const { batchId } = await params;

    if (!batchId || !mongoose.Types.ObjectId.isValid(batchId)) {
      return NextResponse.json({ error: "Invalid Batch ID" }, { status: 400 });
    }

    const updatedData = await req.json(); // Full batch data

    const batchDoc = await Batch.findOneAndUpdate(
      { "batches._id": batchId },
      { $set: { "batches.$": updatedData } },
      { new: true }
    );

    if (!batchDoc) {
      return NextResponse.json({ error: "Batch not found" }, { status: 404 });
    }

    await mirrorBatchUpsert(batchDoc);

    return NextResponse.json({ success: true, batchDoc });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
