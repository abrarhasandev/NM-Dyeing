import connectDB from "@/lib/db";
import BillingSummary from "@/models/BillingSummary";


export async function GET(req, { params }) {
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
