import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { assertMirrorSecret } from "./lib/mirrorAuth";

/**
 * Menu catalog mirrors (ClothType, Colour, FinishingType, Process, Quality, SillName).
 */

const nameFields = {
  mongoId: v.string(),
  name: v.string(),
  createdAt: v.number(),
  updatedAt: v.number(),
};

const processFields = {
  mongoId: v.string(),
  name: v.string(),
  price: v.number(),
  createdAt: v.number(),
  updatedAt: v.number(),
};

type NameTable =
  | "clothTypes"
  | "colours"
  | "finishingTypes"
  | "qualities"
  | "sillNames";

function makeNameMirror(table: NameTable) {
  return {
    countAll: query({
      args: {},
      handler: async (ctx) => {
        const all = await ctx.db.query(table).collect();
        return { total: all.length };
      },
    }),
    mirrorUpsert: mutation({
      args: {
        mirrorSecret: v.string(),
        ...nameFields,
      },
      handler: async (ctx, args) => {
        assertMirrorSecret(args.mirrorSecret);
        const { mirrorSecret: _s, ...fields } = args;
        const existing = await ctx.db
          .query(table)
          .withIndex("by_mongoId", (q) => q.eq("mongoId", fields.mongoId))
          .unique();
        if (existing) {
          await ctx.db.patch(existing._id, fields);
          return existing._id;
        }
        return await ctx.db.insert(table, fields);
      },
    }),
    mirrorRemove: mutation({
      args: {
        mirrorSecret: v.string(),
        mongoId: v.string(),
      },
      handler: async (ctx, args) => {
        assertMirrorSecret(args.mirrorSecret);
        const existing = await ctx.db
          .query(table)
          .withIndex("by_mongoId", (q) => q.eq("mongoId", args.mongoId))
          .unique();
        if (!existing) return null;
        await ctx.db.delete(existing._id);
        return existing._id;
      },
    }),
  };
}

const cloth = makeNameMirror("clothTypes");
const colour = makeNameMirror("colours");
const finishing = makeNameMirror("finishingTypes");
const quality = makeNameMirror("qualities");
const sill = makeNameMirror("sillNames");

export const clothTypesCountAll = cloth.countAll;
export const clothTypesMirrorUpsert = cloth.mirrorUpsert;
export const clothTypesMirrorRemove = cloth.mirrorRemove;

export const coloursCountAll = colour.countAll;
export const coloursMirrorUpsert = colour.mirrorUpsert;
export const coloursMirrorRemove = colour.mirrorRemove;

export const finishingTypesCountAll = finishing.countAll;
export const finishingTypesMirrorUpsert = finishing.mirrorUpsert;
export const finishingTypesMirrorRemove = finishing.mirrorRemove;

export const qualitiesCountAll = quality.countAll;
export const qualitiesMirrorUpsert = quality.mirrorUpsert;
export const qualitiesMirrorRemove = quality.mirrorRemove;

export const sillNamesCountAll = sill.countAll;
export const sillNamesMirrorUpsert = sill.mirrorUpsert;
export const sillNamesMirrorRemove = sill.mirrorRemove;

export const processesCountAll = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("processes").collect();
    return { total: all.length };
  },
});

export const processesMirrorUpsert = mutation({
  args: {
    mirrorSecret: v.string(),
    ...processFields,
  },
  handler: async (ctx, args) => {
    assertMirrorSecret(args.mirrorSecret);
    const { mirrorSecret: _s, ...fields } = args;
    const existing = await ctx.db
      .query("processes")
      .withIndex("by_mongoId", (q) => q.eq("mongoId", fields.mongoId))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, fields);
      return existing._id;
    }
    return await ctx.db.insert("processes", fields);
  },
});

export const processesMirrorRemove = mutation({
  args: {
    mirrorSecret: v.string(),
    mongoId: v.string(),
  },
  handler: async (ctx, args) => {
    assertMirrorSecret(args.mirrorSecret);
    const existing = await ctx.db
      .query("processes")
      .withIndex("by_mongoId", (q) => q.eq("mongoId", args.mongoId))
      .unique();
    if (!existing) return null;
    await ctx.db.delete(existing._id);
    return existing._id;
  },
});
