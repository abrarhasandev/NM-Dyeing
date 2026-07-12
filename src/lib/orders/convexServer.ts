/**
 * Server-only Convex client for dual-write mirrors.
 *
 * - Never import this module from client components.
 * - Mirror is opt-in via ORDER_CONVEX_MIRROR=true.
 * - Failures are soft-logged so Mongo primary writes never fail for mirror issues.
 * - Order Workflow Cluster + remaining domains (customers, payments, menu, etc.).
 */

import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../convex/_generated/api";
import type { ConvexOrderDoc } from "@/types/order";
import { mongoOrderToConvexDoc } from "@/lib/orders/mongoToConvex";
import {
  mongoBatchToConvexDoc,
  mongoInvoiceToConvexDoc,
  toPlain as toPlainOrder,
} from "@/lib/orders/mapBatchInvoice";
import {
  toPlain,
  mongoCustomerToConvexDoc,
  mongoDyeingToConvexDoc,
  mongoCalenderToConvexDoc,
  mongoPaymentToConvexDoc,
  mongoBillingSummaryToConvexDoc,
  mongoSavedInvoiceToConvexDoc,
  mongoLedgerSnapshotToConvexDoc,
  mongoUserToConvexDoc,
  mongoMenuNameToConvexDoc,
  mongoProcessToConvexDoc,
} from "@/lib/convex/mapRemaining";

// Prefer shared toPlain (handles mongoose docs)
export { toPlain };

function isMirrorEnabled(): boolean {
  return process.env.ORDER_CONVEX_MIRROR === "true";
}

function getMirrorSecret(): string | null {
  return process.env.ORDER_MIRROR_SECRET || null;
}

function getConvexUrl(): string | null {
  return process.env.NEXT_PUBLIC_CONVEX_URL || null;
}

function createClient(): ConvexHttpClient | null {
  const url = getConvexUrl();
  if (!url) return null;
  return new ConvexHttpClient(url);
}

function logMirrorError(action: string, err: unknown) {
  const message = err instanceof Error ? err.message : String(err);
  console.error(`[convex-mirror] ${action} failed:`, message);
}

function guard(): { secret: string; client: ConvexHttpClient } | null {
  if (!isMirrorEnabled()) return null;
  const secret = getMirrorSecret();
  const client = createClient();
  if (!secret || !client) {
    console.warn(
      "[convex-mirror] ORDER_CONVEX_MIRROR=true but ORDER_MIRROR_SECRET or CONVEX URL missing — skip"
    );
    return null;
  }
  return { secret, client };
}

// ─── Orders ──────────────────────────────────────────────────────────────────

export async function mirrorOrderUpsert(
  mongoOrder: Record<string, unknown>
): Promise<void> {
  const g = guard();
  if (!g) return;
  try {
    const plain = toPlainOrder(mongoOrder) || toPlain(mongoOrder);
    const doc: ConvexOrderDoc = mongoOrderToConvexDoc(plain);
    await g.client.mutation(api.orders.mirrorUpsert, {
      mirrorSecret: g.secret,
      ...doc,
    });
  } catch (err) {
    logMirrorError("orders.mirrorUpsert", err);
  }
}

export async function mirrorOrderPatchStatus(
  mongoId: string,
  status: string
): Promise<void> {
  const g = guard();
  if (!g) return;
  try {
    await g.client.mutation(api.orders.mirrorPatchStatus, {
      mirrorSecret: g.secret,
      mongoId: String(mongoId),
      status: String(status).toLowerCase(),
      updatedAt: Date.now(),
    });
  } catch (err) {
    logMirrorError("orders.mirrorPatchStatus", err);
  }
}

export async function mirrorOrderTrash(mongoId: string): Promise<void> {
  const g = guard();
  if (!g) return;
  try {
    await g.client.mutation(api.orders.mirrorTrash, {
      mirrorSecret: g.secret,
      mongoId: String(mongoId),
      updatedAt: Date.now(),
    });
  } catch (err) {
    logMirrorError("orders.mirrorTrash", err);
  }
}

