/**
 * ============================================================
 *  NM-Dyeing — Safe Order Date Migration Script
 *  Priority 1: String → Date for the `date` field
 * ============================================================
 *
 *  WHAT IT DOES
 *  ─────────────
 *  1. Reads every document in the `orders` collection.
 *  2. Parses the existing "DD/MM/YYYY" string into a proper Date.
 *  3. Updates the document in-place (no delete, no overwrite of other fields).
 *  4. Skips documents that are already migrated (field is already a Date).
 *  5. Logs every malformed string to a separate error list (never drops data).
 *
 *  SAFETY GUARANTEES
 *  ─────────────────
 *  • Dry-run mode (--dry-run flag) — logs changes without writing.
 *  • Idempotent — safe to re-run; already-migrated docs are skipped.
 *  • Batch processing — processes in chunks of 500 to avoid memory spikes.
 *  • Full error report written to ./scripts/migration-errors.json at the end.
 *  • Uses bulkWrite with ordered:false so one bad doc never blocks the batch.
 *
 *  USAGE
 *  ──────
 *  node scripts/migrate-order-dates.js             (live run)
 *  node scripts/migrate-order-dates.js --dry-run   (inspect only)
 *
 *  REQUIREMENTS
 *  ─────────────
 *  npm install mongoose dotenv  (already installed in this project)
 * ============================================================
 */

require("dotenv").config({ path: ".env" });
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

// ── Config ────────────────────────────────────────────────────────────────────
const MONGO_URI = process.env.MONGO_URI;
const DB_NAME   = "garments_db";
const BATCH_SIZE = 500;
const DRY_RUN   = process.argv.includes("--dry-run");

if (!MONGO_URI) {
  console.error("❌  MONGO_URI not found in .env — aborting.");
  process.exit(1);
}

// ── Minimal Order schema (no validation changes needed here) ──────────────────
const OrderSchema = new mongoose.Schema({}, { strict: false, timestamps: true });
const Order = mongoose.models.Order || mongoose.model("Order", OrderSchema);

// ── Date parser: handles both "DD/MM/YYYY" and "YYYY-MM-DD" (ISO) formats ──────
// Early orders (pre-2026) were stored in YYYY-MM-DD; later standardised to DD/MM/YYYY.
function parseDMY(str) {
  if (!str || typeof str !== "string") return null;
  const trimmed = str.trim();

  // Format 1: DD/MM/YYYY (standard format)
  const dmy = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (dmy) {
    const [, day, month, year] = dmy.map(Number);
    if (month < 1 || month > 12) return null;
    if (day < 1 || day > 31) return null;
    const d = new Date(Date.UTC(year, month - 1, day));
    return isNaN(d.getTime()) ? null : d;
  }

  // Format 2: YYYY-MM-DD (ISO format — found in early 2025 orders)
  const iso = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (iso) {
    const [, year, month, day] = iso.map(Number);
    if (month < 1 || month > 12) return null;
    if (day < 1 || day > 31) return null;
    const d = new Date(Date.UTC(year, month - 1, day));
    return isNaN(d.getTime()) ? null : d;
  }

  return null;
}

// ── Main migration ─────────────────────────────────────────────────────────────
async function run() {
  console.log("══════════════════════════════════════════════════════");
  console.log(`  NM-Dyeing — Order Date Migration`);
  console.log(`  Mode  : ${DRY_RUN ? "DRY RUN (no writes)" : "LIVE (writes enabled)"}`);
  console.log("══════════════════════════════════════════════════════");

  await mongoose.connect(MONGO_URI, { dbName: DB_NAME });
  console.log("✅  Connected to MongoDB:", DB_NAME);

  const totalDocuments = await Order.countDocuments({});
  console.log(`📊  Total orders in collection: ${totalDocuments}`);

  let processed     = 0;
  let skipped       = 0; // already Date type or null
  let migrated      = 0;
  let errors        = [];

  let skip = 0;

  while (true) {
    const batch = await Order.find({}).skip(skip).limit(BATCH_SIZE).lean();
    if (batch.length === 0) break;

    const operations = [];

    for (const doc of batch) {
      processed++;

      // Already migrated: if field is a Date object (typeof won't help in lean(),
      // but BSON Date comes back as JS Date instance)
      if (doc.date instanceof Date) {
        skipped++;
        continue;
      }

      // Null / undefined — skip gracefully
      if (doc.date === null || doc.date === undefined) {
        skipped++;
        continue;
      }

      const parsed = parseDMY(doc.date);

      if (!parsed) {
        errors.push({
          _id: doc._id.toString(),
          originalDate: doc.date,
          reason: "Could not parse as DD/MM/YYYY",
        });
        // DO NOT update — preserve original string value, fix manually.
        continue;
      }

      if (DRY_RUN) {
        console.log(`  [DRY] _id=${doc._id}  "${doc.date}" → ${parsed.toISOString()}`);
        migrated++;
        continue;
      }

      operations.push({
        updateOne: {
          filter: { _id: doc._id },
          update: { $set: { date: parsed } },
        },
      });
      migrated++;
    }

    // Execute batch write
    if (!DRY_RUN && operations.length > 0) {
      const result = await Order.bulkWrite(operations, { ordered: false });
      console.log(
        `  Batch [${skip + 1}–${skip + batch.length}]: ${result.modifiedCount} updated, ${skipped} skipped so far`
      );
    }

    skip += batch.length;
  }

  // ── Summary ──────────────────────────────────────────────────────────────────
  console.log("\n══════════════════════════════════════════════════════");
  console.log("  MIGRATION SUMMARY");
  console.log("══════════════════════════════════════════════════════");
  console.log(`  Total processed : ${processed}`);
  console.log(`  Migrated        : ${migrated} ${DRY_RUN ? "(DRY RUN — not written)" : ""}`);
  console.log(`  Skipped (safe)  : ${skipped}  (already Date or null)`);
  console.log(`  Errors          : ${errors.length}`);

  if (errors.length > 0) {
    const errFile = path.join(__dirname, "migration-errors.json");
    fs.writeFileSync(errFile, JSON.stringify(errors, null, 2));
    console.log(`\n⚠️   ${errors.length} document(s) could not be parsed.`);
    console.log(`    Review them in: ${errFile}`);
    console.log(`    Their original 'date' string was preserved — no data lost.`);
  } else {
    console.log("\n🎉  All documents migrated successfully — zero data loss.");
  }

  await mongoose.disconnect();
  console.log("🔌  Disconnected from MongoDB.");
  process.exit(errors.length > 0 ? 1 : 0);
}

run().catch((err) => {
  console.error("💥  Fatal error during migration:", err);
  process.exit(1);
});
