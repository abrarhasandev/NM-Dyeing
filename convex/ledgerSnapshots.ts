import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { assertMirrorSecret } from "./lib/mirrorAuth";

const ledgerRow = v.object({
  date: v.optional(v.number()),
  provider: v.optional(v.string()),
  displayOrderId: v.optional(v.string()),
  companyName: v.optional(v.string()),
  description: v.optional(v.string()),
  qty: v.optional(v.number()),
  price: v.optional(v.number()),
  charge: v.optional(v.number()),
  payment: v.optional(v.number()),
  balance: v.optional(v.number()),
  colour: v.optional(v.string()),
  type: v.optional(v.string()),
});

const ledgerSnapshotFields = {
  mongoId: v.string(),
  entityMongoId: v.string(),
  entityType: v.string(),
  title: v.string(),
  fromDate: v.number(),
  closedAt: v.number(),
  ledgerData: v.array(ledgerRow),
  totalCharge: v.number(),
  totalPayment: v.number(),
  finalBalance: v.number(),
  openingBalance: v.number(),
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
      .query("ledgerSnapshots")
      .withIndex("by_mongoId", (q) => q.eq("mongoId", args.mongoId))
      .unique();
  },
});

export const countAll = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("ledgerSnapshots").collect();
    return { total: all.length };
  },
});

export const mirrorUpsert = mutation({
  args: {
    mirrorSecret: v.string(),
    ...ledgerSnapshotFields,
  },
  handler: async (ctx, args) => {
    assertMirrorSecret(args.mirrorSecret);
    const { mirrorSecret: _s, ...fields } = args;
    const existing = await ctx.db
      .query("ledgerSnapshots")
      .withIndex("by_mongoId", (q) => q.eq("mongoId", fields.mongoId))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, fields);
      return existing._id;
    }
    return await ctx.db.insert("ledgerSnapshots", fields);
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
      .query("ledgerSnapshots")
      .withIndex("by_mongoId", (q) => q.eq("mongoId", args.mongoId))
      .unique();
    if (!existing) return null;
    await ctx.db.delete(existing._id);
    return existing._id;
  },
});
