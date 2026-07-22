import { query } from "./_generated/server";

export const checkLogins = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("transportEmployees").collect();
    return all.map(a => ({ id: a._id, name: a.name, loginId: a.loginId }));
  }
});
