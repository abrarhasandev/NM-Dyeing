/**
 * ============================================================
 *  NM-Dyeing — Remaining Domains → Convex Migration
 *  Customers, Dyeings, Calenders, Payments, BillingSummaries,
 *  SavedInvoices, LedgerSnapshots, Users, Menu catalogs
 * ============================================================
 *
 *  SAFETY
 *  ──────
 *  • Default mode is DRY-RUN (no Convex writes).
 *  • Live writes require explicit:  --live
 *  • Optional: --dry-run  (same as default; for clarity)
 *  • Chunked cursor reads (default 100) — no full-collection RAM load
 *  • Per-document error isolation → scripts/migrate-remaining-errors.json
 *  • Preserves Mongo _id as mongoId; FKs as *MongoId fields
 *  • Idempotent upserts via by_mongoId index
 *  • Users: password hashes NEVER mirrored
 *  • Does NOT touch Orders/Batches/Invoices (already migrated)
 *  • Does NOT alter Mongo data or read paths
 *
 *  USAGE
 *  ─────
 *  node scripts/migrate-remaining-to-convex.js              # dry-run (default)
 *  node scripts/migrate-remaining-to-convex.js --dry-run    # dry-run
 *  node scripts/migrate-remaining-to-convex.js --live       # WRITE to Convex
 *  node scripts/migrate-remaining-to-convex.js --live --chunk=50
 *
 *  ENV (from .env + .env.local)
 *  ───────────────────────────
 *  MONGO_URI, NEXT_PUBLIC_CONVEX_URL, ORDER_MIRROR_SECRET
 * ============================================================
 */

const path = require("path");
const fs = require("fs");
const mongoose = require("mongoose");
const { ConvexHttpClient } = require("convex/browser");

require("dotenv").config({ path: path.resolve(process.cwd(), ".env") });
require("dotenv").config({
  path: path.resolve(process.cwd(), ".env.local"),
  override: true,
});

const { api } = require("../convex/_generated/api.js");

// ── CLI ───────────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const LIVE = args.includes("--live");
const DRY_RUN = !LIVE;
const chunkArg = args.find((a) => a.startsWith("--chunk="));
const CHUNK = Math.max(
  1,
  Math.min(500, parseInt(chunkArg?.split("=")[1] || "100", 10) || 100)
);

const MONGO_URI = process.env.MONGO_URI;
const DB_NAME = process.env.MONGO_DB_NAME || "garments_db";
const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;
const MIRROR_SECRET = process.env.ORDER_MIRROR_SECRET;
const ERROR_FILE = path.resolve(
  process.cwd(),
  "scripts/migrate-remaining-errors.json"
);

// ── Minimal models (strict:false) ─────────────────────────────────────────────
const LooseSchema = new mongoose.Schema({}, { strict: false, timestamps: true });

function model(name, collection) {
  return mongoose.models[name] || mongoose.model(name, LooseSchema, collection);
}

const Customer = model("Customer", "customers");
const Dyeing = model("Dyeing", "dyeings");
const Calender = model("Calender", "calenders");
const Payment = model("Payment", "payments");
const BillingSummary = model("BillingSummary", "billingsummaries");
const SavedInvoice = model("SavedInvoice", "savedinvoices");
const LedgerSnapshot = model("LedgerSnapshot", "ledgersnapshots");
const User = model("User", "users");
const ClothType = model("ClothType", "clothtypes");
const Colour = model("Colour", "colours");
const FinishingType = model("FinishingType", "finishingtypes");
const Process = model("Process", "processes");
const Quality = model("Quality", "qualities");
const SillName = model("SillName", "sillnames");

// ── Helpers ───────────────────────────────────────────────────────────────────
function idStr(value) {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object" && value._id != null) return String(value._id);
  return String(value);
}

function toNum(value) {
  if (value == null || value === "") return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

function toDateMs(value) {
  if (value == null || value === "") return undefined;
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? undefined : value.getTime();
  }
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const dmy = value.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (dmy) {
      const d = Number(dmy[1]);
      const m = Number(dmy[2]);
      const y = Number(dmy[3]);
      const dt = new Date(Date.UTC(y, m - 1, d));
      return isNaN(dt.getTime()) ? undefined : dt.getTime();
    }
    const dt = new Date(value);
    return isNaN(dt.getTime()) ? undefined : dt.getTime();
  }
  return undefined;
}

