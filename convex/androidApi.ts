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
    const employee = (await ctx.db.get(employeeId)) as any;
    
    if (!employee) {
      throw new Error("Employee not found");
    }

    // Exclude password and sensitive info from the response
    const { password, ...safeProfile } = employee as any;
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
    const employee = (await ctx.db.get(employeeId)) as any;
    if (!employee) throw new Error("Employee not found");

    // 5 months ago timestamp
    const fiveMonthsAgo = Date.now() - 5 * 30 * 24 * 60 * 60 * 1000;

    // Fetch manual transport orders assigned to this employee (last 5 months)
    const manualOrders = await ctx.db
      .query("transportOrders")
      .withIndex("by_transportEmployeeId_date", (q: any) => 
        q.eq("transportEmployeeId", employeeId).gte("date", fiveMonthsAgo)
      )
      .order("desc")
      .collect();

    // Fetch system production orders assigned to this employee
    const systemOrdersRaw = await ctx.db
      .query("orders")
      .withIndex("by_transporterName", (q: any) => q.eq("transporterName", employee.name))
      .order("desc")
      .collect();

    // Filter system orders for last 5 months and exclude trashed orders
    const systemOrdersFiltered = systemOrdersRaw.filter((o: any) => {
      const orderDate = o.date || o.createdAt || 0;
      return orderDate >= fiveMonthsAgo && !o.isTrash;
    });

    // To determine billing status for system orders, fetch the employee's bills
    const bills = await ctx.db
      .query("transportEmployeeBills")
      .withIndex("by_employee", (q: any) => q.eq("transportEmployeeId", employeeId))
      .collect();

    // Collect all billed system order mongoIds
    const billedMongoIds = new Set<string>();
    for (const bill of bills) {
      for (const oId of bill.orderIds) {
        // If the bill is paid, the order is paid. Otherwise it's unpaid.
        if (bill.status === "paid") {
          billedMongoIds.add(oId);
        }
      }
    }

    // Map system orders to match transportOrders format for the Android app
    const systemOrdersMapped = systemOrdersFiltered.map((o: any) => ({
      _id: o._id,
      _creationTime: o._creationTime,
      transportEmployeeId: employeeId,
      transporterName: o.transporterName,
      displayOrderId: o.orderId,
      companyName: o.companyName || "",
      clotheType: o.clotheType,
      quality: o.quality,
      colour: o.colour,
      finishingType: o.finishingType,
      totalGoj: o.totalGoj || 0,
      totalBundle: o.totalBundle || 0,
      status: o.status,
      date: o.date || o.createdAt || o._creationTime,
      isTrash: o.isTrash,
      // Map billed status based on whether it exists in a paid bill
      billingStatus: billedMongoIds.has(o.mongoId) ? "paid" : "unpaid",
    }));

    // Combine and sort by date descending
    const combinedOrders = [...manualOrders, ...systemOrdersMapped].sort(
      (a: any, b: any) => (b.date || 0) - (a.date || 0)
    );

    return combinedOrders;
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
