# NM-Dyeing System — দীর্ঘমেয়াদী আর্কিটেকচার গাইডলাইন

**তৈরি:** জুলাই ২০২৬ | **ভিত্তি:** আপনার codebase analysis report + বর্তমান (২০২৬) industry best practices যাচাই করে

> **একটা জরুরি disclaimer দিয়ে শুরু করি:** আমি শুধু আপনার তৈরি করা analysis report দেখেছি, পুরো codebase না। তাই নিচের কিছু সুপারিশ assumption-ভিত্তিক — যেখানে assumption করছি, স্পষ্ট করে বলে দিচ্ছি। আপনার architectural instinct (prevention-first design, adapter pattern রাখা) ইতিমধ্যেই ভালো — এই গাইডলাইন সেটার উপর build করে।

---

## অংশ ০: Priority Matrix — এক নজরে কী আগে করবেন

| Priority | Action | কেন গুরুত্বপূর্ণ | আনুমানিক effort |
|---|---|---|---|
| 🔴 Critical | Next.js-কে সর্বশেষ patch-এ (16.2.10+) আপডেট করুন | ২০২৬ সালে middleware/proxy bypass সংক্রান্ত একাধিক security advisory এসেছে (নিচে ২.১ দেখুন) | ১-২ দিন |
| 🔴 Critical | প্রতিটি sensitive route-এ server-side auth recheck বসান — শুধু middleware/proxy.ts-এর উপর নির্ভর করবেন না | Defense-in-depth ছাড়া middleware bypass = পুরো app exposed | ৩-৫ দিন |
| 🟠 High | Invoice/Ledger/Batch-এর জন্য reconciliation job বসান | Dual-write silent drift = ভুল হিসাব, ক্লায়েন্ট dispute | ১ সপ্তাহ |
| 🟠 High | Financial mutation-এর জন্য immutable audit log | জবাবদিহিতা, dispute resolution-এর জন্য অপরিহার্য | ৩-৪ দিন |
| 🟡 Medium | RBAC formalize করুন (boolean flag থেকে role+permission মডেলে) | ক্লায়েন্ট, ফ্যাক্টরি, স্টাফ — আলাদা access level দরকার | ১ সপ্তাহ |
| 🟡 Medium | বাকি `.js`/`.jsx` ফাইল TypeScript-এ migrate করুন (financial module আগে) | Type safety silently bug কমায় | চলমান (ongoing) |
| 🟢 Low | Cache Components / Turbopack build অপ্টিমাইজেশন | এখন optional, স্কেল বাড়লে জরুরি হবে | যখন সময় পাবেন |

---

## অংশ ১: বর্তমান আর্কিটেকচারের মূল্যায়ন

### যা ভালো করেছেন
- **Next.js App Router + TypeScript-first** — এটাই ২০২৬ সালের সঠিক default choice।
- **Convex-কে "destination" হিসেবে বেছে নেওয়া** — Convex-এর built-in reactivity, end-to-end type safety, এবং transaction guarantee একটা ছোট টিমের জন্য PostgreSQL+Redis+WebSocket ম্যানেজ করার চেয়ে অনেক কম operational overhead দেয়। এই সিদ্ধান্ত সঠিক ছিল।
- **"No big-bang" migration rule ও mongoId রাখা** — এটা textbook-সঠিক approach। বেশিরভাগ টিম এটা না করে সরাসরি cutover করে ফেলে এবং data loss-এ পড়ে।
- **Adapter/hook দিয়ে UI-কে raw fetching থেকে আলাদা রাখা** — এই discipline-টাই migration-কে আসলে "seamless" করে তুলবে, যদি consistently প্রয়োগ করা হয়।

