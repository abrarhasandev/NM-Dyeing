import { v } from "convex/values";
import { mutation } from "./_generated/server";

// ==========================================
// AUDITING & RECONCILIATION
// ==========================================

export const submitStockAudit = mutation({
  args: {
    auditMonth: v.string(), // e.g., "2026-07"
    completedBy: v.string(),
    auditItems: v.array(
      v.object({
        itemId: v.id("inventoryItems"),
        physicalStock: v.number(),
        discrepancyReason: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    let totalFinancialImpact = 0;

    // 1. Create the parent audit record
    const auditId = await ctx.db.insert("stockAudits", {
      auditMonth: args.auditMonth,
      status: "COMPLETED",
      completedBy: args.completedBy,
      completedAt: now,
    });

    // 2. Process each audit item
    for (const auditItem of args.auditItems) {
      const item = await ctx.db.get(auditItem.itemId);
      if (!item) continue;

      const systemStock = item.currentStock;
      const variance = auditItem.physicalStock - systemStock;

      if (variance !== 0) {
        const financialImpact = variance * item.movingAveragePrice;
        totalFinancialImpact += financialImpact;

        // A. Insert Audit Item Log
        await ctx.db.insert("stockAuditItems", {
          auditId,
          itemId: auditItem.itemId,
          systemStock,
          physicalStock: auditItem.physicalStock,
          variance,
          discrepancyReason: auditItem.discrepancyReason,
          financialImpact,
        });

        // B. Update Inventory Ledger
        await ctx.db.insert("inventoryLedger", {
          itemId: auditItem.itemId,
          transactionType: "AUDIT_ADJUSTMENT",
          quantity: variance, // Will be negative if shrinkage
          auditId,
          createdAt: now,
        });

        // C. Update Actual Stock
        await ctx.db.patch(auditItem.itemId, {
          currentStock: item.currentStock + variance,
          availableStock: item.availableStock + variance,
          updatedAt: now,
        });
      }
    }

    // 3. Update total financial impact on the parent audit record
    await ctx.db.patch(auditId, {
      totalFinancialImpact,
    });

    return { 
      success: true, 
      auditId, 
      totalFinancialImpact,
      message: `Audit completed. Total impact: ${totalFinancialImpact}` 
    };
  },
});
