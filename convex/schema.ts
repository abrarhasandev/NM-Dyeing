import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Hybrid-era schema.
 * - transportEmployees: live Convex domain
 * - orders / batches / invoices: dual-write mirror (Order Workflow Cluster)
 * - remaining tables: dual-write mirror (soft-fail; Mongo remains source of truth for reads)
 *
 * Relational bridge: every mirrored document keeps mongoId (and *MongoId FKs where needed).
 * Browser-direct writes for mirror tables require ORDER_MIRROR_SECRET (mirrorAuth).
 */

const orderTableRow = v.object({
  rollNo: v.optional(v.number()),
  goj: v.optional(v.number()),
});

const batchRow = v.object({
  rollNo: v.optional(v.number()),
  goj: v.optional(v.number()),
  idx: v.optional(v.array(v.number())),
  extraInputs: v.optional(v.array(v.string())),
});

const selectedProcess = v.object({
  name: v.optional(v.string()),
  price: v.optional(v.number()),
});

/** One embedded batch inside the parent Batch document (1 parent per order). */
const embeddedBatch = v.object({
  mongoId: v.optional(v.string()),
  batchName: v.string(),
  status: v.string(),
  customerMongoId: v.optional(v.string()),
  dyeingMongoId: v.optional(v.string()),
  calenderMongoId: v.optional(v.string()),
  rows: v.array(batchRow),
  selectedProcesses: v.array(selectedProcess),
  colour: v.string(),
  quality: v.optional(v.string()),
  sillName: v.string(),
  clotheType: v.optional(v.string()),
  finishingType: v.string(),
  dyeing: v.string(),
  calender: v.optional(v.string()),
  note: v.optional(v.string()),
  invoiceNumber: v.optional(v.string()),
});

const dyeingEmployee = v.object({
  mongoId: v.optional(v.string()),
  employeeName: v.string(),
  designation: v.string(),
  info: v.optional(v.string()),
});

const savedInvoiceRow = v.object({
  recordMongoId: v.optional(v.string()),
  modelType: v.optional(v.string()),
  date: v.optional(v.number()),
  provider: v.optional(v.string()),
  displayOrderId: v.optional(v.string()),
  companyName: v.optional(v.string()),
  description: v.optional(v.string()),
  qty: v.optional(v.number()),
  price: v.optional(v.number()),
  charge: v.optional(v.number()),
  payment: v.optional(v.number()),
  balance: v.optional(v.number()),
  type: v.optional(v.string()),
  clothType: v.optional(v.string()),
  quality: v.optional(v.string()),
  colour: v.optional(v.string()),
  sillName: v.optional(v.string()),
  finishingType: v.optional(v.string()),
});

const ledgerRow = v.object({
  date: v.optional(v.number()),
  provider: v.optional(v.string()),
  displayOrderId: v.optional(v.string()),
  companyName: v.optional(v.string()),
  description: v.optional(v.string()),
  qty: v.optional(v.number()),
  price: v.optional(v.number()),
  charge: v.optional(v.number()),
  payment: v.optional(v.number()),
  balance: v.optional(v.number()),
  colour: v.optional(v.string()),
  type: v.optional(v.string()),
});

/** Simple name-only menu catalog tables. */
const menuNameTable = {
  mongoId: v.string(),
  name: v.string(),
  createdAt: v.number(),
  updatedAt: v.number(),
};