### যেখানে ঝুঁকি আছে
1. **Dual-write mirror নিজেই একটা known anti-pattern** যদি সাথে reconciliation/verification layer না থাকে — report-এ এই layer-এর উল্লেখ নেই।
2. **Auth.js v5 এখনও আনুষ্ঠানিকভাবে beta** (নিচে বিস্তারিত) — financial data-নির্ভর অ্যাপে এটা extra care দাবি করে।
3. **RBAC অস্পষ্ট** — report শুধু "NextAuth session" বলছে, কিন্তু আপনার ব্যবসায় অন্তত ৪ ধরনের actor আছে (owner/staff, garment client, dyeing factory, admin) — schema-তে এটা explicit না হলে ভবিষ্যতে security hole হয়ে দাঁড়াবে।
4. **হাইব্রিড state-এর কোনো exit criteria বা timeline উল্লেখ নেই** — "gradual migration" যদি time-boxed না হয়, এটা স্থায়ী জটিলতা হয়ে থেকে যায় (এটা industry-wide সবচেয়ে সাধারণ migration failure pattern)।

---

## অংশ ২: Critical — নিরাপত্তা (এই সপ্তাহেই করুন)

### ২.১ Next.js ভার্সন ও Middleware/Proxy Bypass ঝুঁকি

জুলাই ২০২৬ পর্যন্ত তথ্য অনুযায়ী, Next.js-এর বর্তমান stable হলো **16.2.10** (১ জুলাই ২০২৬ রিলিজ)। ২০২৬ সালের মে মাসে Vercel একটা সমন্বিত security release দিয়েছিল যেখানে App Router-এর middleware/proxy authorization bypass সংক্রান্ত একাধিক high-severity advisory patch করা হয়েছে — segment-prefetch route-এর মাধ্যমে bypass, dynamic route parameter injection-এর মাধ্যমে bypass, এবং Pages Router i18n default-locale path bypass। এর আগেও ২০২৫ সালে `x-middleware-subrequest` header spoof করে middleware-only session protection বাইপাস করার একটা পরিচিত দুর্বলতা প্রকাশ পেয়েছিল।

**আপনার জন্য কেন এটা সরাসরি প্রাসঙ্গিক:** আপনার auth NextAuth v5-নির্ভর, এবং সাধারণত এ ধরনের সেটআপে route protection middleware-এ (Next.js 16-এ যেটা `proxy.ts` নামে rename হয়েছে) বসানো হয়। যদি আপনার protected route-গুলোর authorization শুধুমাত্র middleware-এর উপর নির্ভর করে, তাহলে উপরের bypass class-গুলো সরাসরি প্রযোজ্য — অর্থাৎ আক্রমণকারী middleware এড়িয়ে সরাসরি protected route/API-তে পৌঁছাতে পারার সম্ভাবনা থাকে।

**করণীয়:**
```bash
npm show next version        # বর্তমান ভার্সন যাচাই করুন
npm install next@latest react@19 react-dom@19
npx @next/codemod@latest upgrade
```
- `middleware.ts` থাকলে `proxy.ts`-এ rename করুন (Next.js 16 requirement)।
- Custom webpack config থাকলে Turbopack-এর নিচে টেস্ট করুন (Next 16-এ Turbopack default)।
- staging-এ পুরো auth flow টেস্ট করে তারপর production deploy করুন।

### ২.২ Defense-in-Depth Authorization প্যাটার্ন

মূল নীতি: **middleware/proxy.ts কে শুধু UX optimization (দ্রুত redirect) হিসেবে দেখুন, নিরাপত্তার একমাত্র স্তর হিসেবে না।** প্রতিটা sensitive Server Component, Route Handler, ও Server Action-এ নিজে থেকে session revalidate করুন।

```typescript
// src/lib/authz.ts
import { auth } from "@/auth";

type Role = "owner" | "staff" | "client_garment" | "factory_contact";

export async function requireRole(allowed: Role[]) {
  const session = await auth(); // প্রতিটি entry point-এ পুনরায় যাচাই
  if (!session?.user) throw new Error("UNAUTHENTICATED");
  if (!allowed.includes(session.user.role as Role)) {
    throw new Error("FORBIDDEN");
  }
  return session;
}
```
```typescript
// src/app/api/invoices/[id]/route.ts
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await requireRole(["owner", "staff"]); // <-- middleware-এর উপর ভরসা না করে এখানেও চেক
  // ... বাকি লজিক
}
```