export async function mirrorOrderRestore(mongoId: string): Promise<void> {
  const g = guard();
  if (!g) return;
  try {
    await g.client.mutation(api.orders.mirrorRestore, {
      mirrorSecret: g.secret,
      mongoId: String(mongoId),
      updatedAt: Date.now(),
    });
  } catch (err) {
    logMirrorError("orders.mirrorRestore", err);
  }
}

export async function mirrorOrderRemove(mongoId: string): Promise<void> {
  const g = guard();
  if (!g) return;
  try {
    await g.client.mutation(api.orders.mirrorRemove, {
      mirrorSecret: g.secret,
      mongoId: String(mongoId),
    });
  } catch (err) {
    logMirrorError("orders.mirrorRemove", err);
  }
}

// ─── Batches ─────────────────────────────────────────────────────────────────

export async function mirrorBatchUpsert(mongoBatch: unknown): Promise<void> {
  const g = guard();
  if (!g) return;
  try {
    const doc = mongoBatchToConvexDoc(toPlainOrder(mongoBatch) || toPlain(mongoBatch));
    await g.client.mutation(api.batches.mirrorUpsert, {
      mirrorSecret: g.secret,
      ...doc,
    });
  } catch (err) {
    logMirrorError("batches.mirrorUpsert", err);
  }
}

export async function mirrorBatchRemove(mongoId: string): Promise<void> {
  const g = guard();
  if (!g) return;
  try {
    await g.client.mutation(api.batches.mirrorRemove, {
      mirrorSecret: g.secret,
      mongoId: String(mongoId),
    });
  } catch (err) {
    logMirrorError("batches.mirrorRemove", err);
  }
}

// ─── Invoices ────────────────────────────────────────────────────────────────

export async function mirrorInvoiceUpsert(mongoInvoice: unknown): Promise<void> {
  const g = guard();
  if (!g) return;
  try {
    const doc = mongoInvoiceToConvexDoc(
      toPlainOrder(mongoInvoice) || toPlain(mongoInvoice)
    );
    await g.client.mutation(api.invoices.mirrorUpsert, {
      mirrorSecret: g.secret,
      ...doc,
    });
  } catch (err) {
    logMirrorError("invoices.mirrorUpsert", err);
  }
}

export async function mirrorInvoiceRemove(mongoId: string): Promise<void> {
  const g = guard();
  if (!g) return;
  try {
    await g.client.mutation(api.invoices.mirrorRemove, {
      mirrorSecret: g.secret,
      mongoId: String(mongoId),
    });
  } catch (err) {
    logMirrorError("invoices.mirrorRemove", err);
  }
}

// ─── Customers ───────────────────────────────────────────────────────────────

export async function mirrorCustomerUpsert(mongoDoc: unknown): Promise<void> {
  const g = guard();
  if (!g) return;
  try {
    const doc = mongoCustomerToConvexDoc(toPlain(mongoDoc));
    await g.client.mutation(api.customers.mirrorUpsert, {
      mirrorSecret: g.secret,
      ...doc,
    });
  } catch (err) {
    logMirrorError("customers.mirrorUpsert", err);
  }
}

export async function mirrorCustomerRemove(mongoId: string): Promise<void> {
  const g = guard();
  if (!g) return;
  try {
    await g.client.mutation(api.customers.mirrorRemove, {
      mirrorSecret: g.secret,
      mongoId: String(mongoId),
    });
  } catch (err) {
    logMirrorError("customers.mirrorRemove", err);
  }
}

// ─── Dyeings ─────────────────────────────────────────────────────────────────

export async function mirrorDyeingUpsert(mongoDoc: unknown): Promise<void> {
  const g = guard();
  if (!g) return;
  try {
    const doc = mongoDyeingToConvexDoc(toPlain(mongoDoc));
    await g.client.mutation(api.dyeings.mirrorUpsert, {
      mirrorSecret: g.secret,
      ...doc,
    });
  } catch (err) {
    logMirrorError("dyeings.mirrorUpsert", err);
  }
}

