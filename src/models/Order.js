const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      required: true,
      unique: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },

    dyeingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Dyeing",
    },

    status: {
      type: String,
      enum: [
        "pending",
        "batch",
        "inprocess",
        "completedprocess",
        "delivered",
        "billing",
        "completed",
      ],
      default: "pending",
    },

    // ─── MIGRATED: was String ("DD/MM/YYYY") ────────────────────────────────
    // After running scripts/migrate-order-dates.js this field is a proper Date.
    // New orders created via the API send a Date object directly.
    date: {
      type: Date,
      default: null,
    },
    // ────────────────────────────────────────────────────────────────────────

    invoiceNumber: String,
    companyName: String,
    clotheType: String,
    finishingWidth: Number,
    quality: String,
    sillName: String,
    colour: String,
    finishingType: String,
    totalGoj: Number,
    totalBundle: Number,
    dyeingName: String,
    transporterName: String,
    tableData: [
      {
        rollNo: Number,
        goj: Number,
      },
    ],
    isTrash: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// ════════════════════════════════════════════════════════════════
//  PRE-VALIDATE HOOK — generate orderId based on selected date
// ════════════════════════════════════════════════════════════════
orderSchema.pre("validate", function (next) {
  if (!this.orderId) {
    const targetDate = this.date || new Date();
    // Using getUTCFullYear because if the frontend sends "YYYY-MM-DD", 
    // it's parsed as UTC midnight.
    const year = targetDate.getUTCFullYear();
    const month = String(targetDate.getUTCMonth() + 1).padStart(2, "0");
    const day = String(targetDate.getUTCDate()).padStart(2, "0");
    const random = Math.floor(Math.random() * 900) + 100;
    this.orderId = `#ord-${year}-${month}${day}-${random}`;
  }
  next();
});

// ════════════════════════════════════════════════════════════════
//  INDEXES  — eliminate full-collection scans (COLLSCAN)
// ════════════════════════════════════════════════════════════════

// 1. Primary sort index — latest orders first (most used sort)
orderSchema.index({ createdAt: -1 });

// 2. Date range queries (replaces the $expr/$dateFromString workaround)
orderSchema.index({ date: 1 });

// 3. Status filter (used in almost every query)
orderSchema.index({ status: 1 });

// 4. Compound: status + date range (covers the most common combined query)
orderSchema.index({ status: 1, date: -1 });

// 5. Cloth type filter
orderSchema.index({ clotheType: 1 });

// 6. Other filter fields
orderSchema.index({ finishingType: 1 });
orderSchema.index({ colour: 1 });
orderSchema.index({ sillName: 1 });
orderSchema.index({ quality: 1 });

// 7. Text search index for companyName + orderId (replaces slow $regex scans)
orderSchema.index(
  { companyName: "text", orderId: "text" },
  { name: "order_text_search", weights: { orderId: 2, companyName: 1 } }
);

// ════════════════════════════════════════════════════════════════

delete mongoose.models.Order;
const Order = mongoose.model("Order", orderSchema);
module.exports = Order;
