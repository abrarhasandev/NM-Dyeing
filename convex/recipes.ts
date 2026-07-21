import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ==========================================
// RECIPE (BOM) QUERIES & MUTATIONS
// ==========================================

export const getRecipes = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("recipes").collect();
  },
});

export const getRecipeIngredients = query({
  args: {
    recipeId: v.id("recipes"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("recipeIngredients")
      .withIndex("by_recipe", (q) => q.eq("recipeId", args.recipeId))
      .collect();
  },
});

export const createRecipe = mutation({
  args: {
    name: v.string(),
    colourId: v.string(),
    clothTypeId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("recipes", {
      name: args.name,
      colourId: args.colourId,
      clothTypeId: args.clothTypeId,
      active: true,
    });
  },
});

export const addRecipeIngredient = mutation({
  args: {
    recipeId: v.id("recipes"),
    itemId: v.id("inventoryItems"),
    calculationBase: v.union(
      v.literal("FABRIC_WEIGHT"),
      v.literal("LIQUOR_RATIO"),
      v.literal("MACHINE_CAPACITY"),
      v.literal("FIXED")
    ),
    quantityPerBase: v.number(),
  },
  handler: async (ctx, args) => {
    // Check if ingredient already exists in recipe
    const existing = await ctx.db
      .query("recipeIngredients")
      .withIndex("by_recipe", (q) => q.eq("recipeId", args.recipeId))
      .filter((q) => q.eq(q.field("itemId"), args.itemId))
      .first();

    if (existing) {
      // Update existing
      await ctx.db.patch(existing._id, {
        calculationBase: args.calculationBase,
        quantityPerBase: args.quantityPerBase,
      });
      return existing._id;
    }

    return await ctx.db.insert("recipeIngredients", {
      recipeId: args.recipeId,
      itemId: args.itemId,
      calculationBase: args.calculationBase,
      quantityPerBase: args.quantityPerBase,
    });
  },
});
