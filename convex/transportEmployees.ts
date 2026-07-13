import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

import { paginationOptsValidator } from "convex/server";

// ─── Queries ────────────────────────────────────────────────

export const getEmployees = query({
  args: {
    paginationOpts: paginationOptsValidator,
    searchTerm: v.optional(v.string()),
    vehicleType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let q;

    if (args.searchTerm) {
      q = ctx.db
        .query("transportEmployees")
        .withSearchIndex("search_name", (q) =>
          q.search("name", args.searchTerm!)
        );
    } else {
      q = ctx.db.query("transportEmployees").order("desc");
    }

    if (args.vehicleType) {
      q = q.filter((q) => q.eq(q.field("vehicleType"), args.vehicleType));
    }

    return await q.paginate(args.paginationOpts);
  },
});

export const getEmployeeById = query({
  args: { id: v.id("transportEmployees") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getStats = query({
  args: {},
  handler: async (ctx) => {
    const employees = await ctx.db.query("transportEmployees").collect();
    const totalEmployees = employees.length;
    const totalVehicles = employees.length; // 1 vehicle per employee usually
    const totalCapacity = employees.reduce((sum, e) => sum + (e.clothCapacityYards || 0), 0);
    return { totalEmployees, totalVehicles, totalCapacity };
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("transportEmployees").order("desc").collect();
  },
});

export const getById = query({
  args: { id: v.id("transportEmployees") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
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
    avatar: v.optional(v.string()),
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
    avatar: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...fields } = args;
    await ctx.db.patch(id, fields);
  },
});

export const deleteEmployee = mutation({
  args: { id: v.id("transportEmployees") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
