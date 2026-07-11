import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Create a new chemical
export const addChemical = mutation({
  args: {
    name: v.string(),
    category: v.union(v.literal("Dyes"), v.literal("Auxiliaries"), v.literal("Basic Chemicals")),
    uom: v.union(v.literal("Kg"), v.literal("g"), v.literal("L"), v.literal("ml")),
    minimumStockLevel: v.number(),
  },
  handler: async (ctx, args) => {
    const chemicalId = await ctx.db.insert("chemicals", {
      ...args,
      currentStock: 0,
    });
    return chemicalId;
  },
});

// Get all chemicals
export const getChemicals = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("chemicals").collect();
  },
});

// Add stock (Goods Receipt)
export const addStock = mutation({
  args: {
    chemicalId: v.id("chemicals"),
    lotNumber: v.string(),
    manufacturingDate: v.optional(v.string()),
    expirationDate: v.optional(v.string()),
    barcode: v.optional(v.string()),
    quantity: v.number(),
    supplierId: v.optional(v.id("suppliers")),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    // 1. Create a Batch
    const batchId = await ctx.db.insert("chemicalBatches", {
      chemicalId: args.chemicalId,
      lotNumber: args.lotNumber,
      manufacturingDate: args.manufacturingDate,
      expirationDate: args.expirationDate,
      barcode: args.barcode,
      initialQuantity: args.quantity,
      currentQuantity: args.quantity,
      supplierId: args.supplierId,
    });

    // 2. Log Transaction
    await ctx.db.insert("stockTransactions", {
      type: "Stock In",
      chemicalId: args.chemicalId,
      batchId,
      quantity: args.quantity,
      date: new Date().toISOString(),
      userId: args.userId,
    });

    // 3. Update Current Stock
    const chemical = await ctx.db.get(args.chemicalId);
    if (chemical) {
      await ctx.db.patch(args.chemicalId, {
        currentStock: chemical.currentStock + args.quantity,
      });
    }

    return batchId;
  },
});

// Issue stock (To Production)
export const issueStock = mutation({
  args: {
    chemicalId: v.id("chemicals"),
    batchId: v.id("chemicalBatches"),
    quantity: v.number(),
    jobOrderId: v.string(),
    machineId: v.string(),
    shift: v.string(),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const batch = await ctx.db.get(args.batchId);
    if (!batch || batch.currentQuantity < args.quantity) {
      throw new Error("Insufficient stock in the selected batch.");
    }

    // 1. Deduct from Batch
    await ctx.db.patch(args.batchId, {
      currentQuantity: batch.currentQuantity - args.quantity,
    });

    // 2. Log Transaction
    await ctx.db.insert("stockTransactions", {
      type: "Issue",
      chemicalId: args.chemicalId,
      batchId: args.batchId,
      quantity: -args.quantity,
      date: new Date().toISOString(),
      jobOrderId: args.jobOrderId,
      machineId: args.machineId,
      shift: args.shift,
      userId: args.userId,
    });

    // 3. Update Current Stock
    const chemical = await ctx.db.get(args.chemicalId);
    if (chemical) {
      await ctx.db.patch(args.chemicalId, {
        currentStock: chemical.currentStock - args.quantity,
      });
    }
  },
});

// Get batches for a chemical
export const getChemicalBatches = query({
  args: { chemicalId: v.id("chemicals") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("chemicalBatches")
      .withIndex("by_chemical", (q) => q.eq("chemicalId", args.chemicalId))
      .filter((q) => q.gt(q.field("currentQuantity"), 0))
      .collect();
  },
});

// Dashboard Analytics Query
export const getDashboardAnalytics = query({
  args: {},
  handler: async (ctx) => {
    const chemicals = await ctx.db.query("chemicals").collect();
    
    let totalChemicalsStock = 0;
    const criticalAlerts = [];

    chemicals.forEach(chem => {
      totalChemicalsStock += chem.currentStock;
      if (chem.currentStock < chem.minimumStockLevel) {
        criticalAlerts.push(chem);
      }
    });

    const todayStr = new Date().toISOString().split("T")[0];
    const recentTransactions = await ctx.db.query("stockTransactions")
      .filter(q => q.gte(q.field("date"), todayStr))
      .collect();
    
    let todayStockIn = 0;
    let todayStockOut = 0;

    recentTransactions.forEach(tx => {
      if (tx.type === "Stock In") {
        todayStockIn += tx.quantity;
      } else {
        todayStockOut += Math.abs(tx.quantity);
      }
    });

    return {
      totalChemicalsStock,
      criticalAlerts,
      todayStockIn,
      todayStockOut,
    };
  }
});

// Get all transactions for reporting
export const getTransactions = query({
  args: { 
    startDate: v.optional(v.string()), 
    endDate: v.optional(v.string()) 
  },
  handler: async (ctx, args) => {
    let q = ctx.db.query("stockTransactions");
    if (args.startDate) {
      q = q.filter((q) => q.gte(q.field("date"), args.startDate));
    }
    if (args.endDate) {
      q = q.filter((q) => q.lte(q.field("date"), args.endDate));
    }
    return await q.collect();
  },
});