এটা কিছুটা "duplicate" মনে হতে পারে, কিন্তু ২০২৬ সালের bypass advisory-গুলো ঠিক এই কারণেই এসেছে — middleware bypass হলেও, route নিজে auth চেক করলে আক্রমণ থেমে যায়।

### ২.৩ Auth.js v5 হার্ডেনিং

Auth.js v5 (NextAuth-এর নতুন নাম) কয়েক বছর ধরে production-এ ব্যাপকভাবে ব্যবহৃত হলেও এখনও আনুষ্ঠানিকভাবে "beta" ট্যাগে আছে — মূলত API polish ও ecosystem স্থিতিশীলতার কারণে, functional অস্থিরতার কারণে না। তবে এর মানে হলো: breaking change আসতে পারে যেকোনো minor bump-এ।

**সুপারিশ:**
- `package.json`-এ exact version pin করুন (caret `^` না দিয়ে), changelog না পড়ে bump করবেন না।
- v5-এর split-config pattern মেনে চলুন: `auth.config.ts` (edge-safe, providers/callbacks) আলাদা রাখুন `auth.ts` (database adapter-সহ) থেকে — এতে edge middleware lightweight থাকে।
- `AUTH_*` env variable naming convention ব্যবহার করুন (পুরনো `NEXTAUTH_*` থেকে migrate করা থাকলে ভালো)।
- **Session strategy:** financial admin action-এর জন্য pure JWT-এর বদলে database session বিবেচনা করুন — কারণ JWT সহজে revoke করা যায় না (কেউ compromised হলে তার session সাথে সাথে বাতিল করতে পারবেন না), যেখানে DB session তাৎক্ষণিক invalidate করা যায়।
- **এখনই দরকার নেই কিন্তু ভবিষ্যতে বিবেচনা করার মতো:** কিছু ২০২৬-এর industry analysis নতুন প্রজেক্টের জন্য Better Auth-এর দিকে ঝুঁকছে (fully self-hosted session control, active development)। কিন্তু আপনার existing bcrypt hash + NextAuth infrastructure থাকায় migration cost বেশি — এখন এটা রিরাইট করার যৌক্তিকতা নেই। বরং উপরের হার্ডেনিং যথেষ্ট।
- Login route-এ Upstash Redis দিয়ে rate limiting বসান (আপনার stack-এ এটা এমনিতেই আছে, শুধু auth route-এ apply করা বাকি)।

---

## অংশ ৩: ডেটা আর্কিটেকচার — MongoDB → Convex মাইগ্রেশন পুনর্গঠন

### ৩.১ কেন "Dual-Write Mirror" একা যথেষ্ট না

Dual-write pattern-এর মৌলিক সমস্যা: দুইটা আলাদা write অপারেশন (Mongo + Convex) কখনোই সত্যিকারের atomic না। নেটওয়ার্ক hiccup, deploy-এর মাঝামাঝি সময়, অথবা কোনো একটা write path-এ bug থাকলে — দুই ডাটাবেসে ধীরে ধীরে **silent drift** তৈরি হয়। Invoice, Ledger, Batch-এর মতো financial entity-তে এই drift মানে সরাসরি ভুল হিসাব, এবং সেটা বহুদিন unnoticed থাকতে পারে যতক্ষণ না কোনো ক্লায়েন্ট বিরোধ তৈরি হয়।

আপনার report অনুযায়ী বর্তমানে এই drift ধরার কোনো mechanism উল্লেখ নেই। এটাই সবচেয়ে বড় gap।

### ৩.২ প্রস্তাবিত Strangler Fig Migration Framework

প্রতিটা domain (Orders, Batches, Invoices, ইত্যাদি)-কে এই ৪টা স্পষ্ট ধাপে নিয়ে যান, এবং কোন domain কোন ধাপে আছে সেটা একটা ছোট config/dashboard-এ ট্র্যাক করুন:

