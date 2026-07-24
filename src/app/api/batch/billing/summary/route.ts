// @ts-nocheck
import connectDB from "@/lib/db";
import BillingSummary from "@/models/BillingSummary";
import { mirrorBillingSummaryUpsert } from "@/lib/orders/convexServer";
import { requireAuth } from "@/lib/requireAuth";
import { getCustomerMongoId } from "@/lib/getCustomerMongoId";
import mongoose from "mongoose";

export async function POST(req) {
  const _authResult = await requireAuth({ roles: ["admin", "user", "moderator"] });
  if (_authResult.error) return _authResult.error;

  const { error: __authError } = await requireAuth();
  if (__authError) return __authError;

  await connectDB();

  try {
    const body = await req.json();

    // Ensure customerId is a valid Mongo ObjectId
    if (body.customerId) {
      const mongoIdStr = await getCustomerMongoId(body.customerId);
      if (mongoIdStr) {
        body.customerId = new mongoose.Types.ObjectId(mongoIdStr);
      } else {
        // If we can't resolve it, we can delete it so Mongoose doesn't crash on CastError, 
        // though it won't show in the ledger without a valid customerId.
        delete body.customerId;
      }
    }

    if (body.dyeingId && !mongoose.Types.ObjectId.isValid(body.dyeingId)) {
      delete body.dyeingId; // prevent CastError if it's a convex ID
    }
    
    if (body.calenderId && !mongoose.Types.ObjectId.isValid(body.calenderId)) {
      delete body.calenderId; // prevent CastError
    }

    const summary = await BillingSummary.create(body);
    await mirrorBillingSummaryUpsert(summary);

    return Response.json({ success: true, data: summary }, { status: 201 });
  } catch (error) {
    // 🔐 Duplicate key error 
    if (error.code === 11000) {
      return Response.json(
        { success: false, error: "Already saved" },
        { status: 409 }
      );
    }
    console.error(error);
    return Response.json(
      { success: false, error: "Failed to save billing summary" },
      { status: 500 }
    );
  }
}