export default defineSchema({
  transportEmployees: defineTable({
    name: v.string(),
    phoneNumbers: v.array(
      v.union(
        v.string(),
        v.object({ number: v.string(), accounts: v.array(v.string()) })
      )
    ),
    address: v.union(
      v.string(),
      v.object({
        nid: v.object({
          division: v.string(),
          district: v.string(),
          upazila: v.string(),
          union: v.optional(v.string()),
          street: v.optional(v.string()),
        }),
        permanent: v.object({
          division: v.string(),
          district: v.string(),
          upazila: v.string(),
          union: v.optional(v.string()),
          street: v.optional(v.string()),
        }),
        current: v.object({
          division: v.string(),
          district: v.string(),
          upazila: v.string(),
          union: v.optional(v.string()),
          street: v.optional(v.string()),
        }),
      })
    ),
    dob: v.optional(v.string()),
    age: v.number(),
    vehicleType: v.string(),
    vehicleWheels: v.number(),
    clothCapacityYards: v.number(),
    avatar: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_name", ["name"])
    .index("by_vehicleType", ["vehicleType"])
    .searchIndex("search_name", { searchField: "name" }),

  /**
   * Manual transport order history (Transport Management only).
   * Greenfield Convex domain — not a dyeing production order.
   * Used to record trips / loads against a transporter without Create Order.
   */
  transportOrders: defineTable({
    transportEmployeeId: v.id("transportEmployees"),
    transporterName: v.string(),
    displayOrderId: v.string(),
    companyName: v.string(),
    clotheType: v.optional(v.string()),
    quality: v.optional(v.string()),
    colour: v.optional(v.string()),
    finishingType: v.optional(v.string()),
    totalGoj: v.optional(v.number()),
    totalBundle: v.optional(v.number()),
    status: v.string(),
    date: v.number(),
    note: v.optional(v.string()),
    /** Optional reference to a system dyeing order (display only / audit). */
    linkedOrderId: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_transportEmployeeId", ["transportEmployeeId"])
    .index("by_transporterName", ["transporterName"])
    .index("by_transportEmployeeId_date", ["transportEmployeeId", "date"])
    .index("by_displayOrderId", ["displayOrderId"]),

  /**
   * Orders mirror.
   * mongoId = original Mongo ObjectId hex — Batch/Invoice FKs use this during dual period.
   */
  orders: defineTable({
    mongoId: v.string(),
    orderId: v.string(),
    customerMongoId: v.string(),
    dyeingMongoId: v.optional(v.string()),
    status: v.string(),
    date: v.optional(v.number()),
    invoiceNumber: v.optional(v.string()),
    companyName: v.optional(v.string()),
    clotheType: v.optional(v.string()),
    finishingWidth: v.optional(v.number()),
    quality: v.optional(v.string()),
    sillName: v.optional(v.string()),
    colour: v.optional(v.string()),
    finishingType: v.optional(v.string()),
    totalGoj: v.optional(v.number()),
    totalBundle: v.optional(v.number()),
    dyeingName: v.optional(v.string()),
    transporterName: v.optional(v.string()),
    tableData: v.array(orderTableRow),
    isTrash: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_mongoId", ["mongoId"])
    .index("by_orderId", ["orderId"])
    .index("by_date", ["date"])
    .index("by_status", ["status"])
    .index("by_isTrash", ["isTrash"])
    .index("by_transporterName", ["transporterName"])
    .index("by_customerMongoId", ["customerMongoId"])
    .index("by_isTrash_date", ["isTrash", "date"]),

  /**
   * Batch parent documents (1 per order in Mongo).
   * orderMongoId links to orders.mongoId for relational integrity.
   */
  batches: defineTable({
    mongoId: v.string(),
    orderMongoId: v.string(),
    batches: v.array(embeddedBatch),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_mongoId", ["mongoId"])
    .index("by_orderMongoId", ["orderMongoId"]),

  /**
   * Invoices linked to an order; batchMongoIds are embedded batch subdocument ids.
   */
  invoices: defineTable({
    mongoId: v.string(),
    invoiceNumber: v.string(),
    orderMongoId: v.string(),
    batchMongoIds: v.array(v.string()),
    totalAmount: v.number(),
    status: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_mongoId", ["mongoId"])
    .index("by_invoiceNumber", ["invoiceNumber"])
    .index("by_orderMongoId", ["orderMongoId"]),

  // ─── Remaining domain mirrors ─────────────────────────────────────────────

  customers: defineTable({
    mongoId: v.string(),
    companyName: v.string(),
    ownerName: v.string(),
    address: v.string(),
    phoneNumber: v.string(),
    employeeList: v.array(v.string()),
    searchText: v.optional(v.string()),
    initialCharge: v.number(),
    initialPayment: v.number(),
    initialDate: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_mongoId", ["mongoId"])
    .index("by_companyName", ["companyName"]),

  dyeings: defineTable({
    mongoId: v.string(),
    name: v.string(),
    location: v.string(),
    employees: v.array(dyeingEmployee),
    initialCharge: v.number(),
    initialPayment: v.number(),
    initialDate: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_mongoId", ["mongoId"])
    .index("by_name", ["name"]),

  calenders: defineTable({
    mongoId: v.string(),
    name: v.string(),
    location: v.string(),
    initialCharge: v.number(),
    initialPayment: v.number(),
    initialDate: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_mongoId", ["mongoId"])
    .index("by_name", ["name"]),

  payments: defineTable({
    mongoId: v.string(),
    userMongoId: v.optional(v.string()),
    customerMongoId: v.optional(v.string()),
    dyeingMongoId: v.optional(v.string()),
    calenderMongoId: v.optional(v.string()),
    amount: v.number(),
    method: v.string(),
    description: v.optional(v.string()),
    date: v.optional(v.number()),
    isSavedInLedger: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_mongoId", ["mongoId"])
    .index("by_customerMongoId", ["customerMongoId"])
    .index("by_dyeingMongoId", ["dyeingMongoId"])
    .index("by_calenderMongoId", ["calenderMongoId"]),

  billingSummaries: defineTable({
    mongoId: v.string(),
    orderMongoId: v.string(),
    displayOrderId: v.optional(v.string()),
    companyName: v.string(),
    invoiceNumber: v.string(),
    summaryType: v.string(),
    price: v.number(),
    total: v.number(),
    totalQty: v.number(),
    batchName: v.string(),
    clotheType: v.optional(v.string()),
    quality: v.optional(v.string()),
    colour: v.optional(v.string()),
    sillName: v.optional(v.string()),
    finishingType: v.optional(v.string()),
    customerMongoId: v.optional(v.string()),
    dyeing: v.optional(v.string()),
    dyeingMongoId: v.optional(v.string()),
    calender: v.optional(v.string()),
    calenderMongoId: v.optional(v.string()),
    isSavedInLedger: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_mongoId", ["mongoId"])
    .index("by_invoiceNumber", ["invoiceNumber"])
    .index("by_orderMongoId", ["orderMongoId"])
    .index("by_summaryType", ["summaryType"])
    .index("by_customerMongoId", ["customerMongoId"]),

  savedInvoices: defineTable({
    mongoId: v.string(),
    entityMongoId: v.string(),
    entityType: v.string(),
    invoiceNumber: v.string(),
    title: v.optional(v.string()),
    companyName: v.optional(v.string()),
    orderIds: v.array(v.string()),
    records: v.array(savedInvoiceRow),
    totalCharge: v.number(),
    totalPayment: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_mongoId", ["mongoId"])
    .index("by_invoiceNumber", ["invoiceNumber"])
    .index("by_entity", ["entityMongoId", "entityType"]),

  ledgerSnapshots: defineTable({
    mongoId: v.string(),
    entityMongoId: v.string(),
    entityType: v.string(),
    title: v.string(),
    fromDate: v.number(),
    closedAt: v.number(),
    ledgerData: v.array(ledgerRow),
    totalCharge: v.number(),
    totalPayment: v.number(),
    finalBalance: v.number(),
    openingBalance: v.number(),
    initialCharge: v.number(),
    initialPayment: v.number(),
    initialDate: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_mongoId", ["mongoId"])
    .index("by_entity", ["entityMongoId", "entityType"]),

  /**
   * Auth users mirror — password hashes intentionally omitted from dual-write.
   * Auth remains Mongo/NextAuth; this is a structural mirror only.
   */
  users: defineTable({
    mongoId: v.string(),
    name: v.string(),
    email: v.string(),
    role: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_mongoId", ["mongoId"])
    .index("by_email", ["email"]),

  clothTypes: defineTable(menuNameTable)
    .index("by_mongoId", ["mongoId"])
    .index("by_name", ["name"]),

  colours: defineTable(menuNameTable)
    .index("by_mongoId", ["mongoId"])
    .index("by_name", ["name"]),

  finishingTypes: defineTable(menuNameTable)
    .index("by_mongoId", ["mongoId"])
    .index("by_name", ["name"]),

  processes: defineTable({
    mongoId: v.string(),
    name: v.string(),
    price: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_mongoId", ["mongoId"])
    .index("by_name", ["name"]),

  qualities: defineTable(menuNameTable)
    .index("by_mongoId", ["mongoId"])
    .index("by_name", ["name"]),

  sillNames: defineTable(menuNameTable)
    .index("by_mongoId", ["mongoId"])
    .index("by_name", ["name"]),

  bdDivisions: defineTable({
    name: v.string(),
    bn_name: v.string(),
  }).index("by_name", ["name"]),

  bdDistricts: defineTable({
    divisionName: v.string(),
    name: v.string(),
    bn_name: v.string(),
  })
    .index("by_division", ["divisionName"])
    .index("by_name", ["name"]),

  bdUpazilas: defineTable({
    districtName: v.string(),
    name: v.string(),
    bn_name: v.string(),
  })
    .index("by_district", ["districtName"])
    .index("by_name", ["name"]),

  bdUnions: defineTable({
    upazilaName: v.string(),
    name: v.string(),
    bn_name: v.string(),
  })
    .index("by_upazila", ["upazilaName"])
    .index("by_name", ["name"]),
});
