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
    billingStatus: v.optional(v.string()),
    billId: v.optional(v.id("transportEmployeeBills")),
    isTrash: v.optional(v.boolean()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_transportEmployeeId", ["transportEmployeeId"])
    .index("by_transporterName", ["transporterName"])
    .index("by_transportEmployeeId_date", ["transportEmployeeId", "date"])
    .index("by_displayOrderId", ["displayOrderId"])
    .index("by_billingStatus", ["billingStatus"])
    .index("by_transportEmployeeId_billingStatus", ["transportEmployeeId", "billingStatus"]),

  /**
   * Billing history for transport employees.
   */
  transportEmployeeBills: defineTable({
    transportEmployeeId: v.id("transportEmployees"),
    billNumber: v.string(),
    totalAmount: v.number(),
    status: v.string(),
    orderIds: v.array(v.string()),
    date: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_employee", ["transportEmployeeId"])
    .index("by_status", ["status"])
    .index("by_employee_date", ["transportEmployeeId", "date"]),

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

  // ==========================================
  // ERP: INVENTORY & STATEFUL STOCK MANAGEMENT
  // ==========================================
  inventoryItems: defineTable({
    itemCode: v.string(),
    name: v.string(),
    itemGroup: v.string(),
    category: v.optional(v.union(v.literal("DYE"), v.literal("CHEMICAL"), v.literal("AUXILIARY"))),
    defaultUom: v.string(),
    purchasingUoM: v.optional(v.string()),
    consumingUoM: v.optional(v.string()),
    conversionRate: v.optional(v.number()),
    maintainStock: v.boolean(),
    isFixedAsset: v.boolean(),
    currentStock: v.number(),
    reservedStock: v.number(),
    availableStock: v.number(),
    movingAveragePrice: v.number(),
    reorderLevel: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_category", ["category"]).index("by_itemCode", ["itemCode"]),

  inventoryLedger: defineTable({
    itemId: v.id("inventoryItems"),
    transactionType: v.union(
      v.literal("PURCHASE_IN"), 
      v.literal("RESERVE"), 
      v.literal("RELEASE_RESERVE"),
      v.literal("CONSUME_ACTUAL"), 
      v.literal("AUDIT_ADJUSTMENT")
    ),
    quantity: v.number(),
    unitCostAtTransaction: v.optional(v.number()),
    batchId: v.optional(v.string()), 
    auditId: v.optional(v.id("stockAudits")),
    note: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_item", ["itemId"]).index("by_batch", ["batchId"]),

  // ==========================================
  // ERP: AUDIT & RECONCILIATION
  // ==========================================
  stockAudits: defineTable({
    auditMonth: v.string(),
    status: v.union(v.literal("DRAFT"), v.literal("COMPLETED")),
    completedBy: v.optional(v.string()),
    completedAt: v.optional(v.number()),
    totalFinancialImpact: v.optional(v.number()),
  }).index("by_status", ["status"]),

  stockAuditItems: defineTable({
    auditId: v.id("stockAudits"),
    itemId: v.id("inventoryItems"),
    systemStock: v.number(),
    physicalStock: v.number(),
    variance: v.number(),
    discrepancyReason: v.optional(v.string()),
    financialImpact: v.number(),
  }).index("by_audit", ["auditId"]),

  // ==========================================
  // ERP: NON-LINEAR RECIPES (BOM)
  // ==========================================
  recipes: defineTable({
    name: v.string(),
    colourId: v.string(),
    clothTypeId: v.string(),
    active: v.boolean(),
  }).index("by_colour_cloth", ["colourId", "clothTypeId"]),

  recipeIngredients: defineTable({
    recipeId: v.id("recipes"),
    itemId: v.id("inventoryItems"),
    calculationBase: v.union(
      v.literal("FABRIC_WEIGHT"),
      v.literal("LIQUOR_RATIO"),
      v.literal("MACHINE_CAPACITY"),
      v.literal("FIXED")
    ),
    quantityPerBase: v.number(),
  }).index("by_recipe", ["recipeId"]),

  // ==========================================
  // ERP: SOP & COMPLIANCE EXECUTION
  // ==========================================
  sops: defineTable({
    processName: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    isMandatory: v.boolean(),
  }).index("by_process", ["processName"]),

  sopExecutionLogs: defineTable({
    batchId: v.string(),
    sopId: v.id("sops"),
    operatorId: v.string(),
    status: v.union(v.literal("CHECKED"), v.literal("FAILED"), v.literal("SKIPPED")),
    timestamp: v.number(),
  }).index("by_batch", ["batchId"]),
  // ==========================================
  // ERP: EXTENDED STOCK MODULE (ERPNext Style)
  // ==========================================
  
  // Core Transactions
  stockEntries: defineTable({
    entryType: v.string(),
    postingDate: v.number(),
    status: v.string(),
    items: v.array(v.object({ itemId: v.id("inventoryItems"), qty: v.number(), sourceWarehouse: v.optional(v.string()), targetWarehouse: v.optional(v.string()) })),
    totalAmount: v.optional(v.number()),
  }).index("by_postingDate", ["postingDate"]).index("by_status", ["status"]),
  
  purchaseReceipts: defineTable({
    receiptNo: v.string(),
    postingDate: v.number(),
    supplier: v.string(),
    status: v.string(),
    items: v.array(v.object({ itemId: v.id("inventoryItems"), qty: v.number(), acceptedQty: v.number(), rate: v.number(), amount: v.number() })),
    grandTotal: v.number(),
  }).index("by_receiptNo", ["receiptNo"]).index("by_postingDate", ["postingDate"]),
  
  deliveryNotes: defineTable({
    deliveryNo: v.string(),
    customer: v.string(),
    postingDate: v.number(),
    status: v.string(),
    items: v.array(v.object({ itemId: v.id("inventoryItems"), qty: v.number(), rate: v.number(), amount: v.number() })),
    grandTotal: v.number(),
  }).index("by_deliveryNo", ["deliveryNo"]),

  materialRequests: defineTable({
    requestNo: v.string(),
    transactionDate: v.number(),
    requestType: v.string(), // Purchase, Material Transfer, Material Issue
    status: v.string(),
    items: v.array(v.object({ itemId: v.id("inventoryItems"), qty: v.number(), uom: v.string() })),
  }).index("by_requestNo", ["requestNo"]),

  pickLists: defineTable({
    pickListNo: v.string(),
    date: v.number(),
    purpose: v.string(),
    status: v.string(),
    items: v.array(v.object({ itemId: v.id("inventoryItems"), qty: v.number(), warehouse: v.string() })),
  }),

  // Tools
  stockReconciliations: defineTable({
    postingDate: v.number(),
    postingTime: v.string(),
    purpose: v.string(),
    items: v.array(v.object({ itemId: v.id("inventoryItems"), warehouse: v.string(), qty: v.number(), valuationRate: v.number() })),
  }),
  
  landedCostVouchers: defineTable({
    company: v.string(),
    postingDate: v.number(),
    receiptDocumentType: v.string(), // Purchase Receipt, Purchase Invoice
    receiptDocument: v.string(),
    taxesAndCharges: v.array(v.object({ description: v.string(), amount: v.number() })),
  }),
  
  repostItemValuations: defineTable({
    itemId: v.id("inventoryItems"),
    warehouse: v.optional(v.string()),
    postingDate: v.number(),
    postingTime: v.string(),
    status: v.string(),
  }),
  
  packingSlips: defineTable({
    deliveryNote: v.string(),
    customer: v.string(),
    items: v.array(v.object({ itemId: v.id("inventoryItems"), qty: v.number(), netWeight: v.number() })),
  }),
  
  qualityInspections: defineTable({
    inspectionType: v.string(),
    referenceType: v.string(),
    referenceName: v.string(),
    itemId: v.id("inventoryItems"),
    status: v.string(),
    readings: v.array(v.object({ parameter: v.string(), readingValue: v.string(), accepted: v.boolean() })),
  }),

  // Setup Entities (Items already covered by inventoryItems, but adding extended variants)
  itemGroups: defineTable({
    name: v.string(),
    parentItemGroup: v.optional(v.string()),
    isGroup: v.boolean(),
  }),
  
  itemAttributes: defineTable({
    name: v.string(),
    numericValues: v.boolean(),
    values: v.array(v.object({ value: v.string(), abbr: v.optional(v.string()) })),
  }),
  
  brands: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
  }),
  
  warehouses: defineTable({
    name: v.string(),
    isGroup: v.boolean(),
    parentWarehouse: v.optional(v.string()),
    account: v.optional(v.string()),
  }),
  
  uoms: defineTable({
    name: v.string(),
    mustBeWholeNumber: v.boolean(),
  }),
  
  uomConversionFactors: defineTable({
    fromUom: v.string(),
    toUom: v.string(),
    value: v.number(),
  }),
  
  serialNos: defineTable({
    serialNo: v.string(),
    itemId: v.id("inventoryItems"),
    warehouse: v.optional(v.string()),
    status: v.string(),
  }),
  
  batchNos: defineTable({
    batchNo: v.string(),
    itemId: v.id("inventoryItems"),
    expiryDate: v.optional(v.number()),
  }),
  
  serialAndBatchBundles: defineTable({
    voucherType: v.string(),
    voucherNo: v.string(),
    itemId: v.id("inventoryItems"),
    entries: v.array(v.object({ serialNo: v.optional(v.string()), batchNo: v.optional(v.string()), qty: v.number() })),
  }),
  
  inventoryDimensions: defineTable({
    name: v.string(),
    documentType: v.string(),
    mandatory: v.boolean(),
  }),
  
  shippingRules: defineTable({
    name: v.string(),
    shippingRuleType: v.string(),
    account: v.string(),
    conditions: v.array(v.object({ fromValue: v.number(), toValue: v.number(), shippingAmount: v.number() })),
  }),
  
  itemAlternatives: defineTable({
    itemId: v.id("inventoryItems"),
    alternativeItemId: v.id("inventoryItems"),
    twoWay: v.boolean(),
  }),
  
  qualityInspectionTemplates: defineTable({
    name: v.string(),
    parameters: v.array(v.object({ parameter: v.string(), acceptanceCriteria: v.string() })),
  }),
  
  deliveryTrips: defineTable({
    tripName: v.string(),
    driver: v.string(),
    vehicle: v.string(),
    date: v.number(),
    stops: v.array(v.object({ customer: v.string(), deliveryNote: v.string() })),
  }),

  // Settings
  stockSettings: defineTable({
    itemNamingBy: v.string(),
    defaultValueWarehouse: v.optional(v.string()),
    showBarcodeField: v.boolean(),
    autoInsertPriceListRate: v.boolean(),
  }),
  
  itemVariantSettings: defineTable({
    allowFieldsToBeChanged: v.array(v.string()),
  }),
  
  stockRepostingSettings: defineTable({
    repostItemValuationOn: v.string(),
  }),
  
  deliverySettings: defineTable({
    dispatchLocation: v.string(),
  }),
});
