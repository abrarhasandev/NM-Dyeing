import { query, mutation } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import { paginationOptsValidator } from "convex/server";

/**
 * Transport employees — live Convex domain (Transport Management).
 *
 * Deployed surface must stay in sync with the dashboard UI:
 * - getEmployees (paginated list + search)
 * - getStats
 * - getEmployeeById / getById
 * - list (simple full list for order forms)
 * - create / update / deleteEmployee / remove
 */

const phoneNumberValidator = v.union(
  v.string(),
  v.object({
    number: v.string(),
    accounts: v.array(v.string()),
  })
);

/** Nested address line — union/street optional (matches schema + form UX). */
const addressLineValidator = v.object({
  division: v.string(),
  district: v.string(),
  upazila: v.string(),
  union: v.optional(v.string()),
  street: v.optional(v.string()),
});

const addressValidator = v.union(
  v.string(),
  v.object({
    nid: addressLineValidator,
    permanent: addressLineValidator,
    current: addressLineValidator,
  })
);

const employeeWriteFields = {
  name: v.string(),
  phoneNumbers: v.array(phoneNumberValidator),
  address: addressValidator,
  dob: v.optional(v.string()),
  age: v.number(),
  vehicleType: v.string(),
  vehicleWheels: v.number(),
  clothCapacityYards: v.number(),
  avatar: v.optional(v.string()),
};

// ─── Queries ────────────────────────────────────────────────

/** Paginated list for Transport Management table (search + optional vehicle filter). */
export const getEmployees = query({
  args: {
    paginationOpts: paginationOptsValidator,
    searchTerm: v.optional(v.string()),
    vehicleType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const term = args.searchTerm?.trim();
    let q;

    if (term) {
      q = ctx.db
        .query("transportEmployees")
        .withSearchIndex("search_name", (search) => search.search("name", term));
    } else {
      q = ctx.db.query("transportEmployees").order("desc");
    }

    if (args.vehicleType) {
      const vehicleType = args.vehicleType;
      if (!term) {
        q = q.filter((f) => f.eq(f.field("vehicleType"), vehicleType));
      }
    }

    return await q.paginate(args.paginationOpts);
  },
});

/** Dashboard stats cards. */
export const getStats = query({
  args: {},
  handler: async (ctx) => {
    const employees = await ctx.db.query("transportEmployees").collect();
    const totalEmployees = employees.length;
    // One vehicle per employee in current domain model
    const totalVehicles = employees.length;
    const totalCapacity = employees.reduce(
      (sum, e) => sum + (e.clothCapacityYards || 0),
      0
    );
    return { totalEmployees, totalVehicles, totalCapacity };
  },
});

/** Full list (order create/edit selects). Newest first. */
export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("transportEmployees").order("desc").collect();
  },
});

/** Primary by-id lookup used by profile / edit / transport orders pages. */
export const getEmployeeById = query({
  args: { id: v.id("transportEmployees") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

/** Alias kept for older clients / scripts that still call getById. */
export const getById = query({
  args: { id: v.id("transportEmployees") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// ─── Mutations ──────────────────────────────────────────────

export const create = mutation({
  args: employeeWriteFields,
  handler: async (ctx, args) => {
    const name = args.name.trim();
    if (!name) throw new Error("Name is required");
    if (!Number.isFinite(args.age) || args.age < 1) {
      throw new Error("Age must be greater than 0");
    }
    if (!Number.isFinite(args.vehicleWheels) || args.vehicleWheels < 1) {
      throw new Error("Vehicle wheels must be at least 1");
    }
    if (!Number.isFinite(args.clothCapacityYards) || args.clothCapacityYards < 1) {
      throw new Error("Capacity must be greater than 0");
    }

    return await ctx.db.insert("transportEmployees", {
      ...args,
      name,
      vehicleType: args.vehicleType.trim(),
      createdAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("transportEmployees"),
    ...employeeWriteFields,
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Transport employee not found");

    const { id, ...fields } = args;
    const name = fields.name.trim();
    if (!name) throw new Error("Name is required");

    await ctx.db.patch(id, {
      ...fields,
      name,
      vehicleType: fields.vehicleType.trim(),
    });
    return id;
  },
});

/** Primary delete used by the dashboard UI. */
export const deleteEmployee = mutation({
  args: { id: v.id("transportEmployees") },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) return null;
    await ctx.db.delete(args.id);
    return args.id;
  },
});

/** Alias kept for older clients that still call remove. */
export const remove = mutation({
  args: { id: v.id("transportEmployees") },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) return null;
    await ctx.db.delete(args.id);
    return args.id;
  },
});

/** Allows the admin to set or update mobile app login credentials for an employee. */
export const setCredentials = mutation({
  args: {
    id: v.id("transportEmployees"),
    loginId: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Transport employee not found");

    // Ensure loginId is unique
    const duplicate = await ctx.db
      .query("transportEmployees")
      .withIndex("by_loginId", (q) => q.eq("loginId", args.loginId))
      .first();
      
    if (duplicate && duplicate._id !== args.id) {
      return { 
        success: false, 
        message: "Login ID is already in use by another employee. Please choose a unique ID." 
      };
    }

    await ctx.db.patch(args.id, {
      loginId: args.loginId,
      password: args.password, // Admin-set password
    });
    
    return { success: true };
  },
});