export async function mirrorDyeingRemove(mongoId: string): Promise<void> {
  const g = guard();
  if (!g) return;
  try {
    await g.client.mutation(api.dyeings.mirrorRemove, {
      mirrorSecret: g.secret,
      mongoId: String(mongoId),
    });
  } catch (err) {
    logMirrorError("dyeings.mirrorRemove", err);
  }
}

// ─── Calenders ───────────────────────────────────────────────────────────────

export async function mirrorCalenderUpsert(mongoDoc: unknown): Promise<void> {
  const g = guard();
  if (!g) return;
  try {
    const doc = mongoCalenderToConvexDoc(toPlain(mongoDoc));
    await g.client.mutation(api.calenders.mirrorUpsert, {
      mirrorSecret: g.secret,
      ...doc,
    });
  } catch (err) {
    logMirrorError("calenders.mirrorUpsert", err);
  }
}

export async function mirrorCalenderRemove(mongoId: string): Promise<void> {
  const g = guard();
  if (!g) return;
  try {
    await g.client.mutation(api.calenders.mirrorRemove, {
      mirrorSecret: g.secret,
      mongoId: String(mongoId),
    });
  } catch (err) {
    logMirrorError("calenders.mirrorRemove", err);
  }
}

// ─── Payments ────────────────────────────────────────────────────────────────

export async function mirrorPaymentUpsert(mongoDoc: unknown): Promise<void> {
  const g = guard();
  if (!g) return;
  try {
    const doc = mongoPaymentToConvexDoc(toPlain(mongoDoc));
    await g.client.mutation(api.payments.mirrorUpsert, {
      mirrorSecret: g.secret,
      ...doc,
    });
  } catch (err) {
    logMirrorError("payments.mirrorUpsert", err);
  }
}

export async function mirrorPaymentRemove(mongoId: string): Promise<void> {
  const g = guard();
  if (!g) return;
  try {
    await g.client.mutation(api.payments.mirrorRemove, {
      mirrorSecret: g.secret,
      mongoId: String(mongoId),
    });
  } catch (err) {
    logMirrorError("payments.mirrorRemove", err);
  }
}

// ─── Billing summaries ───────────────────────────────────────────────────────

export async function mirrorBillingSummaryUpsert(
  mongoDoc: unknown
): Promise<void> {
  const g = guard();
  if (!g) return;
  try {
    const doc = mongoBillingSummaryToConvexDoc(toPlain(mongoDoc));
    await g.client.mutation(api.billingSummaries.mirrorUpsert, {
      mirrorSecret: g.secret,
      ...doc,
    });
  } catch (err) {
    logMirrorError("billingSummaries.mirrorUpsert", err);
  }
}

export async function mirrorBillingSummaryRemove(
  mongoId: string
): Promise<void> {
  const g = guard();
  if (!g) return;
  try {
    await g.client.mutation(api.billingSummaries.mirrorRemove, {
      mirrorSecret: g.secret,
      mongoId: String(mongoId),
    });
  } catch (err) {
    logMirrorError("billingSummaries.mirrorRemove", err);
  }
}

// ─── Saved invoices ──────────────────────────────────────────────────────────

export async function mirrorSavedInvoiceUpsert(
  mongoDoc: unknown
): Promise<void> {
  const g = guard();
  if (!g) return;
  try {
    const doc = mongoSavedInvoiceToConvexDoc(toPlain(mongoDoc));
    await g.client.mutation(api.savedInvoices.mirrorUpsert, {
      mirrorSecret: g.secret,
      ...doc,
    });
  } catch (err) {
    logMirrorError("savedInvoices.mirrorUpsert", err);
  }
}

