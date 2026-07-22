// @ts-nocheck
/**
 * Mongo → Convex mappers for remaining domains (dual-write + migration).
 * Dates → epoch ms; ObjectId FKs → *MongoId strings.
 */

function idStr(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object" && value !== null && "_id" in value) {
    return String((value as { _id: unknown })._id);
  }
  return String(value);
}

function toNum(value: unknown): number | undefined {
  if (value == null || value === "") return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

function toDateMs(value: unknown): number | undefined {
  if (value == null || value === "") return undefined;
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? undefined : value.getTime();
  }
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const d = new Date(value as string);
  return isNaN(d.getTime()) ? undefined : d.getTime();
}

function timestamps(doc: Record<string, unknown>) {
  const createdAt = toDateMs(doc.createdAt) ?? Date.now();
  const updatedAt = toDateMs(doc.updatedAt) ?? createdAt;
  return { createdAt, updatedAt };
}

function optStr(value: unknown): string | undefined {
  if (value == null || value === "") return undefined;
  return String(value);
}

export function toPlain(doc: unknown): Record<string, unknown> {
  if (doc == null) return {};
  if (typeof doc === "object" && doc !== null && "toObject" in doc) {
    return (doc as { toObject: () => Record<string, unknown> }).toObject();
  }
  return doc as Record<string, unknown>;
}

// ─── Customers ───────────────────────────────────────────────────────────────

export function mongoCustomerToConvexDoc(doc: Record<string, unknown>) {
  const mongoId = idStr(doc._id);
  if (!mongoId) throw new Error("Customer missing _id");
  const companyName = String(doc.companyName || "");
  if (!companyName) throw new Error("Customer missing companyName");

  const out: Record<string, unknown> = {
    mongoId,
    companyName,
    ownerName: String(doc.ownerName || ""),
    address: doc.address ?? "",
    phoneNumber: doc.phoneNumber ?? "",
    employeeList: Array.isArray(doc.employeeList) ? doc.employeeList : [],
    initialCharge: toNum(doc.initialCharge) ?? 0,
    initialPayment: toNum(doc.initialPayment) ?? 0,
    ...timestamps(doc),
  };
  
  if (doc.customerType) out.customerType = doc.customerType;
  if (doc.owners) out.owners = doc.owners;
  if (doc.bankAccounts) out.bankAccounts = doc.bankAccounts;
  if (doc.mobileBanking) out.mobileBanking = doc.mobileBanking;

  const searchText = optStr(doc.searchText);
  if (searchText !== undefined) out.searchText = searchText;
  const initialDate = toDateMs(doc.initialDate);
  if (initialDate !== undefined) out.initialDate = initialDate;
  return out;
}

// ─── Dyeings ─────────────────────────────────────────────────────────────────

export function mongoDyeingToConvexDoc(doc: Record<string, unknown>) {
  const mongoId = idStr(doc._id);
  if (!mongoId) throw new Error("Dyeing missing _id");
  const name = String(doc.name || "");
  if (!name) throw new Error("Dyeing missing name");

  const employees = Array.isArray(doc.employees)
    ? doc.employees.map((e) => {
        const rec = e as Record<string, unknown>;
        const emp: Record<string, unknown> = {
          employeeName: String(rec.employeeName || ""),
          designation: String(rec.designation || ""),
        };
        if (rec._id) emp.mongoId = idStr(rec._id);
        const info = optStr(rec.info);
        if (info !== undefined) emp.info = info;
        return emp;
      })
    : [];

  const out: Record<string, unknown> = {
    mongoId,
    name,
    location: String(doc.location || ""),
    employees,
    initialCharge: toNum(doc.initialCharge) ?? 0,
    initialPayment: toNum(doc.initialPayment) ?? 0,
    ...timestamps(doc),
  };
  const initialDate = toDateMs(doc.initialDate);
  if (initialDate !== undefined) out.initialDate = initialDate;
  return out;
}

// ─── Calenders ───────────────────────────────────────────────────────────────

export function mongoCalenderToConvexDoc(doc: Record<string, unknown>) {
  const mongoId = idStr(doc._id);
  if (!mongoId) throw new Error("Calender missing _id");
  const name = String(doc.name || "");
  if (!name) throw new Error("Calender missing name");

  const out: Record<string, unknown> = {
    mongoId,
    name,
    location: String(doc.location || ""),
    initialCharge: toNum(doc.initialCharge) ?? 0,
    initialPayment: toNum(doc.initialPayment) ?? 0,
    ...timestamps(doc),
  };
  const initialDate = toDateMs(doc.initialDate);
  if (initialDate !== undefined) out.initialDate = initialDate;
  return out;
}

