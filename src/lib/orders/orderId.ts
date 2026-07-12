/**
 * Port of Order model pre-validate hook (src/models/Order.js).
 * Generates human-facing ids: #ord-YYYY-MMDD-RRR
 */

export function generateOrderId(date?: Date | null): string {
  const targetDate = date instanceof Date && !isNaN(date.getTime()) ? date : new Date();
  const year = targetDate.getUTCFullYear();
  const month = String(targetDate.getUTCMonth() + 1).padStart(2, "0");
  const day = String(targetDate.getUTCDate()).padStart(2, "0");
  const random = Math.floor(Math.random() * 900) + 100;
  return `#ord-${year}-${month}${day}-${random}`;
}

/** Parse API date strings the same way as order route handlers. */
export function parseOrderDate(rawDate: unknown): Date | null {
  if (!rawDate) return null;
  if (rawDate instanceof Date && !isNaN(rawDate.getTime())) return rawDate;
  if (typeof rawDate !== "string") return null;

  if (rawDate.includes("/")) {
    const [d, m, y] = rawDate.split("/").map(Number);
    if (d && m && y) return new Date(Date.UTC(y, m - 1, d));
    return null;
  }

  const parsed = new Date(rawDate);
  return isNaN(parsed.getTime()) ? null : parsed;
}

export function dateToEpochMs(date: Date | null | undefined): number | undefined {
  if (!date || isNaN(date.getTime())) return undefined;
  return date.getTime();
}
