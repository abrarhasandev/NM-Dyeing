# NM-Dyeing — Agent Rules (Production-Safe Modernization)

This app is **in production**. Prefer **small, local, reversible** improvements over big-bang rewrites.

## Non-negotiable data rules

1. **Do not change the live MongoDB schema, indexes, collections, or production data** unless the owner explicitly requests it **and** you are 100% certain of impact, rollback, and compatibility.
2. **Long-term destination data platform is Convex** (full migration planned). Work *toward* that architecture without forcing premature cutovers.
3. **Hybrid is intentional today:** most domains stay on MongoDB + Next Route Handlers; **transport employees** already live on Convex. Keep both stable until a domain is deliberately migrated.
4. Agents may **read** models/API code to wire features; they must not “improve” the database as a side quest.

---

## 1. Target architecture

### 1.1 End state (future)

| Layer | Canonical technology |
|--------|----------------------|
| Framework | **Next.js App Router** |
| Language | **TypeScript** (`.ts` / `.tsx`) |
| UI | **React 19** + **Tailwind CSS 4** + **shadcn/ui** (`components.json`, `tsx: true`) |
| UI primitives | `src/components/ui/*` (current shadcn/Base UI style) — **no dual JSX twins** |
| Icons | **lucide-react** |
| Auth | **NextAuth v5 (Auth.js)** + root **`proxy.js`** |
| Domain data (destination) | **Convex** (queries/mutations/actions + schema in `convex/`) |
| Client data access | Convex React hooks **or** thin adapters — UI must not talk to raw DB |
| Dates | **dayjs** (logic) + shadcn calendar / react-day-picker (UI) |
| Toasts | **sonner** |
| Path alias | `@/*` → `./src/*` |
| Config | **`tsconfig.json` only** (no `jsconfig.json`) |

### 1.2 Current state (production hybrid — respect it)

| Concern | Today | Rule |
|---------|--------|------|
| Most business domains | Mongo models + `src/app/api/**` + `fetch` hooks | Keep working; no silent rewrite |
| Transport employees | `convex/transportEmployees.ts` | Stay on Convex |
| Auth users / sessions | NextAuth + existing User model path | Do not move without explicit plan |
| New **greenfield** domain (no Mongo surface yet) | Prefer **Convex first** if owner agrees for that feature | Still no Mongo schema invention |
| Migrating an existing Mongo domain | **Only when tasked**, domain-by-domain, with dual-read/write or freeze plan | Never big-bang |

### 1.3 Intended folder layout

```text
src/
  app/                 # routes only (thin pages + route handlers while hybrid lasts)
  components/
    ui/                # design-system primitives only (single extension per module)
    <domain>/          # feature UI
  hooks/               # shared React hooks (migrate from hook/ over time)
  lib/                 # pure utils + adapters (no React UI)
  types/               # shared DTOs (grow when a second consumer needs them)
  providers/           # app-wide providers (migrate from Providers/ over time)
  models/              # Mongoose models — hybrid era only; no agent schema redesign
convex/                # Convex schema + functions (destination backend)
```

### 1.4 Convex migration principles (structural — not a dump of data)

When implementing or refactoring **for a task**, prefer boundaries that make a later Convex cutover safe:

1. **UI → adapter → backend.** Pages/components should call hooks or small modules (`src/hooks/*`, `src/lib/*`), not scatter raw `fetch('/api/...')` forever without structure.
2. **Keep domain language stable** (Order, Batch, Customer, Dyeing, Calender, Ledger, Payment…). Convex tables later should map cleanly to these names.
3. **Do not expand Mongo coupling** in new code: avoid new cross-collection logic inlined in giant pages; put it in one server module so it can be reimplemented as a Convex function later.
4. **Do not expand Convex to a second Mongo-backed domain** without an explicit migration task (avoids half-migrated dual sources of truth).
5. **Transport remains the Convex reference implementation** for patterns (schema.ts, queries/mutations, client hooks).
6. **No dual-write / data backfill scripts** unless the owner requests that migration wave and approves data impact.

---

## 2. Hard production constraints

1. **No big-bang migrations** (TS, Convex, or URL renames across the app).
2. **Boy Scout rule:** when you edit a file for a real task, leave *that file* closer to the target.
3. **Behavior first.** Preserve user-visible behavior unless the task says otherwise.
4. Do not expand `typescript.ignoreBuildErrors`; prefer fixing types in files you touch.
5. **No Mongo schema/index/data changes** without 100% certainty + explicit owner approval.
6. **No secrets** in code or commits.
7. **Scope discipline.** No drive-by refactors of unrelated folders.
8. **Design tokens:** product UI should stay consistent with existing app theme / `cursor-design-md.md` cues (neutral surfaces, accent `#f54e00` where already used for primary CTAs). Do not introduce a second visual system.

---

## 3. Gradual modernization checklist (only files you already touch)