function timestamps(doc) {
  const createdAt = toDateMs(doc.createdAt) ?? Date.now();
  const updatedAt = toDateMs(doc.updatedAt) ?? createdAt;
  return { createdAt, updatedAt };
}

function optStr(value) {
  if (value == null || value === "") return undefined;
  return String(value);
}

// ── Mappers ───────────────────────────────────────────────────────────────────

function mapCustomer(doc) {
  const mongoId = idStr(doc._id);
  if (!mongoId) throw new Error("Customer missing _id");
  const companyName = String(doc.companyName || "");
  if (!companyName) throw new Error("Customer missing companyName");

  const out = {
    mongoId,
    companyName,
    ownerName: String(doc.ownerName || ""),
    address: String(doc.address || ""),
    phoneNumber: String(doc.phoneNumber || ""),
    employeeList: Array.isArray(doc.employeeList)
      ? doc.employeeList.map((e) => String(e ?? ""))
      : [],
    initialCharge: toNum(doc.initialCharge) ?? 0,
    initialPayment: toNum(doc.initialPayment) ?? 0,
    ...timestamps(doc),
  };
  const searchText = optStr(doc.searchText);
  if (searchText !== undefined) out.searchText = searchText;
  const initialDate = toDateMs(doc.initialDate);
  if (initialDate !== undefined) out.initialDate = initialDate;
  return out;
}

