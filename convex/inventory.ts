import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ==========================================
// 1. INVENTORY ITEM QUERIES & MUTATIONS
// ==========================================

export const getItems = query({
  args: {
    category: v.optional(v.union(v.literal("DYE"), v.literal("CHEMICAL"), v.literal("AUXILIARY"))),
    itemGroup: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.category) {
      const allItems = await ctx.db
        .query("inventoryItems")
        .withIndex("by_category", (q) => q.eq("category", args.category as any))
        .collect();
      if (args.itemGroup) {
        return allItems.filter(item => item.itemGroup === args.itemGroup);
      }
      return allItems;
    } else if (args.itemGroup) {
      const allItems = await ctx.db.query("inventoryItems").collect();
      return allItems.filter(item => item.itemGroup === args.itemGroup);
    }
    
    return await ctx.db.query("inventoryItems").collect();
  },
});

export const createItem = mutation({
  args: {
    itemCode: v.string(),
    name: v.string(),
    itemGroup: v.string(),
    defaultUom: v.string(),
    maintainStock: v.boolean(),
    isFixedAsset: v.boolean(),
    // Keep old fields optional
    category: v.optional(v.union(v.literal("DYE"), v.literal("CHEMICAL"), v.literal("AUXILIARY"))),
    purchasingUoM: v.optional(v.string()),
    consumingUoM: v.optional(v.string()),
    conversionRate: v.optional(v.number()),
    reorderLevel: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("inventoryItems", {
      itemCode: args.itemCode,
      name: args.name,
      itemGroup: args.itemGroup,
      defaultUom: args.defaultUom,
      maintainStock: args.maintainStock,
      isFixedAsset: args.isFixedAsset,
      category: args.category,
      purchasingUoM: args.purchasingUoM,
      consumingUoM: args.consumingUoM,
      conversionRate: args.conversionRate,
      currentStock: 0,
      reservedStock: 0,
      availableStock: 0,
      movingAveragePrice: 0,
      reorderLevel: args.reorderLevel ?? 0,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// ==========================================
// 2. INBOUND PURCHASE TRANSACTIONS (MAP ENGINE)
// ==========================================

export const purchaseStock = mutation({
  args: {
    itemId: v.id("inventoryItems"),
    purchasedQtyInPurchasingUoM: v.number(),
    totalCost: v.number(), // The total amount paid for this purchase batch
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const item = await ctx.db.get(args.itemId);
    if (!item) {
      throw new Error("Item not found");
    }

    const now = Date.now();
    
    // 1. Convert purchasing unit to consuming unit
    const addedConsumingQty = args.purchasedQtyInPurchasingUoM * (item.conversionRate ?? 1);
    
    // 2. Calculate new Moving Average Price (MAP)
    // Formula: (Current Total Value + New Purchase Value) / (Current Total Qty + New Qty)
    const currentTotalValue = item.currentStock * item.movingAveragePrice;
    const newTotalValue = currentTotalValue + args.totalCost;
    const newTotalQty = item.currentStock + addedConsumingQty;
    
    const newMAP = newTotalQty > 0 ? newTotalValue / newTotalQty : 0;
    
    // 3. Update the Inventory Item
    await ctx.db.patch(args.itemId, {
      currentStock: item.currentStock + addedConsumingQty,
      availableStock: item.availableStock + addedConsumingQty,
      movingAveragePrice: newMAP,
      updatedAt: now,
    });

    // 4. Create Ledger Entry
    const unitCostOfThisPurchase = addedConsumingQty > 0 ? args.totalCost / addedConsumingQty : 0;
    
    await ctx.db.insert("inventoryLedger", {
      itemId: args.itemId,
      transactionType: "PURCHASE_IN",
      quantity: addedConsumingQty,
      unitCostAtTransaction: unitCostOfThisPurchase,
      note: args.note,
      createdAt: now,
    });

    return { success: true, newMAP };
  },
});

// ==========================================
// 3. LEDGER QUERIES
// ==========================================

export const getLedgerEntries = query({
  args: {
    itemId: v.optional(v.id("inventoryItems")),
  },
  handler: async (ctx, args) => {
    let entries;
    if (args.itemId) {
      entries = await ctx.db
        .query("inventoryLedger")
        .withIndex("by_item", (q) => q.eq("itemId", args.itemId as any))
        .order("desc")
        .collect();
    } else {
      entries = await ctx.db.query("inventoryLedger").order("desc").collect();
    }
    
    // Fetch item details for each entry
    return await Promise.all(
      entries.map(async (entry) => {
        const item = await ctx.db.get(entry.itemId);
        return {
          ...entry,
          itemName: item?.name || "Unknown Item",
          itemCategory: item?.category || "Unknown",
        };
      })
    );
  },
});