### 3.1 Language & extensions

| Situation | Action |
|-----------|--------|
| **New file under `src/` or `convex/`** | Always `.ts` / `.tsx`. Never add new `.js`/`.jsx` under `src/`. |
| **Editing existing `.jsx`/`.js`** | Prefer convert to TS when low-risk; otherwise leave working JS and improve structure slightly. |
| **Dual basename** (`foo.js` + `foo.ts`) | **Forbidden.** Canonical is the TS twin; delete the other only after import audit. |
| **Root one-offs** | Do not import into app runtime. |

**TypeScript policy:** `allowJs: true`, `strict: false` for now. Add local types on touched TS files. Do not enable global `strict` unprompted.

### 3.2 Resolved duals (do not reintroduce)

| Item | Canonical | Status |
|------|-----------|--------|
| Utils | `src/lib/utils.ts` | JS twin removed |
| Button | `src/components/ui/button.tsx` | JSX twin removed; must forward refs for Radix `asChild` parents |
| Sidebar shell | `app-sidebar.tsx` + `nav-main` + `nav-user` | Legacy `Sidebar.jsx` / unused `nav-projects` removed |
| Project config | `tsconfig.json` only | `jsconfig.json` removed; includes JS/JSX for hybrid era |

### 3.3 UI structure

- Keep pages thin; extract when editing oversized files.
- New feature folders: lowercase domain names.
- Ledger triples (customer/dyeing/calender): extract shared pieces only for the part you change.
- `"use client"` only when required.

### 3.4 API / server (hybrid era)

- New/heavily edited route handlers → prefer `route.ts`.
- Handlers: parse → authz → helper → `NextResponse`.
- Do not invent tRPC/GraphQL unless asked.
- When a domain is **migrating to Convex**, prefer implementing Convex functions and thinning the Route Handler rather than growing Mongo logic.

### 3.5 Dependencies

| Concern | Prefer | Avoid |
|---------|--------|--------|
| Password hashing | `bcrypt` (current) | adding `bcryptjs` again |
| HTTP | `fetch` | axios |
| Dates | `dayjs` | new date libraries |
| Icons | lucide-react | new icon packs |
| ODM typo packages | real `mongoose` only while hybrid lasts | `mongose` security stub |

### 3.6 Naming

- Components: `PascalCase.tsx`
- Hooks: `useSomething.ts`
- New routes: kebab-case; **do not rename production URLs** without redirects + owner approval

### 3.7 Quality gates

- Run lint/build for non-trivial changes when practical.
- Do not disable lint/TS for whole trees to land a change.

---

## 4. Priority when modernizing mid-task

1. Remove/avoid dual modules for the file you touch.
2. Convert that file to TS if low-risk.
3. Add types for exports/props.
4. Extract one oversized chunk if it blocks safe editing.
5. If the task is a **named Convex domain migration**, implement Convex side + adapter; keep Mongo path until cutover is proven.
6. **Stop.** Do not cascade.

---

## 5. Explicitly out of scope (unless the user asks)

- Full strict-mode TypeScript cutover
- Converting all API routes or all pages in one pass
- Mongo → Convex migration of a domain without an explicit task
- Any Mongo schema/index/data migration without 100% certainty + approval
- Mass production URL renames
- New global state libraries or second CSS systems

---

## 6. Definition of done (normal feature)

- No intentional regression on touched paths
- No new `.js`/`.jsx` under `src/`
- No new dual files
- `@/` imports
- Stack choices match §1 for new code
- **Zero unsolicited database changes**
- Modernization limited to files required by the task

---

## 7. Wave backlog (owner-driven)

| Wave | Focus | Risk |
|------|--------|------|
| W0 | Dead duals / dead packages / single tsconfig | Low — **done baseline** |
| W1 | `hook/` → `hooks/`, `Providers/` → `providers/` file-by-file | Low |
| W2 | `lib/` + hooks → TS | Low–med |
| W3 | API routes → `route.ts` domain-by-domain | Med |
| W4 | Pages → thin TSX + feature components | Med |
| W5 | Shared ledger extraction | Med |
| W6 | Dependency consolidation (dates/icons) | Low–med |
| W7 | Stricter TS; turn off `ignoreBuildErrors` when green | High |
| **C1** | Document domain inventory for Convex (no data move) | Low |
| **C2** | Migrate one non-critical domain to Convex with owner plan | High |
| **C3** | Expand domain-by-domain; retire Mongo models only after cutover | High |
| **C4** | Auth/session strategy on Convex era (explicit design) | High |

Agents execute **one small slice** of one wave when tasked or when it coincides with a feature.

---

## 8. Communication

If asked for a full rewrite or full Convex cutover in one shot, **refuse the big bang**, explain production risk, and propose phased waves (C1→C2…).  
Never treat “architecture cleanup” as permission to alter the database.
