import connectDB from "@/lib/db";
import BillingSummary from "@/models/BillingSummary";
import { requireAuth } from "@/lib/requireAuth";


export async function GET(req, { params }) {
  const { error: __authError } = await requireAuth();
  if (__authError) return __authError;

  await connectDB();
  const { invoiceNumber } = await params;

  const rows = await BillingSummary.find({
    invoiceNumber,
  }).select("summaryType");

  const result = {};
  rows.forEach((r) => {
    result[r.summaryType] = true;
  });

  return Response.json(result);
}