| ধাপ | Read source | Write target | Verification | পরের ধাপে যাওয়ার শর্ত |
|---|---|---|---|---|
| **A. Shadow Write** | MongoDB | Mongo (primary) + Convex (shadow) | নাই, শুধু backfill | Historical data সম্পূর্ণভাবে Convex-এ backfill হয়েছে |
| **B. Shadow Read + Diff** | MongoDB (এখনও primary) | Mongo + Convex | Nightly reconciliation job চলবে | পরপর ২ সপ্তাহ drift = ০% |
| **C. Convex Primary** | Convex | Convex (primary) + Mongo (safety-net secondary) | Error rate monitor, manual spot-check | ৩০ দিন কোনো critical bug ছাড়া স্থিতিশীল |
| **D. Decommission** | Convex only | Convex only | Mongo data archive/export করে রাখুন | — |

প্রতিটা domain-এর জন্য একটা simple feature-flag টেবিল (Convex-এ বা env config-এ) রাখুন — যেমন `{"orders": "phase_b", "invoices": "phase_a", "transportEmployees": "done"}` — যাতে যেকোনো সময় কোন domain কোথায় আছে সেটা এক নজরে বোঝা যায় এবং rollback সহজ হয়।

### ৩.৩ আর্থিক ডোমেইনের জন্য বাড়তি কঠোরতা (Invoices, Ledgers, Batches)

- **Immutable ledger / append-only log:** ব্যালেন্স direct-update না করে, প্রতিটা টাকার movement-কে একটা আলাদা event হিসেবে লিখুন এবং ব্যালেন্সকে সেই events-এর যোগফল হিসেবে derive করুন। এতে "কে কবে কী বদলাল" প্রশ্নের উত্তর ডেটার মধ্যেই থাকে।
- **Idempotency key:** পেমেন্ট বা invoice-related mutation-এ একটা client-generated idempotency key পাঠান, যাতে network retry-তে duplicate transaction তৈরি না হয়।
- Convex-এর mutation নিজেই transactional (সম্পূর্ণ mutation একবারে commit বা reject হয়) — এই গ্যারান্টিটা আর্থিক লজিকে পুরোপুরি কাজে লাগান, যেমন invoice তৈরি + ledger entry — একই mutation-এর ভেতর রাখুন, দুইটা আলাদা call-এ না।

### ৩.৪ Reconciliation Job (উদাহরণ)

```typescript
// convex/crons.ts
import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();
crons.daily(
  "reconcile-invoices",
  { hourUTC: 20, minuteUTC: 0 }, // বাংলাদেশ সময়ে রাত ২টা, লো-ট্রাফিক
  internal.reconciliation.checkInvoiceDrift
);
export default crons;
```
```typescript
// convex/reconciliation.ts
export const checkInvoiceDrift = internalAction(async (ctx) => {
  const convexInvoices = await ctx.runQuery(internal.invoices.listAllWithMongoId);
  for (const inv of convexInvoices) {
    const mongoDoc = await fetchFromMongoById(inv.mongoId); // বিদ্যমান adapter দিয়ে
    const drift = diffFields(inv, mongoDoc, ["totalAmount", "status", "paidAmount"]);
    if (drift.length > 0) {
      await ctx.runMutation(internal.reconciliation.logDrift, { mongoId: inv.mongoId, drift });
      // ঐচ্ছিক: Slack/email webhook-এ alert পাঠান
    }
  }
});
```

### ৩.৫ Convex Best Practices Checklist

Convex-এর নিজস্ব ডকুমেন্টেশন অনুযায়ী কিছু performance/correctness practice যা আপনার schema-তে যাচাই করা উচিত:
- **`.collect()` সাবধানে ব্যবহার করুন** — কোনো টেবিলে ১০০০+ রেকর্ড হওয়ার সম্ভাবনা থাকলে (যেমন Batches, Invoices বড় হতে পারে), `.withIndex()` + pagination ব্যবহার করুন, unbounded `.collect()` না।
- **`.filter()`-এর বদলে `.withIndex()`** — বড় ডেটাসেটে `.filter()` পুরো টেবিল স্ক্যান করে; index-based query অনেক দ্রুত।
- **Redundant index এড়িয়ে চলুন** — `by_customer` আর `by_customer_and_date` দুটোই থাকলে সাধারণত প্রথমটা অপ্রয়োজনীয় (দ্বিতীয়টা দিয়েই কাজ চলে)।
- **`v.any()` কমান** — schema-তে যত বেশি সম্ভব নির্দিষ্ট `v.object()`/`v.union()` টাইপ ব্যবহার করুন, `v.any()` টাইপ-সেফটি নষ্ট করে।
- ইচ্ছা করলে `@convex-dev/no-collect-in-query` ও `@convex-dev/no-filter-in-query` ESLint rule যোগ করে এগুলো স্বয়ংক্রিয়ভাবে ধরুন।

