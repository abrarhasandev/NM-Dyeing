import { v } from "convex/values";
import { mutation } from "./_generated/server";

// ==========================================
// BATCH EXECUTION & COSTING (Agent Beta/Gamma)
// ==========================================

export const startBatch = mutation({
  args: {
    batchId: v.string(),
    recipeId: v.id("recipes"),
    fabricWeightKg: v.number(),
    liquorVolumeLiters: v.number(),
    machineCapacityKg: v.number(),
  },
  handler: async (ctx, args) => {
    // 1. Fetch Recipe Ingredients
    const ingredients = await ctx.db
      .query("recipeIngredients")
      .withIndex("by_recipe", (q) => q.eq("recipeId", args.recipeId))
      .collect();

    const now = Date.now();

    // 2. Calculate dynamic requirements and reserve stock
    for (const ingredient of ingredients) {
      let requiredQty = 0;
      switch (ingredient.calculationBase) {
        case "FABRIC_WEIGHT":
          requiredQty = args.fabricWeightKg * ingredient.quantityPerBase;
          break;
        case "LIQUOR_RATIO":
          requiredQty = args.liquorVolumeLiters * ingredient.quantityPerBase;
          break;
        case "MACHINE_CAPACITY":
          requiredQty = args.machineCapacityKg * ingredient.quantityPerBase;
          break;
        case "FIXED":
          requiredQty = ingredient.quantityPerBase;
          break;
      }

      // 3. Check stock and reserve
      const item = await ctx.db.get(ingredient.itemId);
      if (!item) throw new Error(`Item ${ingredient.itemId} not found`);

      if (item.availableStock < requiredQty) {
        throw new Error(`Insufficient stock for ${item.name}. Required: ${requiredQty}, Available: ${item.availableStock}`);
      }

      // 4. Update Inventory Item (Stateful Stock)
      await ctx.db.patch(ingredient.itemId, {
        reservedStock: item.reservedStock + requiredQty,
        availableStock: item.availableStock - requiredQty,
        updatedAt: now,
      });

      // 5. Append Ledger Entry
      await ctx.db.insert("inventoryLedger", {
        itemId: ingredient.itemId,
        transactionType: "RESERVE",
        quantity: -requiredQty, // Negative because we are reserving it from available
        batchId: args.batchId,
        createdAt: now,
      });
    }

    return { success: true, message: "Batch started and inventory reserved." };
  },
});

export const completeBatch = mutation({
  args: {
    batchId: v.string(),
    recipeId: v.id("recipes"),
    actualConsumption: v.array(
      v.object({
        itemId: v.id("inventoryItems"),
        reservedQty: v.number(), // the amount that was originally reserved
        actualQty: v.number(),   // the exact amount actually consumed
      })
    ),
  },
  handler: async (ctx, args) => {
    // 1. Ensure Compliance (Agent Gamma rule)
    // Real-world check: Are all mandatory SOPs for this process checked?
    // In this basic version, we just assume the frontend verified it, but we could enforce it here.

    const now = Date.now();
    let totalMaterialCost = 0;

    for (const consumption of args.actualConsumption) {
      const item = await ctx.db.get(consumption.itemId);
      if (!item) continue;

      // 2. Release Reservation
      await ctx.db.insert("inventoryLedger", {
        itemId: consumption.itemId,
        transactionType: "RELEASE_RESERVE",
        quantity: consumption.reservedQty,
        batchId: args.batchId,
        createdAt: now,
      });

      // 3. Consume Actual
      await ctx.db.insert("inventoryLedger", {
        itemId: consumption.itemId,
        transactionType: "CONSUME_ACTUAL",
        quantity: -consumption.actualQty,
        unitCostAtTransaction: item.movingAveragePrice,
        batchId: args.batchId,
        createdAt: now + 1, // slight offset to maintain strict ordering
      });

      // 4. Update Stateful Stock
      // We return the reserved amount to available, then deduct the actual from current and available.
      const newReservedStock = item.reservedStock - consumption.reservedQty;
      const newAvailableStock = (item.availableStock + consumption.reservedQty) - consumption.actualQty;
      const newCurrentStock = item.currentStock - consumption.actualQty;

      await ctx.db.patch(consumption.itemId, {
        reservedStock: newReservedStock,
        availableStock: newAvailableStock,
        currentStock: newCurrentStock,
        updatedAt: now,
      });

      // 5. Calculate Cost using MAP
      const itemCost = consumption.actualQty * item.movingAveragePrice;
      totalMaterialCost += itemCost;
    }

    // Usually, you would update the `batches` table here with the `totalMaterialCost`.
    // Example: await ctx.db.patch(parentBatchId, { materialCost: totalMaterialCost });
    
    return { 
      success: true, 
      totalMaterialCost,
      message: "Batch completed, stock consumed, and cost calculated." 
    };
  },
});
