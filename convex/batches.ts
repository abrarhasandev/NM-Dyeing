import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { assertMirrorSecret } from "./lib/mirrorAuth";

const batchRow = v.object({
  rollNo: v.optional(v.number()),
  goj: v.optional(v.number()),
  idx: v.optional(v.array(v.number())),
  extraInputs: v.optional(v.array(v.string())),
});

const selectedProcess = v.object({
  name: v.optional(v.string()),
  price: v.optional(v.number()),
});

const embeddedBatch = v.object({
  mongoId: v.optional(v.string()),
  batchName: v.string(),
  status: v.string(),
  customerMongoId: v.optional(v.string()),
  dyeingMongoId: v.optional(v.string()),
  calenderMongoId: v.optional(v.string()),
  rows: v.array(batchRow),
  selectedProcesses: v.array(selectedProcess),
  colour: v.string(),
  quality: v.optional(v.string()),
  sillName: v.string(),
  clotheType: v.optional(v.string()),
  finishingType: v.string(),
  dyeing: v.string(),
  calender: v.optional(v.string()),
  note: v.optional(v.string()),
  invoiceNumber: v.optional(v.string()),
});

const batchDocFields = {
  mongoId: v.string(),
  orderMongoId: v.string(),
  batches: v.array(embeddedBatch),
  createdAt: v.number(),
  updatedAt: v.number(),
};

export const getByMongoId = query({
  args: { mongoId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("batches")
      .withIndex("by_mongoId", (q) => q.eq("mongoId", args.mongoId))
      .unique();
  },
});

export const getByOrderMongoId = query({
  args: { orderMongoId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("batches")
      .withIndex("by_orderMongoId", (q) => q.eq("orderMongoId", args.orderMongoId))
      .unique();
  },
});

export const countAll = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("batches").collect();
    let embeddedCount = 0;
    for (const doc of all) {
      embeddedCount += doc.batches?.length ?? 0;
    }
    return { total: all.length, embeddedBatches: embeddedCount };
  },
});

export const mirrorUpsert = mutation({
  args: {
    mirrorSecret: v.string(),
    ...batchDocFields,
  },
  handler: async (ctx, args) => {
    assertMirrorSecret(args.mirrorSecret);
    const { mirrorSecret: _s, ...fields } = args;

    const existing = await ctx.db
      .query("batches")
      .withIndex("by_mongoId", (q) => q.eq("mongoId", fields.mongoId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, fields);
      return existing._id;
    }
    return await ctx.db.insert("batches", fields);
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
      .query("batches")
      .withIndex("by_mongoId", (q) => q.eq("mongoId", args.mongoId))
      .unique();
    if (!existing) return null;
    await ctx.db.delete(existing._id);
    return existing._id;
  },
});
