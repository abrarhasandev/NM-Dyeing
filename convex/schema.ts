import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    email: v.string(),
    role: v.union(
      v.literal("admin"),
      v.literal("store_manager"),
      v.literal("dyeing_master"),
      v.literal("accountant")
    ),
    shift: v.optional(v.string()), // Morning, Evening, Night
    isActive: v.boolean(),
  }).index("by_email", ["email"]),

  suppliers: defineTable({
    name: v.string(),
    contactPerson: v.optional(v.string()),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    address: v.optional(v.string()),
    balanceDue: v.number(), // Automatically updated via ledger
  }),

  financialLedgers: defineTable({
    supplierId: v.id("suppliers"),
    type: v.union(
      v.literal("Invoice"), // GRN / Purchase
      v.literal("Payment"),
      v.literal("Adjustment")
    ),
    amount: v.number(), // Amount in BDT
    date: v.string(), // ISO String
    referenceNumber: v.optional(v.string()), // PO or Check number
    notes: v.optional(v.string()),
  }).index("by_supplier", ["supplierId"]),

  chemicals: defineTable({
    name: v.string(),
    category: v.union(
      v.literal("Dyes"),
      v.literal("Auxiliaries"),
      v.literal("Basic Chemicals")
    ),
    uom: v.union(v.literal("Kg"), v.literal("g"), v.literal("L"), v.literal("ml")), // Unit of Measurement
    minimumStockLevel: v.number(),
    currentStock: v.number(), // Denormalized for quick access
  }).index("by_category", ["category"]),

  chemicalBatches: defineTable({
    chemicalId: v.id("chemicals"),
    lotNumber: v.string(),
    manufacturingDate: v.optional(v.string()),
    expirationDate: v.optional(v.string()),
    barcode: v.optional(v.string()),
    initialQuantity: v.number(),
    currentQuantity: v.number(),
    supplierId: v.optional(v.id("suppliers")),
  }).index("by_chemical", ["chemicalId"]),

  stockTransactions: defineTable({
    type: v.union(
      v.literal("Stock In"),
      v.literal("Issue"),
      v.literal("Waste")
    ),
    chemicalId: v.id("chemicals"),
    batchId: v.optional(v.id("chemicalBatches")),
    quantity: v.number(), // Positive for Stock In, Negative for Issue/Waste
    date: v.string(),
    jobOrderId: v.optional(v.string()), // To track which batch it went to
    machineId: v.optional(v.string()),
    shift: v.optional(v.string()),
    userId: v.optional(v.id("users")), // Who made the transaction
    notes: v.optional(v.string()),
  }).index("by_chemical", ["chemicalId"]).index("by_date", ["date"]),
});
