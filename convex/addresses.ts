import { query } from "./_generated/server";
import { v } from "convex/values";

const API_BASE = "https://bdapis.pro.bd/geo/v2.0";

// --- Queries ---

export const getDivisions = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("bdDivisions").order("asc").collect();
  },
});

export const getDistricts = query({
  args: { divisionName: v.string() },
  handler: async (ctx, args) => {
    if (!args.divisionName) return [];
    return await ctx.db
      .query("bdDistricts")
      .withIndex("by_division", (q) => q.eq("divisionName", args.divisionName))
      .collect();
  },
});

export const getAllDistrictsRaw = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("bdDistricts").collect();
  }
});

export const getUpazilas = query({
  args: { districtName: v.string() },
  handler: async (ctx, args) => {
    if (!args.districtName) return [];
    return await ctx.db
      .query("bdUpazilas")
      .withIndex("by_district", (q) => q.eq("districtName", args.districtName))
      .collect();
  },
});

export const getUnions = query({
  args: { upazilaName: v.string() },
  handler: async (ctx, args) => {
    if (!args.upazilaName) return [];
    return await ctx.db
      .query("bdUnions")
      .withIndex("by_upazila", (q) => q.eq("upazilaName", args.upazilaName))
      .collect();
  },
});

export const getThanas = query({
  args: { districtName: v.optional(v.string()) },
  handler: async (ctx, args) => {
    if (args.districtName) {
      return await ctx.db
        .query("bdThanas")
        .withIndex("by_district", (q) => q.eq("districtName", args.districtName))
        .collect();
    }
    return await ctx.db.query("bdThanas").collect();
  },
});

export const getPaurashavas = query({
  args: { districtName: v.optional(v.string()), upazilaName: v.optional(v.string()) },
  handler: async (ctx, args) => {
    let q = ctx.db.query("bdPaurashavas");
    if (args.upazilaName) {
      return await q.withIndex("by_upazila", (q) => q.eq("upazilaName", args.upazilaName!)).collect();
    } else if (args.districtName) {
      return await q.withIndex("by_district", (q) => q.eq("districtName", args.districtName!)).collect();
    }
    return await q.collect();
  },
});

