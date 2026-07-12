import type { ConvexOrderDoc, OrderTableRow } from "@/types/order";
import { dateToEpochMs } from "@/lib/orders/orderId";

function idToString(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object" && value !== null && "_id" in value) {
    return String((value as { _id: unknown })._id);
  }
  return String(value);
}

function toNumberOrUndefined(value: unknown): number | undefined {
  if (value == null || value === "") return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

function normalizeTableData(raw: unknown): OrderTableRow[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((row, index) => {
    const r = row as Record<string, unknown>;
    return {
      rollNo: toNumberOrUndefined(r.rollNo) ?? index + 1,
      goj: toNumberOrUndefined(r.goj),
    };
  });
}

function toDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return isNaN(value.getTime()) ? null : value;
  const d = new Date(value as string | number);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Map a Mongo Order lean/document to Convex mirror shape.
 * Preserves mongoId for Batch/Invoice FK bridge during dual-write.
 */
export function mongoOrderToConvexDoc(order: Record<string, unknown>): ConvexOrderDoc {
  const mongoId = idToString(order._id);
  if (!mongoId) {
    throw new Error("mongoOrderToConvexDoc: missing _id");
  }

  const orderId = String(order.orderId || "");
  if (!orderId) {
    throw new Error("mongoOrderToConvexDoc: missing orderId");
  }

  // Legacy orders may lack customerId (companyName only)
  const customerMongoId = order.customerId ? idToString(order.customerId) : "";

  const dyeingRaw = order.dyeingId;
  const dyeingMongoId = dyeingRaw ? idToString(dyeingRaw) : undefined;

  const date = toDate(order.date);
  const createdAt = toDate(order.createdAt)?.getTime() ?? Date.now();
  const updatedAt = toDate(order.updatedAt)?.getTime() ?? Date.now();

  const doc: ConvexOrderDoc = {
    mongoId,
    orderId,
    customerMongoId,
    status: String(order.status || "pending").toLowerCase(),
    tableData: normalizeTableData(order.tableData),
    isTrash: Boolean(order.isTrash),
    createdAt,
    updatedAt,
  };

  const dateMs = dateToEpochMs(date);
  if (dateMs !== undefined) doc.date = dateMs;
  if (dyeingMongoId) doc.dyeingMongoId = dyeingMongoId;

  const invoiceNumber = order.invoiceNumber;
  if (invoiceNumber != null && invoiceNumber !== "") {
    doc.invoiceNumber = String(invoiceNumber);
  }
  if (order.companyName != null && order.companyName !== "") {
    doc.companyName = String(order.companyName);
  }
  if (order.clotheType != null && order.clotheType !== "") {
    doc.clotheType = String(order.clotheType);
  }
  const finishingWidth = toNumberOrUndefined(order.finishingWidth);
  if (finishingWidth !== undefined) doc.finishingWidth = finishingWidth;
  if (order.quality != null && order.quality !== "") {
    doc.quality = String(order.quality);
  }
  if (order.sillName != null && order.sillName !== "") {
    doc.sillName = String(order.sillName);
  }
  if (order.colour != null && order.colour !== "") {
    doc.colour = String(order.colour);
  }
  if (order.finishingType != null && order.finishingType !== "") {
    doc.finishingType = String(order.finishingType);
  }
  const totalGoj = toNumberOrUndefined(order.totalGoj);
  if (totalGoj !== undefined) doc.totalGoj = totalGoj;
  const totalBundle = toNumberOrUndefined(order.totalBundle);
  if (totalBundle !== undefined) doc.totalBundle = totalBundle;
  if (order.dyeingName != null && order.dyeingName !== "") {
    doc.dyeingName = String(order.dyeingName);
  }
  if (order.transporterName != null && order.transporterName !== "") {
    doc.transporterName = String(order.transporterName);
  }

  return doc;
}
