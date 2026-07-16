// @ts-nocheck
import connectDB from "@/lib/db";
import Batch from "@/models/Batch";
import Invoice from "@/models/Invoice";
import { NextResponse } from "next/server";
import {
  mirrorBatchUpsert,
  mirrorInvoiceRemove,
} from "@/lib/orders/convexServer";
import { requireAdmin } from "@/lib/requireAuth";

export async function DELETE(req, { params }) {
  const _authResult = await requireAuth({ roles: ["admin", "user", "moderator"] });
  if (_authResult.error) return _authResult.error;

  const { error: __authError } = await requireAdmin();
  if (__authError) return __authError;

  try {
    await connectDB();
    const { invoiceNumber } = await params;

    if (!invoiceNumber) {
      return NextResponse.json(
        { error: "Invoice number is required" },
        { status: 400 }
      );
    }

    // 🧾 Find the invoice
    const invoice = await Invoice.findOne({ invoiceNumber });
    if (!invoice) {
      return NextResponse.json(
        { error: "Invoice not found" },
        { status: 404 }
      );
    }

    // 🔹 Find related Batch doc
    const batchDoc = await Batch.findOne({ orderId: invoice.orderId });
    if (!batchDoc) {
      return NextResponse.json(
        { error: "Batch record not found" },
        { status: 404 }
      );
    }

    // ✅ For each batch that was moved to billing, revert status to "Delivered"
    const updatedBatches = batchDoc.batches.map((b) => {
      if (invoice.batchIds.some((id) => id.toString() === b._id.toString())) {
        return {
          ...b.toObject(),
          status: "delivered", 
          updatedAt: new Date(),
        };
      }
      return b;
    });

    batchDoc.batches = updatedBatches;
    await batchDoc.save();
    await mirrorBatchUpsert(batchDoc);

    // 🗑️ Delete the invoice from database
    const invoiceMongoId = invoice._id?.toString?.() || String(invoice._id);
    await Invoice.deleteOne({ invoiceNumber });
    await mirrorInvoiceRemove(invoiceMongoId);

    return NextResponse.json({
      success: true,
      message: "Invoice deleted and batches reverted to Delivered.",
    });
  } catch (err) {
    console.error("Invoice Delete Error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
