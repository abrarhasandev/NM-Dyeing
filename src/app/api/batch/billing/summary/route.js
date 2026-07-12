import connectDB from "@/lib/db";
import BillingSummary from "@/models/BillingSummary";
import { mirrorBillingSummaryUpsert } from "@/lib/orders/convexServer";
import { requireAuth } from "@/lib/requireAuth";

export async function POST(req) {
  const { error: __authError } = await requireAuth();
  if (__authError) return __authError;

  await connectDB();

  try {
    const body = await req.json();

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
