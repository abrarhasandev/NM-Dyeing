import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { assertMirrorSecret } from "./lib/mirrorAuth";

const billingSummaryFields = {
  mongoId: v.string(),
  orderMongoId: v.string(),
  displayOrderId: v.optional(v.string()),
  companyName: v.string(),
  invoiceNumber: v.string(),
  summaryType: v.string(),
  price: v.number(),
  total: v.number(),
  totalQty: v.number(),
  batchName: v.string(),
  clotheType: v.optional(v.string()),
  quality: v.optional(v.string()),
  colour: v.optional(v.string()),
  sillName: v.optional(v.string()),
  finishingType: v.optional(v.string()),
  customerMongoId: v.optional(v.string()),
  dyeing: v.optional(v.string()),
  dyeingMongoId: v.optional(v.string()),
  calender: v.optional(v.string()),
  calenderMongoId: v.optional(v.string()),
  isSavedInLedger: v.boolean(),
  createdAt: v.number(),
  updatedAt: v.number(),
};

export const getByMongoId = query({
  args: { mongoId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("billingSummaries")
      .withIndex("by_mongoId", (q) => q.eq("mongoId", args.mongoId))
      .unique();
  },
});

export const countAll = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("billingSummaries").collect();
    return { total: all.length };
  },
});

export const mirrorUpsert = mutation({
  args: {
    mirrorSecret: v.string(),
    ...billingSummaryFields,
  },
  handler: async (ctx, args) => {
    assertMirrorSecret(args.mirrorSecret);
    const { mirrorSecret: _s, ...fields } = args;
    const existing = await ctx.db
      .query("billingSummaries")
      .withIndex("by_mongoId", (q) => q.eq("mongoId", fields.mongoId))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, fields);
      return existing._id;
    }
    return await ctx.db.insert("billingSummaries", fields);
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
      .query("billingSummaries")
      .withIndex("by_mongoId", (q) => q.eq("mongoId", args.mongoId))
      .unique();
    if (!existing) return null;
    await ctx.db.delete(existing._id);
    return existing._id;
  },
});
