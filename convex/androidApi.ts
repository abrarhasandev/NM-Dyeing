import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Helper to validate a session token and return the employeeId.
 * Throws an error if the token is invalid or expired.
 */
async function getEmployeeIdFromToken(ctx: any, token: string) {
  const session = await ctx.db
    .query("transportEmployeeSessions")
    .withIndex("by_token", (q: any) => q.eq("token", token))
    .first();

  if (!session || Date.now() > session.expiresAt) {
    throw new Error("Unauthorized: Invalid or expired session");
  }

  return session.employeeId;
}

/**
 * Fetch the logged-in employee's profile data.
 */
export const getProfile = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const employeeId = await getEmployeeIdFromToken(ctx, args.token);
    const employee = await ctx.db.get(employeeId);
    
    if (!employee) {
      throw new Error("Employee not found");
    }

    // Exclude password and sensitive info from the response
    const { password, ...safeProfile } = employee;
    return safeProfile;
  },
});

/**
 * Fetch transport orders assigned to the logged-in employee.
 */
export const getMyOrders = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const employeeId = await getEmployeeIdFromToken(ctx, args.token);

    // Fetch orders assigned to this employee, ordered by date or creation (newest first)
    const orders = await ctx.db
      .query("transportOrders")
      .withIndex("by_transportEmployeeId", (q: any) => q.eq("transportEmployeeId", employeeId))
      .order("desc")
      .collect();

    return orders;
  },
});

/**
 * Fetch billing records for the logged-in employee.
 */
export const getMyBills = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const employeeId = await getEmployeeIdFromToken(ctx, args.token);

    const bills = await ctx.db
      .query("transportEmployeeBills")
      .withIndex("by_employee", (q: any) => q.eq("transportEmployeeId", employeeId))
      .order("desc")
      .collect();

    return bills;
  },
});

/**
 * Update FCM Token for push notifications.
 */
export const updateFCMToken = mutation({
  args: {
    token: v.string(),
    fcmToken: v.string(),
  },
  handler: async (ctx, args) => {
    const employeeId = await getEmployeeIdFromToken(ctx, args.token);
    
    await ctx.db.patch(employeeId, {
      fcmToken: args.fcmToken,
    });

    return { success: true };
  },
});
