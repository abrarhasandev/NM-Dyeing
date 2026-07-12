/**
 * ============================================================
 *  NM-Dyeing — Order Workflow Cluster → Convex Migration
 *  Orders → Batches → Invoices
 * ============================================================
 *
 *  SAFETY
 *  ──────
 *  • Default mode is DRY-RUN (no Convex writes).
 *  • Live writes require explicit:  --live
 *  • Optional: --dry-run  (same as default; for clarity)
 *  • Chunked cursor reads (default 100) — no full-collection RAM load
 *  • Per-document error isolation → scripts/migrate-all-to-convex-errors.json
 *  • Preserves Mongo _id as mongoId; FKs as orderMongoId / batchMongoIds
 *  • Idempotent upserts via by_mongoId index
 *
 *  USAGE
 *  ─────
 *  node scripts/migrate-all-to-convex.js              # dry-run (default)
 *  node scripts/migrate-all-to-convex.js --dry-run    # dry-run
 *  node scripts/migrate-all-to-convex.js --live       # WRITE to Convex
 *  node scripts/migrate-all-to-convex.js --live --chunk=50
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

// Load .env then .env.local (local overrides)
require("dotenv").config({ path: path.resolve(process.cwd(), ".env") });
require("dotenv").config({
  path: path.resolve(process.cwd(), ".env.local"),
  override: true,
});

// Convex generated API (CJS)
const { api } = require("../convex/_generated/api.js");

// ── CLI ───────────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const LIVE = args.includes("--live");
const DRY_RUN = !LIVE; // dry-run is default; --dry-run is accepted for clarity
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
  "scripts/migrate-all-to-convex-errors.json"
);

// ── Minimal models (strict:false — read whatever is stored) ───────────────────
const LooseSchema = new mongoose.Schema({}, { strict: false, timestamps: true });
const Order =
  mongoose.models.Order || mongoose.model("Order", LooseSchema, "orders");
const Batch =
  mongoose.models.Batch || mongoose.model("Batch", LooseSchema, "batches");
const Invoice =
  mongoose.models.Invoice ||
  mongoose.model("Invoice", LooseSchema, "invoices");

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
  // Numeric epoch
  if (typeof value === "number" && Number.isFinite(value)) return value;
  // String date
  if (typeof value === "string") {
    // DD/MM/YYYY
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

function strOrEmpty(value) {
  if (value == null) return "";
  return String(value);
}

// ── Mappers ───────────────────────────────────────────────────────────────────

function mapOrder(doc) {
  const mongoId = idStr(doc._id);
  if (!mongoId) throw new Error("Order missing _id");
  const orderId = String(doc.orderId || "");
  if (!orderId) throw new Error("Order missing orderId");

  // Legacy orders (pre-customerId) only have companyName — preserve with empty FK string
  const customerMongoId = doc.customerId ? idStr(doc.customerId) : "";

  const tableData = Array.isArray(doc.tableData)
    ? doc.tableData.map((row, i) => ({
        rollNo: toNum(row?.rollNo) ?? i + 1,
        goj: toNum(row?.goj),
      }))
    : [];

  const out = {
    mongoId,
    orderId,
    customerMongoId,
    status: String(doc.status || "pending").toLowerCase(),
    tableData,
    isTrash: Boolean(doc.isTrash),
    ...timestamps(doc),
  };

  const dyeingMongoId = doc.dyeingId ? idStr(doc.dyeingId) : "";
  if (dyeingMongoId) out.dyeingMongoId = dyeingMongoId;

  const dateMs = toDateMs(doc.date);
  if (dateMs !== undefined) out.date = dateMs;

  const inv = optStr(doc.invoiceNumber);
  if (inv) out.invoiceNumber = inv;
  const company = optStr(doc.companyName);
  if (company) out.companyName = company;
  const clotheType = optStr(doc.clotheType);
  if (clotheType) out.clotheType = clotheType;
  const fw = toNum(doc.finishingWidth);
  if (fw !== undefined) out.finishingWidth = fw;
  const quality = optStr(doc.quality);
  if (quality) out.quality = quality;
  const sillName = optStr(doc.sillName);
  if (sillName) out.sillName = sillName;
  const colour = optStr(doc.colour);
  if (colour) out.colour = colour;
  const finishingType = optStr(doc.finishingType);
  if (finishingType) out.finishingType = finishingType;
  const totalGoj = toNum(doc.totalGoj);
  if (totalGoj !== undefined) out.totalGoj = totalGoj;
  const totalBundle = toNum(doc.totalBundle);
  if (totalBundle !== undefined) out.totalBundle = totalBundle;
  const dyeingName = optStr(doc.dyeingName);
  if (dyeingName) out.dyeingName = dyeingName;
  const transporterName = optStr(doc.transporterName);
  if (transporterName) out.transporterName = transporterName;

  return out;
}

function mapEmbeddedBatch(b) {
  const rows = Array.isArray(b.rows)
    ? b.rows.map((r) => {
        const row = {};
        const rollNo = toNum(r?.rollNo);
        if (rollNo !== undefined) row.rollNo = rollNo;
        const goj = toNum(r?.goj);
        if (goj !== undefined) row.goj = goj;
        // idx may be number or array
        if (r?.idx != null) {
          if (Array.isArray(r.idx)) {
            row.idx = r.idx.map((x) => Number(x) || 0);
          } else {
            row.idx = [Number(r.idx) || 0];
          }
        }
        if (r?.extraInputs != null) {
          const extras = Array.isArray(r.extraInputs)
            ? r.extraInputs
            : [r.extraInputs];
          row.extraInputs = extras.map((x) => String(x ?? ""));
        }
        return row;
      })
    : [];

  const selectedProcesses = Array.isArray(b.selectedProcesses)
    ? b.selectedProcesses.map((p) => {
        const sp = {};
        if (p?.name != null) sp.name = String(p.name);
        const price = toNum(p?.price);
        if (price !== undefined) sp.price = price;
        return sp;
      })
    : [];

  const emb = {
    batchName: strOrEmpty(b.batchName) || "unnamed",
    status: strOrEmpty(b.status) || "pending",
    rows,
    selectedProcesses,
    colour: strOrEmpty(b.colour),
    sillName: strOrEmpty(b.sillName),
    finishingType: strOrEmpty(b.finishingType),
    dyeing: strOrEmpty(b.dyeing),
  };

  if (b._id) emb.mongoId = idStr(b._id);
  if (b.customerId) emb.customerMongoId = idStr(b.customerId);
  if (b.dyeingId) emb.dyeingMongoId = idStr(b.dyeingId);
  if (b.calenderId) emb.calenderMongoId = idStr(b.calenderId);
  const quality = optStr(b.quality);
  if (quality) emb.quality = quality;
  const clotheType = optStr(b.clotheType);
  if (clotheType) emb.clotheType = clotheType;
  const calender = optStr(b.calender);
  if (calender) emb.calender = calender;
  const note = optStr(b.note);
  if (note !== undefined) emb.note = note ?? "";
  const invoiceNumber = optStr(b.invoiceNumber);
  if (invoiceNumber) emb.invoiceNumber = invoiceNumber;

  return emb;
}

function mapBatch(doc) {
  const mongoId = idStr(doc._id);
  if (!mongoId) throw new Error("Batch parent missing _id");
  const orderMongoId = idStr(doc.orderId);
  if (!orderMongoId) throw new Error("Batch missing orderId");

  return {
    mongoId,
    orderMongoId,
    batches: Array.isArray(doc.batches)
      ? doc.batches.map(mapEmbeddedBatch)
      : [],
    ...timestamps(doc),
  };
}

function mapInvoice(doc) {
  const mongoId = idStr(doc._id);
  if (!mongoId) throw new Error("Invoice missing _id");
  const invoiceNumber = String(doc.invoiceNumber || "");
  if (!invoiceNumber) throw new Error("Invoice missing invoiceNumber");
  const orderMongoId = idStr(doc.orderId);
  if (!orderMongoId) throw new Error("Invoice missing orderId");

  const batchMongoIds = Array.isArray(doc.batchIds)
    ? doc.batchIds.map(idStr).filter(Boolean)
    : [];

  return {
    mongoId,
    invoiceNumber,
    orderMongoId,
    batchMongoIds,
    totalAmount: toNum(doc.totalAmount) ?? 0,
    status: String(doc.status || "unpaid"),
    ...timestamps(doc),
  };
}

// ── Stats helpers ─────────────────────────────────────────────────────────────
function emptyStats(label) {
  return {
    label,
    mongoCount: 0,
    mapped: 0,
    written: 0,
    errors: 0,
    nullRates: {},
    statusHistogram: {},
    orphanOrderLinks: 0,
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
  orderMongoIdSet,
  linkField, // 'orderMongoId' for batches/invoices
}) {
  stats.mongoCount = await Model.countDocuments({});
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

        // Domain-specific stats
        if (stats.label === "orders") {
          bumpHist(stats.statusHistogram, mapped.status);
          recordNullRate(stats, "date", mapped.date == null);
          recordNullRate(stats, "customerMongoId", !mapped.customerMongoId);
          recordNullRate(stats, "dyeingMongoId", !mapped.dyeingMongoId);
          recordNullRate(stats, "transporterName", !mapped.transporterName);
          recordNullRate(
            stats,
            "tableData",
            !mapped.tableData || mapped.tableData.length === 0
          );
        }
        if (stats.label === "batches") {
          bumpHist(
            stats.statusHistogram,
            `embedded:${mapped.batches.length}`
          );
          recordNullRate(stats, "emptyBatchesArray", mapped.batches.length === 0);
          if (orderMongoIdSet && !orderMongoIdSet.has(mapped.orderMongoId)) {
            stats.orphanOrderLinks += 1;
          }
        }
        if (stats.label === "invoices") {
          bumpHist(stats.statusHistogram, mapped.status);
          if (orderMongoIdSet && !orderMongoIdSet.has(mapped.orderMongoId)) {
            stats.orphanOrderLinks += 1;
          }
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

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log("══════════════════════════════════════════════════════════");
  console.log("  NM-Dyeing — Order Workflow Cluster → Convex");
  console.log(`  Mode   : ${DRY_RUN ? "DRY-RUN (no Convex writes)" : "LIVE WRITES"}`);
  console.log(`  Chunk  : ${CHUNK}`);
  console.log(`  Mongo  : ${DB_NAME}`);
  console.log(`  Convex : ${CONVEX_URL ? CONVEX_URL.slice(0, 40) + "…" : "(missing)"}`);
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

  const client = new ConvexHttpClient(CONVEX_URL);
  const errors = [];
  const orderMongoIdSet = new Set();

  const orderStats = emptyStats("orders");
  const batchStats = emptyStats("batches");
  const invoiceStats = emptyStats("invoices");

  // ── 1. Orders first ─────────────────────────────────────────────────────────
  console.log("\n▶ Phase 1/3 — Orders");
  // First pass: collect order mongoIds for integrity (lightweight projection)
  const orderIdCursor = Order.find({}, { _id: 1 }).lean().cursor({ batchSize: CHUNK });
  for await (const o of orderIdCursor) {
    orderMongoIdSet.add(idStr(o._id));
  }
  console.log(`  Known order mongoIds: ${orderMongoIdSet.size}`);

  await processCollection({
    Model: Order,
    mapFn: mapOrder,
    mutationRef: api.orders.mirrorUpsert,
    client,
    secret: MIRROR_SECRET,
    stats: orderStats,
    errors,
    orderMongoIdSet,
  });

  // ── 2. Batches ──────────────────────────────────────────────────────────────
  console.log("\n▶ Phase 2/3 — Batches (parent docs, 1 per order)");
  await processCollection({
    Model: Batch,
    mapFn: mapBatch,
    mutationRef: api.batches.mirrorUpsert,
    client,
    secret: MIRROR_SECRET,
    stats: batchStats,
    errors,
    orderMongoIdSet,
    linkField: "orderMongoId",
  });

  // ── 3. Invoices ─────────────────────────────────────────────────────────────
  console.log("\n▶ Phase 3/3 — Invoices");
  await processCollection({
    Model: Invoice,
    mapFn: mapInvoice,
    mutationRef: api.invoices.mirrorUpsert,
    client,
    secret: MIRROR_SECRET,
    stats: invoiceStats,
    errors,
    orderMongoIdSet,
    linkField: "orderMongoId",
  });

  // ── Report ──────────────────────────────────────────────────────────────────
  const report = {
    mode: DRY_RUN ? "dry-run" : "live",
    finishedAt: new Date().toISOString(),
    chunk: CHUNK,
    orders: orderStats,
    batches: batchStats,
    invoices: invoiceStats,
    errorCount: errors.length,
    relationship: {
      batchOrphanOrderLinks: batchStats.orphanOrderLinks,
      invoiceOrphanOrderLinks: invoiceStats.orphanOrderLinks,
      orderMongoIdUniverse: orderMongoIdSet.size,
    },
  };

  console.log("\n══════════════════════════════════════════════════════════");
  console.log("  MIGRATION REPORT");
  console.log("══════════════════════════════════════════════════════════");
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
  } else {
    console.log("\n✅ LIVE migration finished (idempotent upserts).");
    console.log("   Mongo was not modified.");
  }

  await mongoose.disconnect();
  process.exit(errors.length > 0 && !DRY_RUN ? 1 : 0);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
