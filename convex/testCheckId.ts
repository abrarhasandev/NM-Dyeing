import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const testCompare = mutation({
  args: { id: v.id("transportEmployees") },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) return "not found";
    return existing._id === args.id;
  }
});
