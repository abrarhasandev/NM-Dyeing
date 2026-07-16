import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Transport order history — Convex-native domain for Transport Management.
 * These are manual history rows for a transporter, not dyeing production orders.
 */

function generateDisplayOrderId(dateMs: number): string {
  const d = new Date(dateMs);
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  const random = Math.floor(Math.random() * 900) + 100;
  return `#tr-${year}-${month}${day}-${random}`;
}

export const listByEmployee = query({
  args: {
    transportEmployeeId: v.id("transportEmployees"),
    isTrash: v.optional(v.boolean()),
    billingStatus: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let q;
    if (args.billingStatus) {
      q = ctx.db
        .query("transportOrders")
        .withIndex("by_transportEmployeeId_billingStatus", (q) =>
          q.eq("transportEmployeeId", args.transportEmployeeId)
           .eq("billingStatus", args.billingStatus)
        );
    } else {
      q = ctx.db
        .query("transportOrders")
        .withIndex("by_transportEmployeeId", (q) =>
          q.eq("transportEmployeeId", args.transportEmployeeId)
        );
    }
    const rows = await q.collect();

    const isTrashMode = args.isTrash === true;
    const filtered = rows.filter((r) => (r.isTrash === true) === isTrashMode);

    // Newest first
    return filtered.sort((a, b) => (b.date ?? 0) - (a.date ?? 0) || b.createdAt - a.createdAt);
  },
});

export const create = mutation({
  args: {
    transportEmployeeId: v.id("transportEmployees"),
    transporterName: v.string(),
    companyName: v.string(),
    clotheType: v.optional(v.string()),
    quality: v.optional(v.string()),
    colour: v.optional(v.string()),
    finishingType: v.optional(v.string()),
    totalGoj: v.optional(v.number()),
    totalBundle: v.optional(v.number()),
    status: v.optional(v.string()),
    date: v.number(),
    note: v.optional(v.string()),
    linkedOrderId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const employee = await ctx.db.get(args.transportEmployeeId);
    if (!employee) {
      throw new Error("Transport employee not found");
    }

    const companyName = args.companyName.trim();
    if (!companyName) {
      throw new Error("Company / customer name is required");
    }

    const now = Date.now();
    const dateMs = Number.isFinite(args.date) ? args.date : now;

    const id = await ctx.db.insert("transportOrders", {
      transportEmployeeId: args.transportEmployeeId,
      transporterName: args.transporterName.trim() || employee.name,
      displayOrderId: generateDisplayOrderId(dateMs),
      companyName,
      clotheType: args.clotheType?.trim() || undefined,
      quality: args.quality?.trim() || undefined,
      colour: args.colour?.trim() || undefined,
      finishingType: args.finishingType?.trim() || undefined,
      totalGoj: args.totalGoj,
      totalBundle: args.totalBundle,
      status: (args.status || "pending").toLowerCase(),
      date: dateMs,
      note: args.note?.trim() || undefined,
      linkedOrderId: args.linkedOrderId?.trim() || undefined,
      billingStatus: "unpaid",
      createdAt: now,
      updatedAt: now,
    });

    return id;
  },
});

export const update = mutation({
  args: {
    id: v.id("transportOrders"),
    companyName: v.optional(v.string()),
    clotheType: v.optional(v.string()),
    quality: v.optional(v.string()),
    colour: v.optional(v.string()),
    finishingType: v.optional(v.string()),
    totalGoj: v.optional(v.number()),
    totalBundle: v.optional(v.number()),
    status: v.optional(v.string()),
    date: v.optional(v.number()),
    note: v.optional(v.string()),
    linkedOrderId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Transport order not found");

    const patch: Record<string, unknown> = { updatedAt: Date.now() };

    if (args.companyName !== undefined) {
      const name = args.companyName.trim();
      if (!name) throw new Error("Company / customer name is required");
      patch.companyName = name;
    }
    if (args.clotheType !== undefined) patch.clotheType = args.clotheType.trim() || undefined;
    if (args.quality !== undefined) patch.quality = args.quality.trim() || undefined;
    if (args.colour !== undefined) patch.colour = args.colour.trim() || undefined;
    if (args.finishingType !== undefined) {
      patch.finishingType = args.finishingType.trim() || undefined;
    }
    if (args.totalGoj !== undefined) patch.totalGoj = args.totalGoj;
    if (args.totalBundle !== undefined) patch.totalBundle = args.totalBundle;
    if (args.status !== undefined) patch.status = args.status.toLowerCase();
    if (args.date !== undefined) patch.date = args.date;
    if (args.note !== undefined) patch.note = args.note.trim() || undefined;
    if (args.linkedOrderId !== undefined) {
      patch.linkedOrderId = args.linkedOrderId.trim() || undefined;
    }

    await ctx.db.patch(args.id, patch);
    return args.id;
  },
});

export const remove = mutation({
  args: { id: v.id("transportOrders") },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) return null;
    await ctx.db.delete(args.id);
    return args.id;
  },
});

export const trash = mutation({
  args: { id: v.id("transportOrders") },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) return null;
    await ctx.db.patch(args.id, { isTrash: true });
    return args.id;
  },
});

export const restore = mutation({
  args: { id: v.id("transportOrders") },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) return null;
    await ctx.db.patch(args.id, { isTrash: false });
    return args.id;
  },
});
