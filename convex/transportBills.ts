import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// ─── Queries ────────────────────────────────────────────────

export const listByEmployee = query({
  args: { transportEmployeeId: v.id("transportEmployees") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("transportEmployeeBills")
      .withIndex("by_employee", (q) => q.eq("transportEmployeeId", args.transportEmployeeId))
      .order("desc")
      .collect();
  },
});

export const getBillDetails = query({
  args: { id: v.id("transportEmployeeBills") },
  handler: async (ctx, args) => {
    const bill = await ctx.db.get(args.id);
    if (!bill) return null;

    const orders = [];
    for (const orderId of bill.orderIds) {
      const convexId = ctx.db.normalizeId("transportOrders", orderId);
      if (convexId) {
        const order = await ctx.db.get(convexId);
        if (order) orders.push(order);
      } else {
        // Just push a placeholder for Mongo IDs so the UI knows they exist.
        // Real details will be fetched on the client side.
        orders.push({ _id: orderId, isMongo: true });
      }
    }
    return { ...bill, populatedOrders: orders };
  },
});

// ─── Mutations ──────────────────────────────────────────────

export const createBill = mutation({
  args: {
    transportEmployeeId: v.id("transportEmployees"),
    totalAmount: v.number(),
    orderIds: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.orderIds.length === 0) {
      throw new Error("Must select at least one order to bill");
    }

    // Generate bill number (e.g., TRNBILL-1001 or timestamp-based)
    const billNumber = `TRNBILL-${Date.now()}`;

    // Create the bill
    const billId = await ctx.db.insert("transportEmployeeBills", {
      transportEmployeeId: args.transportEmployeeId,
      billNumber,
      totalAmount: args.totalAmount,
      status: "paid",
      orderIds: args.orderIds,
      date: Date.now(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Mark the associated orders as billed
    for (const orderId of args.orderIds) {
      const convexId = ctx.db.normalizeId("transportOrders", orderId);
      if (convexId) {
        const order = await ctx.db.get(convexId);
        if (order && order.billingStatus !== "paid") {
          await ctx.db.patch(convexId, {
            billingStatus: "paid",
            billId,
            updatedAt: Date.now(),
          });
        } else if (order?.billingStatus === "paid") {
            throw new Error(`Order ${order.displayOrderId} has already been billed.`);
        }
      }
    }

    return billId;
  },
});

export const deleteBill = mutation({
    args: { id: v.id("transportEmployeeBills") },
    handler: async (ctx, args) => {
        const bill = await ctx.db.get(args.id);
        if (!bill) return null;
        
        // Restore associated orders back to unpaid
        for (const orderId of bill.orderIds) {
            const convexId = ctx.db.normalizeId("transportOrders", orderId);
            if (convexId) {
                const order = await ctx.db.get(convexId);
                if (order && order.billId === args.id) {
                    await ctx.db.patch(convexId, {
                        billingStatus: "unpaid",
                        billId: undefined,
                        updatedAt: Date.now(),
                    });
                }
            }
        }
        
        await ctx.db.delete(args.id);
        return args.id;
    }
});

export const updateBillStatus = mutation({
    args: { 
        id: v.id("transportEmployeeBills"),
        status: v.string() // "paid" | "unpaid"
    },
    handler: async (ctx, args) => {
        const bill = await ctx.db.get(args.id);
        if (!bill) throw new Error("Bill not found");
        
        await ctx.db.patch(args.id, {
            status: args.status,
            updatedAt: Date.now()
        });

        // Also update the order status to match
        for (const orderId of bill.orderIds) {
            const convexId = ctx.db.normalizeId("transportOrders", orderId);
            if (convexId) {
                await ctx.db.patch(convexId, {
                    billingStatus: args.status,
                    updatedAt: Date.now()
                });
            }
        }
        
        return args.id;
    }
});
