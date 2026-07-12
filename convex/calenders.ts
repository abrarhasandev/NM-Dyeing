import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { assertMirrorSecret } from "./lib/mirrorAuth";

const calenderFields = {
  mongoId: v.string(),
  name: v.string(),
  location: v.string(),
  initialCharge: v.number(),
  initialPayment: v.number(),
  initialDate: v.optional(v.number()),
  createdAt: v.number(),
  updatedAt: v.number(),
};

export const getByMongoId = query({
  args: { mongoId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("calenders")
      .withIndex("by_mongoId", (q) => q.eq("mongoId", args.mongoId))
      .unique();
  },
});

export const countAll = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("calenders").collect();
    return { total: all.length };
  },
});

export const mirrorUpsert = mutation({
  args: {
    mirrorSecret: v.string(),
    ...calenderFields,
  },
  handler: async (ctx, args) => {
    assertMirrorSecret(args.mirrorSecret);
    const { mirrorSecret: _s, ...fields } = args;
    const existing = await ctx.db
      .query("calenders")
      .withIndex("by_mongoId", (q) => q.eq("mongoId", fields.mongoId))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, fields);
      return existing._id;
    }
    return await ctx.db.insert("calenders", fields);
  },
});

export const mirrorRemove = mutation({
  args: {
    mirrorSecret: v.string(),
    mongoId: v.string(),
  },
  handler: async (ctx, args) => {
    assertMirrorSecret(args.mirrorSecret);
    const existing = await ctx.db
      .query("calenders")
      .withIndex("by_mongoId", (q) => q.eq("mongoId", args.mongoId))
      .unique();
    if (!existing) return null;
    await ctx.db.delete(existing._id);
    return existing._id;
  },
});