export async function mirrorSavedInvoiceRemove(mongoId: string): Promise<void> {
  const g = guard();
  if (!g) return;
  try {
    await g.client.mutation(api.savedInvoices.mirrorRemove, {
      mirrorSecret: g.secret,
      mongoId: String(mongoId),
    });
  } catch (err) {
    logMirrorError("savedInvoices.mirrorRemove", err);
  }
}

// ─── Ledger snapshots ────────────────────────────────────────────────────────

export async function mirrorLedgerSnapshotUpsert(
  mongoDoc: unknown
): Promise<void> {
  const g = guard();
  if (!g) return;
  try {
    const doc = mongoLedgerSnapshotToConvexDoc(toPlain(mongoDoc));
    await g.client.mutation(api.ledgerSnapshots.mirrorUpsert, {
      mirrorSecret: g.secret,
      ...doc,
    });
  } catch (err) {
    logMirrorError("ledgerSnapshots.mirrorUpsert", err);
  }
}

export async function mirrorLedgerSnapshotRemove(
  mongoId: string
): Promise<void> {
  const g = guard();
  if (!g) return;
  try {
    await g.client.mutation(api.ledgerSnapshots.mirrorRemove, {
      mirrorSecret: g.secret,
      mongoId: String(mongoId),
    });
  } catch (err) {
    logMirrorError("ledgerSnapshots.mirrorRemove", err);
  }
}

// ─── Users (no password) ─────────────────────────────────────────────────────

export async function mirrorUserUpsert(mongoDoc: unknown): Promise<void> {
  const g = guard();
  if (!g) return;
  try {
    const doc = mongoUserToConvexDoc(toPlain(mongoDoc));
    await g.client.mutation(api.users.mirrorUpsert, {
      mirrorSecret: g.secret,
      ...doc,
    });
  } catch (err) {
    logMirrorError("users.mirrorUpsert", err);
  }
}

export async function mirrorUserRemove(mongoId: string): Promise<void> {
  const g = guard();
  if (!g) return;
  try {
    await g.client.mutation(api.users.mirrorRemove, {
      mirrorSecret: g.secret,
      mongoId: String(mongoId),
    });
  } catch (err) {
    logMirrorError("users.mirrorRemove", err);
  }
}

// ─── Menu catalogs ───────────────────────────────────────────────────────────

export async function mirrorClothTypeUpsert(mongoDoc: unknown): Promise<void> {
  const g = guard();
  if (!g) return;
  try {
    const doc = mongoMenuNameToConvexDoc(toPlain(mongoDoc));
    await g.client.mutation(api.menu.clothTypesMirrorUpsert, {
      mirrorSecret: g.secret,
      ...doc,
    });
  } catch (err) {
    logMirrorError("menu.clothTypesMirrorUpsert", err);
  }
}

export async function mirrorClothTypeRemove(mongoId: string): Promise<void> {
  const g = guard();
  if (!g) return;
  try {
    await g.client.mutation(api.menu.clothTypesMirrorRemove, {
      mirrorSecret: g.secret,
      mongoId: String(mongoId),
    });
  } catch (err) {
    logMirrorError("menu.clothTypesMirrorRemove", err);
  }
}

export async function mirrorColourUpsert(mongoDoc: unknown): Promise<void> {
  const g = guard();
  if (!g) return;
  try {
    const doc = mongoMenuNameToConvexDoc(toPlain(mongoDoc));
    await g.client.mutation(api.menu.coloursMirrorUpsert, {
      mirrorSecret: g.secret,
      ...doc,
    });
  } catch (err) {
    logMirrorError("menu.coloursMirrorUpsert", err);
  }
}

export async function mirrorColourRemove(mongoId: string): Promise<void> {
  const g = guard();
  if (!g) return;
  try {
    await g.client.mutation(api.menu.coloursMirrorRemove, {
      mirrorSecret: g.secret,
      mongoId: String(mongoId),
    });
  } catch (err) {
    logMirrorError("menu.coloursMirrorRemove", err);
  }
}

