// @ts-nocheck
import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import BillingSummary from "@/models/BillingSummary";
import Payment from "@/models/Payment";
import customers from "@/models/customers";
import LedgerSnapshot from "@/models/LedgerSnapshot";
import SavedInvoice from "@/models/SavedInvoice";
import mongoose from "mongoose";
import { requireAuth } from "@/lib/requireAuth";
import { getCustomerMongoId, getCustomerDoc } from "@/lib/getCustomerMongoId";

export async function GET(req, props) {
  const params = await props.params;
  const { error: __authError } = await requireAuth();
  if (__authError) return __authError;

  try {
    await connectDB();
    const resolvedParams = await params;
    const { customerId } = resolvedParams;

    const mongoIdStr = await getCustomerMongoId(customerId);
    if (!mongoIdStr) {
      return NextResponse.json({ success: false, message: "Invalid ID" }, { status: 400 });
    }

    const objId = new mongoose.Types.ObjectId(mongoIdStr);

    // Latest snapshot — records AFTER this date belong to current (open) period
    const latestSnapshot = await LedgerSnapshot.findOne(
      { entityId: objId, entityType: "customer" },
      { closedAt: 1 }
    ).sort({ closedAt: -1 });

    const fromDate = latestSnapshot ? latestSnapshot.closedAt : new Date(0);

    const [customer, billings, payments] = await Promise.all([
      customers.findById(objId),
      BillingSummary.find({ customerId: objId, createdAt: { $gt: fromDate } }).sort({ createdAt: 1 }),
      Payment.find({ userId: objId, createdAt: { $gt: fromDate } }).sort({ date: 1 }),
    ]);

    let finalCustomer = customer;
    if (!finalCustomer) {
      finalCustomer = await getCustomerDoc(customerId);
    }

    if (!finalCustomer) {
      return NextResponse.json({ success: false, message: "Customer not found" }, { status: 404 });
    }

    const savedInvoices = await SavedInvoice.find({ entityId: objId, entityType: "customer" });
    const savedRecordIds = [];
    savedInvoices.forEach(inv => {
      inv.records.forEach(rec => { if (rec.recordId) savedRecordIds.push(rec.recordId.toString()); });
    });

    return NextResponse.json({
      success: true,
      data: {
        customer: finalCustomer,
        billings,
        payments,
        openingBalance: latestSnapshot ? latestSnapshot.finalBalance : 0,
        initialCharge: finalCustomer.initialCharge ?? 0,
        initialPayment: finalCustomer.initialPayment ?? 0,
        initialDate: finalCustomer.initialDate ?? null,
        savedRecordIds,
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}