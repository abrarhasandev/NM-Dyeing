import { action, internalMutation, query } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

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

// --- Internal Mutations for Seeding ---

export const seedDivisions = internalMutation({
  args: { data: v.array(v.object({ name: v.string(), bn_name: v.string() })) },
  handler: async (ctx, args) => {
    for (const d of args.data) {
      const existing = await ctx.db.query("bdDivisions").withIndex("by_name", q => q.eq("name", d.name)).first();
      if (!existing) await ctx.db.insert("bdDivisions", d);
    }
  }
});

export const seedDistricts = internalMutation({
  args: { data: v.array(v.object({ divisionName: v.string(), name: v.string(), bn_name: v.string() })) },
  handler: async (ctx, args) => {
    for (const d of args.data) {
      const existing = await ctx.db.query("bdDistricts").withIndex("by_name", q => q.eq("name", d.name)).first();
      if (!existing) await ctx.db.insert("bdDistricts", d);
    }
  }
});

export const seedUpazilas = internalMutation({
  args: { data: v.array(v.object({ districtName: v.string(), name: v.string(), bn_name: v.string() })) },
  handler: async (ctx, args) => {
    for (const d of args.data) {
      const existing = await ctx.db.query("bdUpazilas").withIndex("by_name", q => q.eq("name", d.name)).first();
      if (!existing) await ctx.db.insert("bdUpazilas", d);
    }
  }
});

export const seedUnions = internalMutation({
  args: { data: v.array(v.object({ upazilaName: v.string(), name: v.string(), bn_name: v.string() })) },
  handler: async (ctx, args) => {
    for (const d of args.data) {
      const existing = await ctx.db.query("bdUnions").withIndex("by_name", q => q.eq("name", d.name)).first();
      if (!existing) await ctx.db.insert("bdUnions", d);
    }
  }
});

// --- Utility for batching Promises ---
const chunkArray = <T>(arr: T[], size: number): T[][] => {
  return arr.length ? [arr.slice(0, size), ...chunkArray(arr.slice(size), size)] : [];
};

export const seedAllAddressData = action({
  args: {},
  handler: async (ctx) => {
    console.log("Seeding Divisions...");
    const divRes = await fetch(`${API_BASE}/divisions`);
    const divData = await divRes.json();
    const divisions = divData.data || [];
    
    await ctx.runMutation(internal.addresses.seedDivisions, {
      data: divisions.map((d: any) => ({ name: d.name, bn_name: d.bn_name }))
    });

    for (const div of divisions) {
       console.log(`Seeding Districts for ${div.name}...`);
       const distRes = await fetch(`${API_BASE}/districts/${div.id}`);
       const distData = await distRes.json();
       const districts = distData.data || [];
       
       await ctx.runMutation(internal.addresses.seedDistricts, {
         data: districts.map((d: any) => ({ divisionName: div.name, name: d.name, bn_name: d.bn_name }))
       });

       const upazilasByDistrict: Record<string, any[]> = {};

       // Fetch upazilas concurrently
       const distChunks = chunkArray(districts, 10);
       for (const chunk of distChunks) {
         await Promise.all(chunk.map(async (dist: any) => {
            const upaRes = await fetch(`${API_BASE}/upazilas/${dist.id}`);
            if (upaRes.ok) {
              const upaData = await upaRes.json();
              upazilasByDistrict[dist.name] = upaData.data || [];
            }
         }));
       }

       for (const dist of districts) {
          const upazilas = upazilasByDistrict[dist.name] || [];
          if (upazilas.length > 0) {
            await ctx.runMutation(internal.addresses.seedUpazilas, {
              data: upazilas.map((u: any) => ({ districtName: dist.name, name: u.name, bn_name: u.bn_name }))
            });
          }

          // Fetch unions concurrently for these upazilas
          const upaChunks = chunkArray(upazilas, 10);
          for (const chunk of upaChunks) {
            await Promise.all(chunk.map(async (upa: any) => {
               const unionRes = await fetch(`${API_BASE}/unions/${upa.id}`);
               if (unionRes.ok) {
                   const unionData = await unionRes.json();
                   const unions = unionData.data || [];
                   if (unions.length > 0) {
                       await ctx.runMutation(internal.addresses.seedUnions, {
                           data: unions.map((u: any) => ({ upazilaName: upa.name, name: u.name, bn_name: u.bn_name }))
                       });
                   }
               }
            }));
          }
       }
    }
    console.log("Seeding completed!");
  }
});