### ৩.৬ Repository/Adapter প্যাটার্ন (কংক্রিট উদাহরণ)

আপনার report-এ যে "adapter/hook" discipline-এর কথা বলা হয়েছে, সেটাকে concrete করলে এমন দেখাবে:

```typescript
// src/data/orders/order-repository.ts
export interface OrderRepository {
  getById(id: string): Promise<Order | null>;
  listByCustomer(customerId: string): Promise<Order[]>;
  create(input: CreateOrderInput): Promise<Order>;
}

export function getOrderRepository(): OrderRepository {
  return getMigrationPhase("orders") === "done"
    ? new ConvexOrderRepository()
    : new MongoOrderRepository();
}
```
UI কম্পোনেন্ট শুধু `getOrderRepository()` কল করে — backend সুইচ হলেও UI কোড অপরিবর্তিত থাকে। এটাই আসল "seamless switch-over" নিশ্চিত করে।

---

## অংশ ৪: RBAC/Authorization মডেল

আপনার ব্যবসায় কমপক্ষে ৪ ধরনের actor আছে বলে মনে হচ্ছে — এগুলো schema-তে explicit করুন, শুধু `isAdmin: boolean` দিয়ে না:

```typescript
// convex/schema.ts (অংশ)
export default defineSchema({
  users: defineTable({
    name: v.string(),
    email: v.string(),
    role: v.union(
      v.literal("owner"),
      v.literal("staff"),
      v.literal("client_garment"),
      v.literal("factory_contact"),
    ),
    mongoId: v.optional(v.string()),
  })
    .index("by_mongoId", ["mongoId"])
    .index("by_email", ["email"]),

  auditLogs: defineTable({
    actorId: v.id("users"),
    action: v.string(),        // যেমন "invoice.update"
    entityTable: v.string(),
    entityId: v.string(),
    before: v.optional(v.any()),
    after: v.optional(v.any()),
    at: v.number(),
  }).index("by_entity", ["entityTable", "entityId"]),
});
```

**কেন এটা গুরুত্বপূর্ণ:** garment client-কে শুধু নিজের order/invoice দেখতে দেওয়া উচিত, dyeing factory contact-কে শুধু নিজের batch-related তথ্য, আর staff/owner-এর full access। role field না থাকলে এই boundary প্রতিটা query-তে ad-hoc if-else দিয়ে maintain করতে হয় — যেটা ভুল হওয়ার সবচেয়ে বড় জায়গা।

---

## অংশ ৫: API লেয়ার ও ইনপুট ভ্যালিডেশন

- আপনার client-side-এ `react-hook-form` + `zod` আছে — একই zod schema **server-side route handler-এও reuse করুন** (একটা shared `src/schemas/` ফোল্ডারে রাখুন), যাতে client validation bypass করে সরাসরি API hit করলেও ডেটা invalid ঢুকতে না পারে।
- প্রতিটা Route Handler-এ consistent error response shape রাখুন (`{ error: { code, message } }`) — এতে frontend error handling সহজ হয়।
- Public-facing route-এ (যদি কোনো client-facing form/webhook থাকে) Upstash Redis দিয়ে rate limiting বসান।
- Financial mutation-এর প্রতিটা route-এ অংশ ৩.৪-এর audit log entry স্বয়ংক্রিয়ভাবে লিখুন — এটা একটা shared middleware/wrapper function দিয়ে করলে ভুলে যাওয়ার সুযোগ কমে।

---

## অংশ ৬: পারফরম্যান্স ও ক্যাশিং

