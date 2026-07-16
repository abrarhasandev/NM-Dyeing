// @ts-nocheck
import connectDB from "@/lib/db";
import BillingSummary from "@/models/BillingSummary";
import mongoose from "mongoose";
import { requireAuth } from "@/lib/requireAuth";

export async function GET(req, { params }) {
  const { error: __authError } = await requireAuth();
  if (__authError) return __authError;

  await connectDB();

  const { orderId } = await params;

  // orderId valid কিনা চেক
  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    return Response.json(
      { error: "Invalid orderId" },
      { status: 400 }
    );
  }

  try {
    const summaries = await BillingSummary.find({ orderId })
      .sort({ createdAt: -1 });

    return Response.json(
      {
        success: true,
        data: summaries,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Fetch billing summaries error:", error);
    return Response.json(
      { error: "Failed to fetch billing summaries" },
      { status: 500 }
    );
  }
}
