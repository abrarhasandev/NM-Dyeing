# Order → Convex Inventory & Parity Matrix (C1 / Phase A)

Living checklist for the order-domain Convex migration.  
**Mongo remains source of truth** until Phase F cutover.  
**No production data write** until Phase E is explicitly approved.

## Auth façade (Phase B — locked)

| Decision | Choice |
|----------|--------|
| Pattern | **B1 — server façade** |
| Browser | Continues to call `/api/order*` only (NextAuth via `proxy.js`) |
| Convex writes | Only via Next Route Handlers using mirror secret (`ORDER_MIRROR_SECRET`) |
| Public Convex order mutations from client | **Forbidden** |
| Later | Optional B2 (Convex Auth / JWT) after cutover |

Env flags (server / Convex dashboard):

| Variable | Where | Purpose |
|----------|--------|---------|
| `ORDER_CONVEX_MIRROR` | Next `.env` | `true` enables soft dual-write after Mongo success |
| `ORDER_MIRROR_SECRET` | Next + Convex env | Shared secret for mirror mutations |
| `NEXT_PUBLIC_CONVEX_URL` | Next (already) | Convex deployment URL |

## Status vocabulary (decision)

**Preserve raw values as free strings** (including live drift `calender` and schema enum `completedprocess`).  
Do **not** normalize until a separate owner-approved cleanup.

## Parity matrix

| Capability | Mongo path today | Convex target | Acceptance |
|------------|------------------|---------------|------------|
| List + pagination + filters + trash | `GET /api/order` | `orders.list` (later) | Same filters, page shape |
| KPIs + prev period + chart | aggregation in GET | `orders.stats` (later) | KPI/chart parity |
| Create | `POST /api/order` | `orders.mirrorUpsert` | Row appears in Convex when mirror on |
| Get one | `GET /api/order/[id]` | `orders.getByMongoId` | Field parity |
| Update | `PUT /api/order/[id]` | `orders.mirrorUpsert` | Soft dual-write |
| Status patch | `PATCH /api/order/[id]` | `orders.mirrorPatchStatus` | Soft dual-write |
| Soft delete | `DELETE /api/order/[id]` | `orders.mirrorTrash` | Soft dual-write |
| Hard delete | `DELETE ?permanent=true` | `orders.mirrorRemove` | Soft dual-write |
| Restore | `PATCH .../restore` | `orders.mirrorRestore` | Soft dual-write |
| Batch summary on list | Batch + BillingSummary join | Still Mongo until Batch wave | Unchanged |
| Batch lifecycle | `api/batch/**` | later `batches.*` | Out of scope Phase A–C |
| Invoice / billing | `api/batch/invoice/**` | later | Out of scope Phase A–C |
| Print / deep-link / transport filter | UI | adapter contracts | Unchanged |

## ID strategy

| Field | Role |
|-------|------|
| Mongo `_id` (hex string as `mongoId`) | Canonical FK for Batch/Invoice/Billing during dual period |
| `orderId` (`#ord-…`) | Human/display id, unique |
| Convex `_id` | Internal Convex id; UI keeps using Mongo id until cutover |

## Consumer inventory (must not break)

### APIs

- `src/app/api/order/route.js`
- `src/app/api/order/[id]/route.js`
- `src/app/api/order/[id]/restore/route.js`
- All `src/app/api/batch/**` order-keyed routes
- Ledger trees using `displayOrderId` / `orderIds` only (soft)

### UI / hooks

- `src/components/order/*`
- `src/components/OrderStatus/*`, `src/components/Batch/*`
- `src/hooks/useOrders.ts` (adapter; Mongo fetch)
- `src/app/dashboard/createOrder/page.jsx`
- `src/app/dashboard/order/update/[id]/page.jsx`
- `src/app/dashboard/transport/[id]/orders/page.jsx`

## Cluster waves (same program, later)

1. Order core (this skeleton)  
2. Batch (+ roll logic)  
3. Invoice + BillingSummary  
4. Retire Mongo Order only after 2–3 cut over  

## Phase status

| Phase | Status |
|-------|--------|
| A Inventory | **Done** (this doc) |
| B Auth façade | **Done** — B1 server mirror + `ORDER_MIRROR_SECRET` |
| C Schema + functions | **Done** — `convex/orders.ts` deployed via codegen |
| D Adapter | **Done** — `src/hooks/useOrders.ts` still Mongo primary |
| Dual-write hooks in API | **Enabled** for Orders + Batches + Invoices (`ORDER_CONVEX_MIRROR=true`) |
| E Dry-run backfill script | **Done** — `scripts/migrate-all-to-convex.js` |
| E Live backfill | **Done** — Orders 182, Batches 194, Invoices 221 in Convex |
| Dual-write batch/invoice routes | **Done** — create/update/delete paths soft-mirror |
| F Read cutover | Not started (Mongo still primary for UI/API reads) |
| G Retire Mongo | Not started |

## Enable dual-write (staging first)

1. Generate a long random secret.
2. Convex dashboard / CLI: `npx convex env set ORDER_MIRROR_SECRET "<secret>"`
3. Next server env: `ORDER_MIRROR_SECRET=<same>` and `ORDER_CONVEX_MIRROR=true`
4. Create/update an order; verify with Convex dashboard `orders` table or `orders.countAll` query.
5. Keep Mongo as source of truth; mirror failures only log to server console.