export async function mirrorFinishingTypeUpsert(
  mongoDoc: unknown
): Promise<void> {
  const g = guard();
  if (!g) return;
  try {
    const doc = mongoMenuNameToConvexDoc(toPlain(mongoDoc));
    await g.client.mutation(api.menu.finishingTypesMirrorUpsert, {
      mirrorSecret: g.secret,
      ...doc,
    });
  } catch (err) {
    logMirrorError("menu.finishingTypesMirrorUpsert", err);
  }
}

export async function mirrorFinishingTypeRemove(
  mongoId: string
): Promise<void> {
  const g = guard();
  if (!g) return;
  try {
    await g.client.mutation(api.menu.finishingTypesMirrorRemove, {
      mirrorSecret: g.secret,
      mongoId: String(mongoId),
    });
  } catch (err) {
    logMirrorError("menu.finishingTypesMirrorRemove", err);
  }
}

export async function mirrorProcessUpsert(mongoDoc: unknown): Promise<void> {
  const g = guard();
  if (!g) return;
  try {
    const doc = mongoProcessToConvexDoc(toPlain(mongoDoc));
    await g.client.mutation(api.menu.processesMirrorUpsert, {
      mirrorSecret: g.secret,
      ...doc,
    });
  } catch (err) {
    logMirrorError("menu.processesMirrorUpsert", err);
  }
}

export async function mirrorProcessRemove(mongoId: string): Promise<void> {
  const g = guard();
  if (!g) return;
  try {
    await g.client.mutation(api.menu.processesMirrorRemove, {
      mirrorSecret: g.secret,
      mongoId: String(mongoId),
    });
  } catch (err) {
    logMirrorError("menu.processesMirrorRemove", err);
  }
}

export async function mirrorQualityUpsert(mongoDoc: unknown): Promise<void> {
  const g = guard();
  if (!g) return;
  try {
    const doc = mongoMenuNameToConvexDoc(toPlain(mongoDoc));
    await g.client.mutation(api.menu.qualitiesMirrorUpsert, {
      mirrorSecret: g.secret,
      ...doc,
    });
  } catch (err) {
    logMirrorError("menu.qualitiesMirrorUpsert", err);
  }
}

export async function mirrorQualityRemove(mongoId: string): Promise<void> {
  const g = guard();
  if (!g) return;
  try {
    await g.client.mutation(api.menu.qualitiesMirrorRemove, {
      mirrorSecret: g.secret,
      mongoId: String(mongoId),
    });
  } catch (err) {
    logMirrorError("menu.qualitiesMirrorRemove", err);
  }
}

export async function mirrorSillNameUpsert(mongoDoc: unknown): Promise<void> {
  const g = guard();
  if (!g) return;
  try {
    const doc = mongoMenuNameToConvexDoc(toPlain(mongoDoc));
    await g.client.mutation(api.menu.sillNamesMirrorUpsert, {
      mirrorSecret: g.secret,
      ...doc,
    });
  } catch (err) {
    logMirrorError("menu.sillNamesMirrorUpsert", err);
  }
}

export async function mirrorSillNameRemove(mongoId: string): Promise<void> {
  const g = guard();
  if (!g) return;
  try {
    await g.client.mutation(api.menu.sillNamesMirrorRemove, {
      mirrorSecret: g.secret,
      mongoId: String(mongoId),
    });
  } catch (err) {
    logMirrorError("menu.sillNamesMirrorRemove", err);
  }
}

/**
 * Soft-mirror a BillingSummary or Payment after isSavedInLedger flag changes.
 * Re-fetches are caller's responsibility (pass the updated doc).
 */
export async function mirrorLedgerFlagDoc(
  modelType: string | undefined,
  mongoDoc: unknown
): Promise<void> {
  if (!mongoDoc) return;
  if (modelType === "BillingSummary") {
    await mirrorBillingSummaryUpsert(mongoDoc);
  } else if (modelType === "Payment") {
    await mirrorPaymentUpsert(mongoDoc);
  }
}
