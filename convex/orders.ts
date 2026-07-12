import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { assertMirrorSecret } from "./lib/mirrorAuth";

/**
 * Order domain — dual-write / backfill mirror layer.
 * Writes require mirrorSecret === Convex env ORDER_MIRROR_SECRET.
 */

const tableRow = v.object({
  rollNo: v.optional(v.number()),
  goj: v.optional(v.number()),
});

const orderFields = {
  mongoId: v.string(),
  orderId: v.string(),
  customerMongoId: v.string(),
  dyeingMongoId: v.optional(v.string()),
  status: v.string(),
  date: v.optional(v.number()),
  invoiceNumber: v.optional(v.string()),
  companyName: v.optional(v.string()),
  clotheType: v.optional(v.string()),
  finishingWidth: v.optional(v.number()),
  quality: v.optional(v.string()),
  sillName: v.optional(v.string()),
  colour: v.optional(v.string()),
  finishingType: v.optional(v.string()),
  totalGoj: v.optional(v.number()),
  totalBundle: v.optional(v.number()),
  dyeingName: v.optional(v.string()),
  transporterName: v.optional(v.string()),
  tableData: v.array(tableRow),
  isTrash: v.boolean(),
  createdAt: v.number(),
  updatedAt: v.number(),
};

// ─── Reads ───────────────────────────────────────────────────────────────────

export const getByMongoId = query({
  args: { mongoId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("orders")
      .withIndex("by_mongoId", (q) => q.eq("mongoId", args.mongoId))
      .unique();
  },
});

export const getByOrderId = query({
  args: { orderId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("orders")
      .withIndex("by_orderId", (q) => q.eq("orderId", args.orderId))
      .unique();
  },
});

export const countAll = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("orders").collect();
    const trash = all.filter((o) => o.isTrash).length;
    return { total: all.length, trash, active: all.length - trash };
  },
});

// ─── Mirror writes ───────────────────────────────────────────────────────────

export const mirrorUpsert = mutation({
  args: {
    mirrorSecret: v.string(),
    ...orderFields,
  },
  handler: async (ctx, args) => {
    assertMirrorSecret(args.mirrorSecret);
    const { mirrorSecret: _s, ...fields } = args;

    const existing = await ctx.db
      .query("orders")
      .withIndex("by_mongoId", (q) => q.eq("mongoId", fields.mongoId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, fields);
      return existing._id;
    }
    return await ctx.db.insert("orders", fields);
  },
});

export const mirrorPatchStatus = mutation({
  args: {
    mirrorSecret: v.string(),
    mongoId: v.string(),
    status: v.string(),
    updatedAt: v.number(),
  },
  handler: async (ctx, args) => {
    assertMirrorSecret(args.mirrorSecret);
    const existing = await ctx.db
      .query("orders")
      .withIndex("by_mongoId", (q) => q.eq("mongoId", args.mongoId))
      .unique();
    if (!existing) return null;
    await ctx.db.patch(existing._id, {
      status: args.status,
      updatedAt: args.updatedAt,
    });
    return existing._id;
  },
});

export const mirrorTrash = mutation({
  args: {
    mirrorSecret: v.string(),
    mongoId: v.string(),
    updatedAt: v.number(),
  },
  handler: async (ctx, args) => {
    assertMirrorSecret(args.mirrorSecret);
    const existing = await ctx.db
      .query("orders")
      .withIndex("by_mongoId", (q) => q.eq("mongoId", args.mongoId))
      .unique();
    if (!existing) return null;
    await ctx.db.patch(existing._id, {
      isTrash: true,
      updatedAt: args.updatedAt,
    });
    return existing._id;
  },
});

export const mirrorRestore = mutation({
  args: {
    mirrorSecret: v.string(),
    mongoId: v.string(),
    updatedAt: v.number(),
  },
  handler: async (ctx, args) => {
    assertMirrorSecret(args.mirrorSecret);
    const existing = await ctx.db
      .query("orders")
      .withIndex("by_mongoId", (q) => q.eq("mongoId", args.mongoId))
      .unique();
    if (!existing) return null;
    await ctx.db.patch(existing._id, {
      isTrash: false,
      updatedAt: args.updatedAt,
    });
    return existing._id;
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
      .query("orders")
      .withIndex("by_mongoId", (q) => q.eq("mongoId", args.mongoId))
      .unique();
    if (!existing) return null;
    await ctx.db.delete(existing._id);
    return existing._id;
  },
});