- **Migrated domain-এ Convex-এর built-in reactivity-ই যথেষ্ট** — সেখানে আলাদা client cache layer (TanStack Query ইত্যাদি) না বসিয়ে সরাসরি Convex hook ব্যবহার করুন, দুইটা mental model একসাথে চালানো জটিলতা বাড়ায়।
- **এখনও-Mongo domain-এ** existing data-fetching approach ঠিক আছে, কিন্তু migration শেষ হওয়ার আগে নতুন cache layer যোগ করবেন না — শুধু জটিলতা বাড়বে যা শীঘ্রই ফেলে দিতে হবে।
- Next.js 16-এর Cache Components (এখনও beta) সাবধানে ব্যবহার করুন — মে ২০২৬-এর security advisory-তে Cache Components ব্যবহারকারী অ্যাপে connection-exhaustion denial-of-service সংক্রান্ত একটা issue patch হয়েছে, তাই সবসময় latest patched version-এ থাকা জরুরি এখানে।
- Upstash Redis-কে rate limiting ছাড়াও ভারী dashboard/report query-র জন্য short-TTL caching-এ ব্যবহার করতে পারেন।

---

## অংশ ৭: টেস্টিং কৌশল

আর্থিক ডেটা জড়িত থাকায় টেস্টিং-এ ছাড় দেওয়ার সুযোগ কম:

1. **Unit test (Vitest):** dyeing cost calculation, invoice total, ledger balance-এর মতো pure logic-এ — এগুলোই সবচেয়ে বেশি bug-prone এবং সবচেয়ে সহজে টেস্ট করা যায়।
2. **Integration test:** critical money flow (order → batch → invoice → payment) end-to-end।
3. **Reconciliation-এর জন্য নিজস্ব test:** diff function সঠিকভাবে drift ধরছে কিনা সেটা যাচাই করুন — এটা নিজেই বাগ থাকলে পুরো নিরাপত্তা জাল ভেঙে পড়বে।
4. **Minimal e2e (Playwright):** শুধু ২-৩টা সবচেয়ে critical user journey কভার করুন — পুরো অ্যাপ e2e দিয়ে কভার করার চেষ্টা ছোট টিমের জন্য ROI-negative।
5. **CI gate:** type-check + lint + test pass না হলে merge/deploy ব্লক করুন, বিশেষত financial module-এ change থাকলে।

---

## অংশ ৮: Observability ও Audit

- Structured logging রাখুন (Convex function logs + Sentry-এর মতো error tracker; ছোট টিমের জন্য Sentry-এর free tier যথেষ্ট)।
- অংশ ৪-এ দেখানো `auditLogs` টেবিল সব financial mutation-এ populate করুন — কে, কী, কখন বদলেছে, আগের/পরের মান।
- Alert সেট করুন: reconciliation job fail করলে, error rate বেড়ে গেলে, বা কোনো payment webhook fail করলে (SMS/email/Slack, যা সহজ)।

---

## অংশ ৯: কোড কোয়ালিটি, CI/CD, DevOps

- ESLint + Prettier + Husky pre-commit hook (lint-staged দিয়ে) — এখনো না থাকলে যোগ করুন।
- TypeScript strict mode প্রজেক্ট-জুড়ে enable করুন; বাকি `.js`/`.jsx` ফাইলগুলো migrate করার একটা checklist রাখুন, financial module-কে সবচেয়ে বেশি অগ্রাধিকার দিন।
- প্রতিটা migration decision-এর জন্য ছোট একটা ADR (Architecture Decision Record) — "কেন এই domain-এ Convex আগে গেলাম, cutover criteria কী ছিল" — লিখে রাখুন। ৬ মাস পর নিজের কাছেই এটা অমূল্য হবে।
- dev/staging/prod environment স্পষ্টভাবে আলাদা রাখুন — Convex-এর নিজস্ব deployment environment feature ব্যবহার করুন।
- Secret management: `.env` কখনো commit না করা, hosting provider-এর secret store ব্যবহার করা।
- MongoDB backup + Convex-এর built-in backup — দুটোরই retention policy যাচাই করুন এবং মাঝে মাঝে actual restore টেস্ট করুন (backup আছে মানেই restore কাজ করবে, তা নিশ্চিত না)।