function mapDyeing(doc) {
  const mongoId = idStr(doc._id);
  if (!mongoId) throw new Error("Dyeing missing _id");
  const name = String(doc.name || "");
  if (!name) throw new Error("Dyeing missing name");

  const employees = Array.isArray(doc.employees)
    ? doc.employees.map((e) => {
        const emp = {
          employeeName: String(e?.employeeName || ""),
          designation: String(e?.designation || ""),
        };
        if (e?._id) emp.mongoId = idStr(e._id);
        const info = optStr(e?.info);
        if (info !== undefined) emp.info = info;
        return emp;
      })
    : [];

  const out = {
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

function mapCalender(doc) {
  const mongoId = idStr(doc._id);
  if (!mongoId) throw new Error("Calender missing _id");
  const name = String(doc.name || "");
  if (!name) throw new Error("Calender missing name");

  const out = {
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

function mapPayment(doc) {
  const mongoId = idStr(doc._id);
  if (!mongoId) throw new Error("Payment missing _id");

  const out = {
    mongoId,
    amount: toNum(doc.amount) ?? 0,
    method: String(doc.method || "cash"),
    isSavedInLedger: Boolean(doc.isSavedInLedger),
    ...timestamps(doc),
  };
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

function mapBillingSummary(doc) {
  const mongoId = idStr(doc._id);
  if (!mongoId) throw new Error("BillingSummary missing _id");
  // Legacy docs may omit companyName / orderId / invoiceNumber — empty defaults preserve row
  const orderMongoId = doc.orderId ? idStr(doc.orderId) : "";
  const invoiceNumber = String(doc.invoiceNumber || "");
  const companyName = String(doc.companyName || "");
  const summaryType = String(doc.summaryType || "client");

  const out = {
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
  for (const key of [
    "clotheType",
    "quality",
    "colour",
    "sillName",
    "finishingType",
    "dyeing",
    "calender",
  ]) {
    const s = optStr(doc[key]);
    if (s) out[key] = s;
  }
  if (doc.customerId) out.customerMongoId = idStr(doc.customerId);
  if (doc.dyeingId) out.dyeingMongoId = idStr(doc.dyeingId);
  if (doc.calenderId) out.calenderMongoId = idStr(doc.calenderId);
  return out;
}

function mapSavedInvoiceRow(r) {
  const row = {};
  if (r?.recordId) row.recordMongoId = idStr(r.recordId);
  const modelType = optStr(r?.modelType);
  if (modelType) row.modelType = modelType;
  const date = toDateMs(r?.date);
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
  ]) {
    const s = optStr(r?.[key]);
    if (s !== undefined) row[key] = s;
  }
  for (const key of ["qty", "price", "charge", "payment", "balance"]) {
    const n = toNum(r?.[key]);
    if (n !== undefined) row[key] = n;
  }
  return row;
}

function mapSavedInvoice(doc) {
  const mongoId = idStr(doc._id);
  if (!mongoId) throw new Error("SavedInvoice missing _id");
  const entityMongoId = idStr(doc.entityId);
  if (!entityMongoId) throw new Error("SavedInvoice missing entityId");
  const entityType = String(doc.entityType || "");
  if (!entityType) throw new Error("SavedInvoice missing entityType");
  const invoiceNumber = String(doc.invoiceNumber || "");
  if (!invoiceNumber) throw new Error("SavedInvoice missing invoiceNumber");

  const out = {
    mongoId,
    entityMongoId,
    entityType,
    invoiceNumber,
    orderIds: Array.isArray(doc.orderIds)
      ? doc.orderIds.map((x) => String(x ?? ""))
      : [],
    records: Array.isArray(doc.records)
      ? doc.records.map(mapSavedInvoiceRow)
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

function mapLedgerRow(r) {
  const row = {};
  const date = toDateMs(r?.date);
  if (date !== undefined) row.date = date;
  for (const key of [
    "provider",
    "displayOrderId",
    "companyName",
    "description",
    "colour",
    "type",
  ]) {
    const s = optStr(r?.[key]);
    if (s !== undefined) row[key] = s;
  }
  for (const key of ["qty", "price", "charge", "payment", "balance"]) {
    const n = toNum(r?.[key]);
    if (n !== undefined) row[key] = n;
  }
  return row;
}

function mapLedgerSnapshot(doc) {
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

  const out = {
    mongoId,
    entityMongoId,
    entityType,
    title,
    fromDate,
    closedAt,
    ledgerData: Array.isArray(doc.ledgerData)
      ? doc.ledgerData.map(mapLedgerRow)
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

function mapUser(doc) {
  const mongoId = idStr(doc._id);
  if (!mongoId) throw new Error("User missing _id");
  const email = String(doc.email || "");
  if (!email) throw new Error("User missing email");
  // password intentionally omitted
  return {
    mongoId,
    name: String(doc.name || ""),
    email,
    role: String(doc.role || "user"),
    ...timestamps(doc),
  };
}

function mapMenuName(doc) {
  const mongoId = idStr(doc._id);
  if (!mongoId) throw new Error("Menu item missing _id");
  const name = String(doc.name || "");
  if (!name) throw new Error("Menu item missing name");
  return { mongoId, name, ...timestamps(doc) };
}

function mapProcess(doc) {
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

// ── Stats ─────────────────────────────────────────────────────────────────────
function emptyStats(label) {
  return {
    label,
    mongoCount: 0,
    mapped: 0,
    written: 0,
    errors: 0,
    nullRates: {},
    statusHistogram: {},
    orphanLinks: 0,
    sampleMongoIds: [],
  };
}

function bumpHist(hist, key) {
  const k = key || "(empty)";
  hist[k] = (hist[k] || 0) + 1;
}

function recordNullRate(stats, field, isNull) {
  if (!stats.nullRates[field]) stats.nullRates[field] = { null: 0, present: 0 };
  if (isNull) stats.nullRates[field].null += 1;
  else stats.nullRates[field].present += 1;
}

// ── Chunk processor ───────────────────────────────────────────────────────────
async function processCollection({
  Model,
  mapFn,
  mutationRef,
  client,
  secret,
  stats,
  errors,
  afterMap,
}) {
  // Prefer collection name from model; fall back to count via empty filter
  try {
    stats.mongoCount = await Model.countDocuments({});
  } catch (err) {
    stats.mongoCount = 0;
    errors.push({
      collection: stats.label,
      mongoId: null,
      message: `countDocuments failed: ${err.message}`,
      at: new Date().toISOString(),
    });
    return;
  }

  const cursor = Model.find({}).lean().cursor({ batchSize: CHUNK });
  let buffer = [];

  async function flush() {
    for (const doc of buffer) {
      const rawId = idStr(doc._id);
      try {
        const mapped = mapFn(doc);
        stats.mapped += 1;

        if (stats.sampleMongoIds.length < 5) {
          stats.sampleMongoIds.push(mapped.mongoId);
        }

        if (typeof afterMap === "function") {
          afterMap(stats, mapped);
        }

        if (!DRY_RUN) {
          await client.mutation(mutationRef, {
            mirrorSecret: secret,
            ...mapped,
          });
          stats.written += 1;
        }
      } catch (err) {
        stats.errors += 1;
        errors.push({
          collection: stats.label,
          mongoId: rawId,
          message: err instanceof Error ? err.message : String(err),
          at: new Date().toISOString(),
        });
      }
    }
    buffer = [];
  }

  for await (const doc of cursor) {
    buffer.push(doc);
    if (buffer.length >= CHUNK) {
      await flush();
      process.stdout.write(
        `  … ${stats.label}: mapped ${stats.mapped}/${stats.mongoCount}\r`
      );
    }
  }
  if (buffer.length) await flush();
  process.stdout.write("\n");
}

// ── Resolve actual collection names if defaults wrong ─────────────────────────
async function resolveCollection(defaultName, candidates) {
  const cols = await mongoose.connection.db.listCollections().toArray();
  const names = new Set(cols.map((c) => c.name));
  if (names.has(defaultName)) return defaultName;
  for (const c of candidates) {
    if (names.has(c)) return c;
  }
  return defaultName; // empty ok
}

async function remountIfNeeded(Model, collectionName) {
  // Model already bound; if collection differs, create a new model
  if (Model.collection.collectionName === collectionName) return Model;
  const name = Model.modelName + "_mig_" + collectionName;
  return mongoose.models[name] || mongoose.model(name, LooseSchema, collectionName);
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log("══════════════════════════════════════════════════════════");
  console.log("  NM-Dyeing — Remaining Domains → Convex");
  console.log(
    `  Mode   : ${DRY_RUN ? "DRY-RUN (no Convex writes)" : "LIVE WRITES"}`
  );
  console.log(`  Chunk  : ${CHUNK}`);
  console.log(`  Mongo  : ${DB_NAME}`);
  console.log(
    `  Convex : ${CONVEX_URL ? CONVEX_URL.slice(0, 40) + "…" : "(missing)"}`
  );
  console.log("══════════════════════════════════════════════════════════");

  if (!MONGO_URI) {
    console.error("❌ MONGO_URI missing — aborting.");
    process.exit(1);
  }
  if (!CONVEX_URL) {
    console.error("❌ NEXT_PUBLIC_CONVEX_URL missing — aborting.");
    process.exit(1);
  }
  if (!MIRROR_SECRET) {
    console.error("❌ ORDER_MIRROR_SECRET missing — aborting.");
    process.exit(1);
  }
  if (LIVE) {
    console.log("⚠️  LIVE mode: will upsert into Convex. Mongo is not modified.");
  }

  await mongoose.connect(MONGO_URI, { dbName: DB_NAME });
  console.log("✅ Connected to MongoDB");

  // Discover real collection names (Mongoose plurals can vary)
  const colMap = {
    customers: await resolveCollection("customers", ["customers", "Customers"]),
    dyeings: await resolveCollection("dyeings", ["dyeings", "Dyeings"]),
    calenders: await resolveCollection("calenders", [
      "calenders",
      "calendars",
      "Calenders",
    ]),
    payments: await resolveCollection("payments", ["payments", "Payments"]),
    billingsummaries: await resolveCollection("billingsummaries", [
      "billingsummaries",
      "billingsummarys",
      "billing_summaries",
      "BillingSummaries",
    ]),
    savedinvoices: await resolveCollection("savedinvoices", [
      "savedinvoices",
      "saved_invoices",
      "SavedInvoices",
    ]),
    ledgersnapshots: await resolveCollection("ledgersnapshots", [
      "ledgersnapshots",
      "ledger_snapshots",
      "LedgerSnapshots",
    ]),
    users: await resolveCollection("users", ["users", "Users"]),
    clothtypes: await resolveCollection("clothtypes", [
      "clothtypes",
      "cloth_types",
      "ClothTypes",
    ]),
    colours: await resolveCollection("colours", [
      "colours",
      "colors",
      "Colours",
    ]),
    finishingtypes: await resolveCollection("finishingtypes", [
      "finishingtypes",
      "finishing_types",
      "FinishingTypes",
    ]),
    processes: await resolveCollection("processes", [
      "processes",
      "Processes",
    ]),
    qualities: await resolveCollection("qualities", [
      "qualities",
      "Qualities",
    ]),
    sillnames: await resolveCollection("sillnames", [
      "sillnames",
      "sill_names",
      "SillNames",
    ]),
  };

  console.log("\n▶ Resolved Mongo collections:");
  for (const [k, v] of Object.entries(colMap)) {
    console.log(`  ${k.padEnd(20)} → ${v}`);
  }

  const Models = {
    customers: await remountIfNeeded(Customer, colMap.customers),
    dyeings: await remountIfNeeded(Dyeing, colMap.dyeings),
    calenders: await remountIfNeeded(Calender, colMap.calenders),
    payments: await remountIfNeeded(Payment, colMap.payments),
    billingSummaries: await remountIfNeeded(
      BillingSummary,
      colMap.billingsummaries
    ),
    savedInvoices: await remountIfNeeded(SavedInvoice, colMap.savedinvoices),
    ledgerSnapshots: await remountIfNeeded(
      LedgerSnapshot,
      colMap.ledgersnapshots
    ),
    users: await remountIfNeeded(User, colMap.users),
    clothTypes: await remountIfNeeded(ClothType, colMap.clothtypes),
    colours: await remountIfNeeded(Colour, colMap.colours),
    finishingTypes: await remountIfNeeded(
      FinishingType,
      colMap.finishingtypes
    ),
    processes: await remountIfNeeded(Process, colMap.processes),
    qualities: await remountIfNeeded(Quality, colMap.qualities),
    sillNames: await remountIfNeeded(SillName, colMap.sillnames),
  };

  const client = new ConvexHttpClient(CONVEX_URL);
  const errors = [];

  // FK universes for relationship checks
  const customerIds = new Set();
  const dyeingIds = new Set();
  const calenderIds = new Set();
  const orderIds = new Set();

  // Lightweight order id set for billing summary integrity (orders already on Convex)
  try {
    const Order = model("Order", "orders");
    const oc = Order.find({}, { _id: 1 }).lean().cursor({ batchSize: CHUNK });
    for await (const o of oc) orderIds.add(idStr(o._id));
    console.log(`\n  Known order mongoIds (for BS FK check): ${orderIds.size}`);
  } catch {
    console.log("\n  (Could not load orders for FK check — skipping)");
  }

  const allStats = {};

  // ── Phase order: entities first, then dependents ────────────────────────────
  const phases = [
    {
      key: "customers",
      label: "customers",
      Model: Models.customers,
      mapFn: mapCustomer,
      mutationRef: api.customers.mirrorUpsert,
      afterMap: (stats, mapped) => {
        customerIds.add(mapped.mongoId);
        recordNullRate(stats, "ownerName", !mapped.ownerName);
        recordNullRate(stats, "phoneNumber", !mapped.phoneNumber);
      },
    },
    {
      key: "dyeings",
      label: "dyeings",
      Model: Models.dyeings,
      mapFn: mapDyeing,
      mutationRef: api.dyeings.mirrorUpsert,
      afterMap: (stats, mapped) => {
        dyeingIds.add(mapped.mongoId);
        bumpHist(stats.statusHistogram, `employees:${mapped.employees.length}`);
      },
    },
    {
      key: "calenders",
      label: "calenders",
      Model: Models.calenders,
      mapFn: mapCalender,
      mutationRef: api.calenders.mirrorUpsert,
      afterMap: (stats, mapped) => {
        calenderIds.add(mapped.mongoId);
        recordNullRate(stats, "location", !mapped.location);
      },
    },
    {
      key: "payments",
      label: "payments",
      Model: Models.payments,
      mapFn: mapPayment,
      mutationRef: api.payments.mirrorUpsert,
      afterMap: (stats, mapped) => {
        bumpHist(stats.statusHistogram, mapped.method);
        const hasEntity =
          mapped.customerMongoId ||
          mapped.dyeingMongoId ||
          mapped.calenderMongoId ||
          mapped.userMongoId;
        recordNullRate(stats, "entityLink", !hasEntity);
        if (
          mapped.customerMongoId &&
          customerIds.size &&
          !customerIds.has(mapped.customerMongoId)
        ) {
          stats.orphanLinks += 1;
        }
        if (
          mapped.dyeingMongoId &&
          dyeingIds.size &&
          !dyeingIds.has(mapped.dyeingMongoId)
        ) {
          stats.orphanLinks += 1;
        }
        if (
          mapped.calenderMongoId &&
          calenderIds.size &&
          !calenderIds.has(mapped.calenderMongoId)
        ) {
          stats.orphanLinks += 1;
        }
      },
    },
    {
      key: "billingSummaries",
      label: "billingSummaries",
      Model: Models.billingSummaries,
      mapFn: mapBillingSummary,
      mutationRef: api.billingSummaries.mirrorUpsert,
      afterMap: (stats, mapped) => {
        bumpHist(stats.statusHistogram, mapped.summaryType);
        if (orderIds.size && !orderIds.has(mapped.orderMongoId)) {
          stats.orphanLinks += 1;
        }
        recordNullRate(stats, "customerMongoId", !mapped.customerMongoId);
      },
    },
    {
      key: "savedInvoices",
      label: "savedInvoices",
      Model: Models.savedInvoices,
      mapFn: mapSavedInvoice,
      mutationRef: api.savedInvoices.mirrorUpsert,
      afterMap: (stats, mapped) => {
        bumpHist(stats.statusHistogram, mapped.entityType);
        bumpHist(
          stats.statusHistogram,
          `records:${mapped.records?.length ?? 0}`
        );
      },
    },
    {
      key: "ledgerSnapshots",
      label: "ledgerSnapshots",
      Model: Models.ledgerSnapshots,
      mapFn: mapLedgerSnapshot,
      mutationRef: api.ledgerSnapshots.mirrorUpsert,
      afterMap: (stats, mapped) => {
        bumpHist(stats.statusHistogram, mapped.entityType);
      },
    },
    {
      key: "users",
      label: "users",
      Model: Models.users,
      mapFn: mapUser,
      mutationRef: api.users.mirrorUpsert,
      afterMap: (stats, mapped) => {
        bumpHist(stats.statusHistogram, mapped.role);
      },
    },
    {
      key: "clothTypes",
      label: "clothTypes",
      Model: Models.clothTypes,
      mapFn: mapMenuName,
      mutationRef: api.menu.clothTypesMirrorUpsert,
    },
    {
      key: "colours",
      label: "colours",
      Model: Models.colours,
      mapFn: mapMenuName,
      mutationRef: api.menu.coloursMirrorUpsert,
    },
    {
      key: "finishingTypes",
      label: "finishingTypes",
      Model: Models.finishingTypes,
      mapFn: mapMenuName,
      mutationRef: api.menu.finishingTypesMirrorUpsert,
    },
    {
      key: "processes",
      label: "processes",
      Model: Models.processes,
      mapFn: mapProcess,
      mutationRef: api.menu.processesMirrorUpsert,
      afterMap: (stats, mapped) => {
        recordNullRate(stats, "priceZero", mapped.price === 0);
      },
    },
    {
      key: "qualities",
      label: "qualities",
      Model: Models.qualities,
      mapFn: mapMenuName,
      mutationRef: api.menu.qualitiesMirrorUpsert,
    },
    {
      key: "sillNames",
      label: "sillNames",
      Model: Models.sillNames,
      mapFn: mapMenuName,
      mutationRef: api.menu.sillNamesMirrorUpsert,
    },
  ];

  let phaseNum = 0;
  for (const phase of phases) {
    phaseNum += 1;
    console.log(
      `\n▶ Phase ${phaseNum}/${phases.length} — ${phase.label}`
    );
    const stats = emptyStats(phase.label);
    allStats[phase.key] = stats;

    await processCollection({
      Model: phase.Model,
      mapFn: phase.mapFn,
      mutationRef: phase.mutationRef,
      client,
      secret: MIRROR_SECRET,
      stats,
      errors,
      afterMap: phase.afterMap,
    });
  }

  // ── Report ──────────────────────────────────────────────────────────────────
  const parityTable = Object.values(allStats).map((s) => ({
    collection: s.label,
    mongoCount: s.mongoCount,
    mapped: s.mapped,
    written: s.written,
    errors: s.errors,
    parity: s.mongoCount === s.mapped ? "OK" : "GAP",
    orphanLinks: s.orphanLinks,
  }));

  const report = {
    mode: DRY_RUN ? "dry-run" : "live",
    finishedAt: new Date().toISOString(),
    chunk: CHUNK,
    collections: allStats,
    parityTable,
    errorCount: errors.length,
    relationship: {
      customerMongoIdUniverse: customerIds.size,
      dyeingMongoIdUniverse: dyeingIds.size,
      calenderMongoIdUniverse: calenderIds.size,
      orderMongoIdUniverse: orderIds.size,
      paymentOrphanLinks: allStats.payments?.orphanLinks ?? 0,
      billingSummaryOrphanOrderLinks:
        allStats.billingSummaries?.orphanLinks ?? 0,
    },
  };

  console.log("\n══════════════════════════════════════════════════════════");
  console.log("  MIGRATION REPORT — PARITY TABLE");
  console.log("══════════════════════════════════════════════════════════");
  console.log(
    "collection".padEnd(20) +
      "mongo".padStart(8) +
      "mapped".padStart(8) +
      "written".padStart(8) +
      "errors".padStart(8) +
      "  parity" +
      "  orphans"
  );
  console.log("-".repeat(72));
  for (const row of parityTable) {
    console.log(
      row.collection.padEnd(20) +
        String(row.mongoCount).padStart(8) +
        String(row.mapped).padStart(8) +
        String(row.written).padStart(8) +
        String(row.errors).padStart(8) +
        `  ${row.parity.padEnd(5)}` +
        `  ${row.orphanLinks}`
    );
  }

  console.log("\n── Status / type histograms ──");
  for (const s of Object.values(allStats)) {
    if (Object.keys(s.statusHistogram).length) {
      console.log(`  ${s.label}:`, JSON.stringify(s.statusHistogram));
    }
  }

  console.log("\n── Null rates (sampled fields) ──");
  for (const s of Object.values(allStats)) {
    if (Object.keys(s.nullRates).length) {
      console.log(`  ${s.label}:`, JSON.stringify(s.nullRates));
    }
  }

  console.log("\n── Relationship summary ──");
  console.log(JSON.stringify(report.relationship, null, 2));

  console.log("\n── Full report (JSON) ──");
  console.log(JSON.stringify(report, null, 2));

  if (errors.length) {
    fs.writeFileSync(ERROR_FILE, JSON.stringify(errors, null, 2));
    console.log(`\n⚠️  ${errors.length} errors written to ${ERROR_FILE}`);
  } else {
    if (fs.existsSync(ERROR_FILE)) fs.unlinkSync(ERROR_FILE);
    console.log("\n✅ No per-document mapping errors.");
  }

  if (DRY_RUN) {
    console.log("\n🛑 DRY-RUN complete — zero writes to Convex.");
    console.log("   Re-run with --live only after explicit owner approval.");
    console.log('   Reply with: approve live migration');
  } else {
    console.log("\n✅ LIVE migration finished (idempotent upserts).");
    console.log("   Mongo was not modified. Read paths unchanged.");
  }

  await mongoose.disconnect();
  process.exit(errors.length > 0 && !DRY_RUN ? 1 : 0);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
