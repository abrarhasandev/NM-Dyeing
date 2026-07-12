import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { assertMirrorSecret } from "./lib/mirrorAuth";

const dyeingEmployee = v.object({
  mongoId: v.optional(v.string()),
  employeeName: v.string(),
  designation: v.string(),
  info: v.optional(v.string()),
});

const dyeingFields = {
  mongoId: v.string(),
  name: v.string(),
  location: v.string(),
  employees: v.array(dyeingEmployee),
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
      .query("dyeings")
      .withIndex("by_mongoId", (q) => q.eq("mongoId", args.mongoId))
      .unique();
  },
});

export const countAll = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("dyeings").collect();
    return { total: all.length };
  },
});

export const mirrorUpsert = mutation({
  args: {
    mirrorSecret: v.string(),
    ...dyeingFields,
  },
  handler: async (ctx, args) => {
    assertMirrorSecret(args.mirrorSecret);
    const { mirrorSecret: _s, ...fields } = args;
    const existing = await ctx.db
      .query("dyeings")
      .withIndex("by_mongoId", (q) => q.eq("mongoId", fields.mongoId))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, fields);
      return existing._id;
    }
    return await ctx.db.insert("dyeings", fields);
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
      .query("dyeings")
      .withIndex("by_mongoId", (q) => q.eq("mongoId", args.mongoId))
      .unique();
    if (!existing) return null;
    await ctx.db.delete(existing._id);
    return existing._id;
  },
});