---

## অংশ ১০: ভবিষ্যৎ প্রবৃদ্ধির জন্য প্রস্তুতি

- যদি ব্যবসা একাধিক শাখা/ফ্যাক্টরির দিকে যাওয়ার সম্ভাবনা থাকে, schema-তে `branchId`/`tenantId`-এর মতো একটা dimension এখনই first-class করে রাখুন — পরে retrofit করা অনেক ব্যয়বহুল।
- ফ্যাক্টরি ফ্লোরে যদি সরাসরি অ্যাপ ব্যবহৃত হয় এবং internet connectivity অস্থির হতে পারে, তাহলে সেই নির্দিষ্ট workflow-এর জন্য offline-tolerant queue (retry-with-backoff, অথবা simple PWA caching) বিবেচনা করুন — এটা এখনই দরকার কিনা সেটা নির্ভর করছে factory floor-এ আদৌ এই সিস্টেম সরাসরি ব্যবহার হয় কিনা তার উপর।

---

## অংশ ১১: এখনই যা করার দরকার নেই (Over-engineering এড়িয়ে চলুন)

আপনার team-এর আকার ও ব্যবসার scale বিবেচনায়:
- **Microservices বা Kubernetes নয়** — Next.js + Convex monolith আপনার scale-এর জন্য সঠিক এবং যথেষ্ট।
- **GraphQL layer যোগ করার দরকার নেই** — Convex নিজেই end-to-end typed API দেয়, GraphQL শুধু জটিলতা বাড়াবে।
- **পুরো Mongo→Convex migration তাড়াহুড়ো করে শেষ করার দরকার নেই** — reconciliation-সহ dual-write একটা reasonable transitional state, যতক্ষণ প্রতিটা domain-এর exit criteria স্পষ্ট থাকে।
- **Auth library বদলানোর তাড়া নেই** — Auth.js v5 হার্ডেন করাই যথেষ্ট এই মুহূর্তে।

---

## অংশ ১২: রোডম্যাপ

| সময়সীমা | কাজ |
|---|---|
| **সপ্তাহ ১-২** | Next.js patch আপডেট, middleware/proxy audit, প্রতিটা sensitive route-এ server-side auth recheck |
| **সপ্তাহ ৩-৪** | RBAC schema formalize, audit log টেবিল চালু, Invoice/Ledger domain-এ reconciliation job |
| **মাস ২** | বাকি financial domain-এ reconciliation সম্প্রসারণ, শেয়ার্ড zod schema (client+server), CI gate কড়া করা |
| **মাস ৩** | প্রথম ১-২টা domain-কে Phase C (Convex primary)-তে নেওয়া, unit/integration test coverage বাড়ানো |
| **মাস ৪-৬+** | ধাপে ধাপে বাকি domain migrate, TypeScript strict mode-এ পুরো codebase, legacy `.js`/`.jsx` clean-up সম্পূর্ণ |

---

## Appendix: রেফারেন্স (জুলাই ২০২৬ অনুযায়ী)

- Next.js stable: **16.2.10** (১ জুলাই ২০২৬), 16.3 এখনও preview-এ।
- React: **19.2** (Next.js 16.2.6+ এর সাথে bundled)।
- Tailwind CSS: **v4.3** stable।
- Auth.js (NextAuth) v5: production-এ ব্যাপক ব্যবহৃত কিন্তু আনুষ্ঠানিকভাবে beta ট্যাগে।
- Next.js মে ২০২৬ সমন্বিত security release: middleware/proxy bypass, RSC-related DoS, ও cache-poisoning সংক্রান্ত ১৩টি advisory patch করা হয়েছে।

ভার্সন সংখ্যা দ্রুত বদলায় — deploy করার আগে `npm show next version` এবং [nextjs.org](https://nextjs.org/blog) ও [Convex changelog](https://docs.convex.dev) দিয়ে নিজে যাচাই করে নেবেন।
