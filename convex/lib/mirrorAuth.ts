/**
 * Shared secret gate for dual-write / backfill mutations.
 * Secret is set via: npx convex env set ORDER_MIRROR_SECRET
 */
export function assertMirrorSecret(secret: string) {
  const expected = process.env.ORDER_MIRROR_SECRET;
  if (!expected || secret !== expected) {
    throw new Error("Unauthorized: invalid ORDER_MIRROR_SECRET");
  }
}