// ─── Payments ────────────────────────────────────────────────────────────────

export function mongoPaymentToConvexDoc(doc: Record<string, unknown>) {
  const mongoId = idStr(doc._id);
  if (!mongoId) throw new Error("Payment missing _id");

  const out: Record<string, unknown> = {
    mongoId,
    amount: toNum(doc.amount) ?? 0,
    method: String(doc.method || "cash"),
    isSavedInLedger: Boolean(doc.isSavedInLedger),
    ...timestamps(doc),
  };

  // Mongo uses both `user` and `userId` for customer payments
  if (doc.user) out.userMongoId = idStr(doc.user);
  if (doc.userId) out.customerMongoId = idStr(doc.userId);
  if (doc.dyeingId) out.dyeingMongoId = idStr(doc.dyeingId);
  if (doc.calenderId) out.calenderMongoId = idStr(doc.calenderId);

  const description = optStr(doc.description);
  if (description !== undefined) out.description = description;
  const date = toDateMs(doc.date);
  if (date !== undefined) out.date = date;

  return out;
}

// ─── Billing summaries ───────────────────────────────────────────────────────

export function mongoBillingSummaryToConvexDoc(doc: Record<string, unknown>) {
  const mongoId = idStr(doc._id);
  if (!mongoId) throw new Error("BillingSummary missing _id");

  // Legacy docs may omit companyName / orderId / invoiceNumber — preserve with empty defaults
  const orderMongoId = doc.orderId ? idStr(doc.orderId) : "";
  const invoiceNumber = String(doc.invoiceNumber || "");
  const companyName = String(doc.companyName || "");
  const summaryType = String(doc.summaryType || "client");

  const out: Record<string, unknown> = {
    mongoId,
    orderMongoId,
    companyName,
    invoiceNumber,
    summaryType,
    price: toNum(doc.price) ?? 0,
    total: toNum(doc.total) ?? 0,
    totalQty: toNum(doc.totalQty) ?? 0,
    batchName: String(doc.batchName || ""),
    isSavedInLedger: Boolean(doc.isSavedInLedger),
    ...timestamps(doc),
  };

  const displayOrderId = optStr(doc.displayOrderId);
  if (displayOrderId) out.displayOrderId = displayOrderId;
  const clotheType = optStr(doc.clotheType);
  if (clotheType) out.clotheType = clotheType;
  const quality = optStr(doc.quality);
  if (quality) out.quality = quality;
  const colour = optStr(doc.colour);
  if (colour) out.colour = colour;
  const sillName = optStr(doc.sillName);
  if (sillName) out.sillName = sillName;
  const finishingType = optStr(doc.finishingType);
  if (finishingType) out.finishingType = finishingType;
  if (doc.customerId) out.customerMongoId = idStr(doc.customerId);
  const dyeing = optStr(doc.dyeing);
  if (dyeing) out.dyeing = dyeing;
  if (doc.dyeingId) out.dyeingMongoId = idStr(doc.dyeingId);
  const calender = optStr(doc.calender);
  if (calender) out.calender = calender;
  if (doc.calenderId) out.calenderMongoId = idStr(doc.calenderId);

  return out;
}

// ─── Saved invoices ──────────────────────────────────────────────────────────

function mapSavedInvoiceRow(r: Record<string, unknown>) {
  const row: Record<string, unknown> = {};
  if (r.recordId) row.recordMongoId = idStr(r.recordId);
  const modelType = optStr(r.modelType);
  if (modelType) row.modelType = modelType;
  const date = toDateMs(r.date);
  if (date !== undefined) row.date = date;
  for (const key of [
    "provider",
    "displayOrderId",
    "companyName",
    "description",
    "type",
    "clothType",
    "quality",
    "colour",
    "sillName",
    "finishingType",
  ] as const) {
    const s = optStr(r[key]);
    if (s !== undefined) row[key] = s;
  }
  for (const key of ["qty", "price", "charge", "payment", "balance"] as const) {
    const n = toNum(r[key]);
    if (n !== undefined) row[key] = n;
  }
  return row;
}

