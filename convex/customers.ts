import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { assertMirrorSecret } from "./lib/mirrorAuth";

const customerFields = {
  mongoId: v.string(),
  customerType: v.optional(v.union(v.literal("Company"), v.literal("Individual"))),
  companyName: v.optional(v.string()),
  ownerName: v.optional(v.string()),
  owners: v.optional(v.array(
    v.object({
      name: v.string(),
      phone: v.optional(v.string()),
    })
  )),
  address: v.union(
    v.string(),
    v.array(
      v.object({
        type: v.union(v.literal("Office"), v.literal("Warehouse"), v.literal("Godown"), v.literal("Other")),
        division: v.string(),
        district: v.string(),
        upazila: v.string(),
        thana: v.optional(v.string()),
        union: v.optional(v.string()),
        paurashava: v.optional(v.string()),
        street: v.optional(v.string()),
      })
    )
  ),
  phoneNumber: v.union(
    v.string(),
    v.array(
      v.object({
        number: v.string(),
        isPrimary: v.boolean(),
        ownerName: v.optional(v.string()),
        accounts: v.array(v.string()),
        description: v.optional(v.string()),
      })
    )
  ),
  employeeList: v.union(
    v.array(v.string()),
    v.array(
      v.object({
        name: v.string(),
        designation: v.string(),
        phone: v.optional(v.string()),
        address: v.optional(v.string()),
      })
    )
  ),
  bankAccounts: v.optional(
    v.array(
      v.object({
        bankName: v.string(),
        accountName: v.string(),
        accountNumber: v.string(),
        branchName: v.optional(v.string()),
        routingNumber: v.optional(v.string()),
      })
    )
  ),
  mobileBanking: v.optional(
    v.array(
      v.object({
        provider: v.string(),
        number: v.string(),
      })
    )
  ),
  searchText: v.optional(v.string()),
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
      .query("customers")
      .withIndex("by_mongoId", (q) => q.eq("mongoId", args.mongoId))
      .unique();
  },
});

export const getById = query({
  args: { id: v.id("customers") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("customers").collect();
  },
});

export const countAll = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("customers").collect();
    return { total: all.length };
  },
});

export const mirrorUpsert = mutation({
  args: {
    mirrorSecret: v.string(),
    ...customerFields,
  },
  handler: async (ctx, args) => {
    assertMirrorSecret(args.mirrorSecret);
    const { mirrorSecret: _s, ...fields } = args;
    const existing = await ctx.db
      .query("customers")
      .withIndex("by_mongoId", (q) => q.eq("mongoId", fields.mongoId))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, fields);
      return existing._id;
    }
    return await ctx.db.insert("customers", fields);
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
      .query("customers")
      .withIndex("by_mongoId", (q) => q.eq("mongoId", args.mongoId))
      .unique();
    if (!existing) return null;
    await ctx.db.delete(existing._id);
    return existing._id;
  },
});
