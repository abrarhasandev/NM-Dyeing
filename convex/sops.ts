import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ==========================================
// SOP QUERIES & MUTATIONS
// ==========================================

export const getSopsByProcess = query({
  args: {
    processName: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("sops")
      .withIndex("by_process", (q) => q.eq("processName", args.processName))
      .collect();
  },
});

export const createSop = mutation({
  args: {
    processName: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    isMandatory: v.boolean(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("sops", {
      processName: args.processName,
      title: args.title,
      description: args.description,
      isMandatory: args.isMandatory,
    });
  },
});

export const getBatchSopLogs = query({
  args: {
    batchId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("sopExecutionLogs")
      .withIndex("by_batch", (q) => q.eq("batchId", args.batchId))
      .collect();
  },
});

export const logSopExecution = mutation({
  args: {
    batchId: v.string(),
    sopId: v.id("sops"),
    operatorId: v.string(),
    status: v.union(v.literal("CHECKED"), v.literal("FAILED"), v.literal("SKIPPED")),
  },
  handler: async (ctx, args) => {
    // Upsert logic for execution log
    const existing = await ctx.db
      .query("sopExecutionLogs")
      .withIndex("by_batch", (q) => q.eq("batchId", args.batchId))
      .filter((q) => q.eq(q.field("sopId"), args.sopId))
      .first();

    const timestamp = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, {
        operatorId: args.operatorId,
        status: args.status,
        timestamp,
      });
      return existing._id;
    }

    return await ctx.db.insert("sopExecutionLogs", {
      batchId: args.batchId,
      sopId: args.sopId,
      operatorId: args.operatorId,
      status: args.status,
      timestamp,
    });
  },
});