export function mongoSavedInvoiceToConvexDoc(doc: Record<string, unknown>) {
  const mongoId = idStr(doc._id);
  if (!mongoId) throw new Error("SavedInvoice missing _id");
  const entityMongoId = idStr(doc.entityId);
  if (!entityMongoId) throw new Error("SavedInvoice missing entityId");
  const entityType = String(doc.entityType || "");
  if (!entityType) throw new Error("SavedInvoice missing entityType");
  const invoiceNumber = String(doc.invoiceNumber || "");
  if (!invoiceNumber) throw new Error("SavedInvoice missing invoiceNumber");

  const out: Record<string, unknown> = {
    mongoId,
    entityMongoId,
    entityType,
    invoiceNumber,
    orderIds: Array.isArray(doc.orderIds)
      ? doc.orderIds.map((x) => String(x ?? ""))
      : [],
    records: Array.isArray(doc.records)
      ? doc.records.map((r) => mapSavedInvoiceRow(r as Record<string, unknown>))
      : [],
    totalCharge: toNum(doc.totalCharge) ?? 0,
    totalPayment: toNum(doc.totalPayment) ?? 0,
    ...timestamps(doc),
  };
  const title = optStr(doc.title);
  if (title) out.title = title;
  const companyName = optStr(doc.companyName);
  if (companyName) out.companyName = companyName;
  return out;
}

// ─── Ledger snapshots ────────────────────────────────────────────────────────

function mapLedgerRow(r: Record<string, unknown>) {
  const row: Record<string, unknown> = {};
  const date = toDateMs(r.date);
  if (date !== undefined) row.date = date;
  for (const key of [
    "provider",
    "displayOrderId",
    "companyName",
    "description",
    "colour",
    "type",
  ] as const) {
    const s = optStr(r[key]);
    if (s !== undefined) row[key] = s;
  }
  for (const key of ["qty", "price", "charge", "payment", "balance"] as const) {
    const n = toNum(r[key]);
    if (n !== undefined) row[key] = n;
  }
  return row;
}

export function mongoLedgerSnapshotToConvexDoc(doc: Record<string, unknown>) {
  const mongoId = idStr(doc._id);
  if (!mongoId) throw new Error("LedgerSnapshot missing _id");
  const entityMongoId = idStr(doc.entityId);
  if (!entityMongoId) throw new Error("LedgerSnapshot missing entityId");
  const entityType = String(doc.entityType || "");
  if (!entityType) throw new Error("LedgerSnapshot missing entityType");
  const title = String(doc.title || "");
  if (!title) throw new Error("LedgerSnapshot missing title");
  const fromDate = toDateMs(doc.fromDate);
  if (fromDate === undefined) throw new Error("LedgerSnapshot missing fromDate");
  const closedAt = toDateMs(doc.closedAt);
  if (closedAt === undefined) throw new Error("LedgerSnapshot missing closedAt");

  const out: Record<string, unknown> = {
    mongoId,
    entityMongoId,
    entityType,
    title,
    fromDate,
    closedAt,
    ledgerData: Array.isArray(doc.ledgerData)
      ? doc.ledgerData.map((r) => mapLedgerRow(r as Record<string, unknown>))
      : [],
    totalCharge: toNum(doc.totalCharge) ?? 0,
    totalPayment: toNum(doc.totalPayment) ?? 0,
    finalBalance: toNum(doc.finalBalance) ?? 0,
    openingBalance: toNum(doc.openingBalance) ?? 0,
    initialCharge: toNum(doc.initialCharge) ?? 0,
    initialPayment: toNum(doc.initialPayment) ?? 0,
    ...timestamps(doc),
  };
  const initialDate = toDateMs(doc.initialDate);
  if (initialDate !== undefined) out.initialDate = initialDate;
  return out;
}

// ─── Users (no password) ─────────────────────────────────────────────────────

export function mongoUserToConvexDoc(doc: Record<string, unknown>) {
  const mongoId = idStr(doc._id);
  if (!mongoId) throw new Error("User missing _id");
  const email = String(doc.email || "");
  if (!email) throw new Error("User missing email");

  return {
    mongoId,
    name: String(doc.name || ""),
    email,
    role: String(doc.role || "user"),
    ...timestamps(doc),
  };
}

// ─── Menu ────────────────────────────────────────────────────────────────────

export function mongoMenuNameToConvexDoc(doc: Record<string, unknown>) {
  const mongoId = idStr(doc._id);
  if (!mongoId) throw new Error("Menu item missing _id");
  const name = String(doc.name || "");
  if (!name) throw new Error("Menu item missing name");
  return {
    mongoId,
    name,
    ...timestamps(doc),
  };
}

export function mongoProcessToConvexDoc(doc: Record<string, unknown>) {
  const mongoId = idStr(doc._id);
  if (!mongoId) throw new Error("Process missing _id");
  const name = String(doc.name || "");
  if (!name) throw new Error("Process missing name");
  return {
    mongoId,
    name,
    price: toNum(doc.price) ?? 0,
    ...timestamps(doc),
  };
}
