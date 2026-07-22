import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Fetch all banks, sorted by name alphabetically.
 */
export const getBanks = query({
  args: {},
  handler: async (ctx) => {
    const banks = await ctx.db.query("bdBanks").order("asc").collect();
    return banks.sort((a, b) => a.name.localeCompare(b.name));
  },
});

/**
 * Fetch branches by a specific bank Id.
 */
export const getBranchesByBank = query({
  args: { bankId: v.id("bdBanks") },
  handler: async (ctx, args) => {
    const branches = await ctx.db
      .query("bdBankBranches")
      .withIndex("by_bankId", (q) => q.eq("bankId", args.bankId))
      .collect();
    
    return branches.sort((a, b) => a.branchName.localeCompare(b.branchName));
  },
});

/**
 * Search branches across all banks (or within a specific bank if bankId provided)
 */
export const searchBranches = query({
  args: { 
    searchTerm: v.string(),
    bankId: v.optional(v.id("bdBanks")) 
  },
  handler: async (ctx, args) => {
    let branches = await ctx.db
      .query("bdBankBranches")
      .withSearchIndex("search_branchName", (q) => 
        q.search("branchName", args.searchTerm)
      )
      .take(50);
      
    if (args.bankId) {
      branches = branches.filter(b => b.bankId === args.bankId);
    }
    return branches;
  },
});

/**
 * Internal mutation to seed bank and branch data.
 * This should only be called from an admin script.
 */
export const seedBank = mutation({
  args: {
    bankName: v.string(),
    shortName: v.optional(v.string()),
    type: v.optional(v.string()),
    branches: v.array(v.object({
      branchName: v.string(),
      routingNumber: v.optional(v.string()),
      district: v.optional(v.string()),
      address: v.optional(v.string()),
    }))
  },
  handler: async (ctx, args) => {
    // Check if bank already exists
    let bank = await ctx.db
      .query("bdBanks")
      .withIndex("by_name", (q) => q.eq("name", args.bankName))
      .first();

    let bankId = bank?._id;

    if (!bankId) {
      bankId = await ctx.db.insert("bdBanks", {
        name: args.bankName,
        shortName: args.shortName,
        type: args.type,
      });
    }

    // Insert branches
    let insertedCount = 0;
    for (const branch of args.branches) {
      // Basic check to prevent duplicate branches (by routing number if available, else by name)
      let existingBranch = null;
      if (branch.routingNumber) {
        existingBranch = await ctx.db
          .query("bdBankBranches")
          .withIndex("by_routingNumber", (q) => q.eq("routingNumber", branch.routingNumber))
          .first();
      } else {
         // Fallback to check by bankId and branchName
         const existingBranches = await ctx.db
          .query("bdBankBranches")
          .withIndex("by_bankId", (q) => q.eq("bankId", bankId))
          .collect();
         existingBranch = existingBranches.find(b => b.branchName === branch.branchName);
      }

      if (!existingBranch) {
        await ctx.db.insert("bdBankBranches", {
          bankId: bankId,
          bankName: args.bankName,
          branchName: branch.branchName,
          routingNumber: branch.routingNumber,
          district: branch.district,
          address: branch.address,
        });
        insertedCount++;
      }
    }
    
    return { bankId, insertedCount };
  }
});
