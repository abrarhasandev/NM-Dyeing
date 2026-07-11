import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getSuppliers = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("suppliers").collect();
  },
});

export const addSupplier = mutation({
  args: {
    name: v.string(),
    contactPerson: v.optional(v.string()),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    address: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("suppliers", {
      ...args,
      balanceDue: 0,
    });
  },
});

export const addFinancialLedger = mutation({
  args: {
    supplierId: v.id("suppliers"),
    type: v.union(v.literal("Invoice"), v.literal("Payment"), v.literal("Adjustment")),
    amount: v.number(),
    referenceNumber: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const supplier = await ctx.db.get(args.supplierId);
    if (!supplier) throw new Error("Supplier not found");

    // Add to ledger
    await ctx.db.insert("financialLedgers", {
      supplierId: args.supplierId,
      type: args.type,
      amount: args.amount,
      date: new Date().toISOString(),
      referenceNumber: args.referenceNumber,
      notes: args.notes,
    });

    // Update supplier balance
    // Invoice increases balance (dues), Payment decreases balance
    let newBalance = supplier.balanceDue;
    if (args.type === "Invoice") {
      newBalance += args.amount;
    } else if (args.type === "Payment") {
      newBalance -= args.amount;
    } else {
      // For adjustments, positive amount adds to dues, negative subtracts
      newBalance += args.amount;
    }

    // Round to 2 decimals to match BDT standards
    newBalance = Math.round(newBalance * 100) / 100;

    await ctx.db.patch(args.supplierId, {
      balanceDue: newBalance,
    });
  },
});

export const getSupplierLedger = query({
  args: { supplierId: v.id("suppliers") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("financialLedgers")
      .withIndex("by_supplier", (q) => q.eq("supplierId", args.supplierId))
      .collect();
  },
});
