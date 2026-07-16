// @ts-nocheck
/**
 * Mongo → Convex mappers for Batch parent docs and Invoices.
 * Shared by dual-write façade and (logically) migration script.
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

function strOrEmpty(value: unknown): string {
  if (value == null) return "";
  return String(value);
}

export type ConvexEmbeddedBatch = {
  mongoId?: string;
  batchName: string;
  status: string;
  customerMongoId?: string;
  dyeingMongoId?: string;
  calenderMongoId?: string;
  rows: Array<{
    rollNo?: number;
    goj?: number;
    idx?: number[];
    extraInputs?: string[];
  }>;
  selectedProcesses: Array<{ name?: string; price?: number }>;
  colour: string;
  quality?: string;
  sillName: string;
  clotheType?: string;
  finishingType: string;
  dyeing: string;
  calender?: string;
  note?: string;
  invoiceNumber?: string;
};

export type ConvexBatchDoc = {
  mongoId: string;
  orderMongoId: string;
  batches: ConvexEmbeddedBatch[];
  createdAt: number;
  updatedAt: number;
};

export type ConvexInvoiceDoc = {
  mongoId: string;
  invoiceNumber: string;
  orderMongoId: string;
  batchMongoIds: string[];
  totalAmount: number;
  status: string;
  createdAt: number;
  updatedAt: number;
};

function mapEmbeddedBatch(b: Record<string, unknown>): ConvexEmbeddedBatch {
  const rowsRaw = Array.isArray(b.rows) ? b.rows : [];
  const rows = rowsRaw.map((r) => {
    const row: ConvexEmbeddedBatch["rows"][number] = {};
    const rec = r as Record<string, unknown>;
    const rollNo = toNum(rec.rollNo);
    if (rollNo !== undefined) row.rollNo = rollNo;
    const goj = toNum(rec.goj);
    if (goj !== undefined) row.goj = goj;
    if (rec.idx != null) {
      if (Array.isArray(rec.idx)) {
        row.idx = rec.idx.map((x) => Number(x) || 0);
      } else {
        row.idx = [Number(rec.idx) || 0];
      }
    }
    if (rec.extraInputs != null) {
      const extras = Array.isArray(rec.extraInputs)
        ? rec.extraInputs
        : [rec.extraInputs];
      row.extraInputs = extras.map((x) => String(x ?? ""));
    }
    return row;
  });

  const selectedProcesses = Array.isArray(b.selectedProcesses)
    ? b.selectedProcesses.map((p) => {
        const rec = p as Record<string, unknown>;
        const sp: { name?: string; price?: number } = {};
        if (rec.name != null) sp.name = String(rec.name);
        const price = toNum(rec.price);
        if (price !== undefined) sp.price = price;
        return sp;
      })
    : [];

  const emb: ConvexEmbeddedBatch = {
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
  if (b.note != null) emb.note = String(b.note);
  const invoiceNumber = optStr(b.invoiceNumber);
  if (invoiceNumber) emb.invoiceNumber = invoiceNumber;

  return emb;
}

export function mongoBatchToConvexDoc(
  doc: Record<string, unknown>
): ConvexBatchDoc {
  const mongoId = idStr(doc._id);
  if (!mongoId) throw new Error("Batch missing _id");
  const orderMongoId = idStr(doc.orderId);
  if (!orderMongoId) throw new Error("Batch missing orderId");

  const batchesRaw = Array.isArray(doc.batches) ? doc.batches : [];
  return {
    mongoId,
    orderMongoId,
    batches: batchesRaw.map((b) =>
      mapEmbeddedBatch(b as Record<string, unknown>)
    ),
    ...timestamps(doc),
  };
}

export function mongoInvoiceToConvexDoc(
  doc: Record<string, unknown>
): ConvexInvoiceDoc {
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

/** Normalize mongoose doc / lean object to plain record. */
export function toPlain(doc: unknown): Record<string, unknown> {
  if (doc == null) return {};
  if (typeof doc === "object" && doc !== null && "toObject" in doc) {
    return (doc as { toObject: () => Record<string, unknown> }).toObject();
  }
  return doc as Record<string, unknown>;
}
