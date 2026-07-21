import { query } from "./_generated/server";

export const allDistricts = query({
  handler: async (ctx) => {
    return await ctx.db.query("bdDistricts").collect();
  }
});
