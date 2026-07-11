import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// ─── Queries ────────────────────────────────────────────────

export const list = query({
  args: {},
  handler: async (ctx) => {
    const employees = await ctx.db.query("transportEmployees").order("desc").collect();
    return employees;
  },
});

export const getById = query({
  args: { id: v.id("transportEmployees") },
  handler: async (ctx, args) => {
    const employee = await ctx.db.get(args.id);
    return employee;
  },
});

// ─── Mutations ──────────────────────────────────────────────

export const create = mutation({
  args: {
    name: v.string(),
    phoneNumbers: v.array(
      v.union(
        v.string(),
        v.object({ number: v.string(), accounts: v.array(v.string()) })
      )
    ),
    address: v.union(
      v.string(),
      v.object({
        nid: v.object({
          division: v.string(),
          district: v.string(),
          upazila: v.string(),
          union: v.string(),
          street: v.string(),
        }),
        permanent: v.object({
          division: v.string(),
          district: v.string(),
          upazila: v.string(),
          union: v.string(),
          street: v.string(),
        }),
        current: v.object({
          division: v.string(),
          district: v.string(),
          upazila: v.string(),
          union: v.string(),
          street: v.string(),
        }),
      })
    ),
    dob: v.optional(v.string()),
    age: v.number(),
    vehicleType: v.string(),
    vehicleWheels: v.number(),
    clothCapacityYards: v.number(),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("transportEmployees", {
      ...args,
      createdAt: Date.now(),
    });
    return id;
  },
});

export const update = mutation({
  args: {
    id: v.id("transportEmployees"),
    name: v.string(),
    phoneNumbers: v.array(
      v.union(
        v.string(),
        v.object({ number: v.string(), accounts: v.array(v.string()) })
      )
    ),
    address: v.union(
      v.string(),
      v.object({
        nid: v.object({
          division: v.string(),
          district: v.string(),
          upazila: v.string(),
          union: v.string(),
          street: v.string(),
        }),
        permanent: v.object({
          division: v.string(),
          district: v.string(),
          upazila: v.string(),
          union: v.string(),
          street: v.string(),
        }),
        current: v.object({
          division: v.string(),
          district: v.string(),
          upazila: v.string(),
          union: v.string(),
          street: v.string(),
        }),
      })
    ),
    dob: v.optional(v.string()),
    age: v.number(),
    vehicleType: v.string(),
    vehicleWheels: v.number(),
    clothCapacityYards: v.number(),
  },
  handler: async (ctx, args) => {
    const { id, ...fields } = args;
    await ctx.db.patch(id, fields);
  },
});

export const remove = mutation({
  args: { id: v.id("transportEmployees") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
