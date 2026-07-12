# NM-Dyeing — Agent Rules (Production-Safe Modernization)

This app is **in production**. Prefer **small, local, reversible** improvements over big-bang rewrites.  
**Database schema, migrations, and data ownership are out of scope for agents** — the owner manages the database. Do not redesign DB models, indexes, or migrations unless explicitly asked.

---

## 1. Target architecture (what we are moving toward)

| Layer | Technology (canonical) | Notes |
|--------|------------------------|--------|
| Framework | **Next.js App Router** (current major) | Keep App Router; no Pages Router. |
| Language | **TypeScript** (`.ts` / `.tsx`) | New code only in TS. Migrate JS/JSX only when touched. |
| UI | **React 19** + **Tailwind CSS 4** + **shadcn/ui** | `components.json` is source of truth (`tsx: true`). |
| UI primitives | **shadcn (Base UI / current registry style)** under `src/components/ui/*` | Prefer TSX primitives; do not reintroduce Radix-only duplicates when the TSX Base UI version exists. |
| Icons | **lucide-react** | Prefer lucide for new UI; migrate react-icons only when editing that file. |
| Auth | **NextAuth v5 (Auth.js)** | Edge-safe config in `auth.config.*`; Node secrets in `auth.*`. |
| Route protection | **Root `proxy.js`** (Next.js 16 proxy convention) | Do not invent a parallel middleware without reason. |
| HTTP API | **Next.js Route Handlers** under `src/app/api/**/route.ts` | Business HTTP stays on Route Handlers. |
| Client data | **`fetch`** via shared hooks / thin API helpers | Do not reintroduce axios. |
| Domain data (primary) | **MongoDB via existing app models + API routes** | Agent does **not** redesign DB. |
| Secondary backend | **Convex** (currently transport employees only) | Do not expand Convex to new domains unless explicitly requested. Keep transport on Convex until a deliberate cutover is planned. |
| Dates | **dayjs** (app logic) + **react-day-picker** / shadcn calendar (UI) | Prefer dayjs for formatting/parsing; avoid adding new date libraries. |
| Toasts | **sonner** | Keep consistent. |
| Path alias | `@/*` → `./src/*` | Always use `@/` imports. |

### Intended folder layout (canonical)

```text
src/
  app/                 # routes only (pages + route handlers)
  components/
    ui/                # design-system primitives only
    <domain>/          # feature UI (order, batch, ledger, …)
  hooks/               # shared React hooks (rename from hook/ over time)
  lib/                 # pure utils, clients, shared helpers (no React UI)
  types/               # shared TS types / DTOs (create as needed)
  providers/           # app-wide client providers (rename from Providers/ over time)
  models/              # existing Mongoose models — owner-owned; minimal agent edits
```

---

## 2. Hard production constraints

1. **No big-bang migrations.** Never convert the whole repo, whole domain tree, or all API routes in one change.
2. **Boy Scout rule:** when you edit a file for a real task, leave *that file* closer to the target architecture (see §3).
3. **Behavior first.** Refactors that ship with a feature must preserve user-visible behavior unless the task says otherwise.
4. **Do not flip global safety switches “for convenience.”** Especially avoid enabling broader TS failure modes without a plan. Today `typescript.ignoreBuildErrors` is `true` — do not expand that; prefer reducing errors in files you touch.
5. **Do not expand dual backends.** New features default to **existing Next API + primary data path**. Convex stays limited to its current domain unless the user asks.
6. **Do not commit secrets.** Never put `.env` / credentials in code or commits.
7. **Scope discipline.** No drive-by refactors of unrelated folders.

---

## 3. Gradual modernization checklist (apply only to files you already touch)

### 3.1 Language & extensions

| Situation | Action |
|-----------|--------|
| **New file** | Always `.ts` or `.tsx`. Never add new `.js`/`.jsx` under `src/`. |
| **Editing existing `.jsx`** | Prefer rename to `.tsx` *in the same PR/change* if the file is small/medium and types are easy; otherwise add JSDoc/`// @ts-check` only if helpful, and leave a clean path for next touch. |
| **Editing existing `.js` (API/lib/hook)** | Prefer `.ts` when the change is non-trivial and imports stay resolvable. Update all import paths that referenced the old extension only if required by resolution. |
| **Root/scripts one-offs** | Do not promote `check_db.js`, `replace_colors.js`, etc. into app architecture. Move/ignore later; don’t import them from `src/`. |

**TypeScript policy (phased):**

- Phase A (now): `allowJs: true`, `strict: false` is acceptable.
- When editing a TS/TSX file: add **local** types for props, return values, and public helpers.
- Do **not** turn on `strict: true` globally until the owner requests it.
- Create `src/types/` for shared domain types **when a second consumer needs them** — not preemptively for the whole app.

### 3.2 Config duals (resolve when you touch related files)

| Dual | Canonical | Action when touched |
|------|-----------|---------------------|
| `jsconfig.json` + `tsconfig.json` | **`tsconfig.json` only** | Do not add new path aliases only in jsconfig. Prefer extending/keeping tsconfig as single source. |
| `src/lib/utils.js` + `utils.ts` | **`utils.ts`** | Delete the JS twin only after confirming no extension-specific imports break; keep single `cn` export. |
| `src/components/ui/button.jsx` + `button.tsx` | **`button.tsx` (shadcn current)** | Point imports at `@/components/ui/button`; remove the unused twin when no longer imported. |
| `src/hook/*` vs `components.json` `hooks` alias | **`src/hooks/`** | New hooks go in `src/hooks/`. When editing a hook in `src/hook/`, move that one file to `src/hooks/` and fix imports. |
| `src/Providers/` | **`src/providers/`** (lowercase) | Rename only the file/folder you touch; update imports in the same change. |
| `Sidebar.jsx` vs `app-sidebar.tsx` | **`app-sidebar.tsx` + nav-\*.tsx** | `SessionWrapper` already uses AppSidebar. Do not revive `Sidebar.jsx`. Delete only when confirmed unused. |

### 3.3 UI & component structure

- **Pages stay thin.** `page.tsx` should compose hooks + feature components. Avoid growing 400–700+ line pages further; extract when you edit them.
- **Feature folders:** put domain UI under `src/components/<domain>/` with **consistent lowercase domain names** for *new* folders (`order`, `batch`, `ledger`, `print`, …). Existing PascalCase folders (`OrderStatus`, `Batch`) may remain until a dedicated rename pass.
- **No triple-copy ledgers.** Customer / dyeing / calender ledger UIs are near-duplicates. When you touch one:
  - Prefer extracting **shared** pieces under `src/components/ledger/` (or similar) *for the parts you change*, parameterized by entity type.
  - Do not rewrite all three ledgers in one go.
- **Duplicate basenames** (`DeliveredBatchList`, `CloseModal`, …): when editing, prefer one shared module + thin wrappers rather than copy-paste fixes in both places.
- **`"use client"`:** only on components that need browser APIs, hooks, or event handlers. Do not mark whole trees client-side “just in case.”
- **Server Components** remain the default for new pages/layouts where data can be server-fetched without breaking auth/session patterns already used.

### 3.4 API / server structure

- New or heavily edited route handlers: **`route.ts`**, typed request/response helpers, consistent `NextResponse` JSON errors.
- Keep handlers focused: parse → authorize (if needed beyond proxy) → call small helpers → respond. Extract pure helpers to `src/lib/` when a route grows during your edit.
- Prefer **shared validation patterns** (simple zod later is fine if already a dependency; do not add heavy new stacks without ask).
- Do not create a second parallel API style (e.g. tRPC) unless the owner requests it.

### 3.5 Data access boundaries (no DB redesign)

- Continue using existing models/routes as the owner defined them.
- Agents may **read** models to wire features correctly but must not “fix” schema, rename collections, or run destructive migrations unprompted.
- Convex: only for existing transport-employee usage; no new Convex tables/features unless asked.

### 3.6 Dependencies & stack hygiene (when you touch package surface)

Prefer consolidating toward one library per concern **only when already editing that code path**:

| Concern | Prefer | Avoid adding / re-expanding |
|---------|--------|-----------------------------|
| Password hashing | existing `bcrypt` usage | second hash library for new code |
| HTTP client | `fetch` | axios |
| Dates | `dayjs` | extra date libs for new code |
| Date picker UI | shadcn calendar / react-day-picker | new picker libraries |
| Icons | lucide-react | new icon packs |
| Select | existing UI select / established SearchableSelect | more select libraries |
| Package typos | remove dead packages when noticed (`mongose` security stub is not a real ODM) | leave drive-by dependency churn |

Do **not** run mass dependency upgrades across the monorepo without an explicit request.

### 3.7 Naming conventions (new code)

- Files: `kebab-case` for multi-word non-component modules if new; React components may stay `PascalCase.tsx` to match shadcn.
- Components: `PascalCase`.
- Hooks: `useSomething.ts`.
- Route segments: prefer **kebab-case** for *new* paths (`process-list` not `pocess-list`). Do not rename existing production URLs without an explicit redirect plan.
- Fix typos in **new** code only; URL renames need owner approval.

### 3.8 Quality gates (proportional)

- For non-trivial edits: run lint/build on the changed area when practical (`npm run lint`, `npm run build` if time allows).
- No requirement to introduce a full test suite in incidental PRs; if you add pure helpers, a small unit test is welcome when a test runner already exists.
- Do not disable lint/TS for whole directories to land a change.

---

## 4. Priority order when modernizing “while doing other work”

Apply the **first applicable** step that fits the file you are already changing:

1. **Remove immediate duals** in that file’s dependency (wrong button/utils import, dead import of old Sidebar).
2. **Convert that file** to `.ts`/`.tsx` if low-risk.
3. **Add types** for exported functions/props.
4. **Extract** one oversized chunk (modal, table, form section) if the file is already hard to edit.
5. **Deduplicate** only the sibling you must also touch for the feature to work.
6. **Stop.** Do not cascade into the rest of the domain.

---

## 5. Explicitly out of scope (unless the user asks)

- Full TypeScript strict-mode cutover
- Rewriting all API routes to TS in one pass
- Migrating all entities from Mongo/API to Convex (or the reverse)
- Database migrations, index strategy, data backfills
- Redesigning auth product requirements
- Mass renaming of production URLs
- Adding a new state library (Redux, Zustand, etc.) without need
- Introducing a second CSS system (CSS modules, styled-components) alongside Tailwind

---

## 6. Definition of “done” for a normal feature task

- Feature works with **no intentional regression** on the paths touched.
- **No new** `.js`/`.jsx` under `src/`.
- No new dual files (`foo.js` + `foo.ts`).
- Imports use `@/…`.
- Stack choices match §1 for all *new* code.
- Any modernization was limited to **files required by the task** (plus their direct twins if deleting a dual).

---

## 7. Suggested long-term backlog (owner-driven; agents only when tasked)

These are **planned waves**, not automatic work:

| Wave | Focus | Risk |
|------|--------|------|
| W0 | Delete confirmed dead duals (`button.jsx` vs `tsx`, `utils.js` vs `ts`, unused `Sidebar.jsx`) after import audit | Low |
| W1 | Single config (`tsconfig` only); hooks folder rename file-by-file | Low |
| W2 | Convert `src/lib/*` and hooks to TS | Low–med |
| W3 | Convert API routes domain-by-domain to `route.ts` | Med |
| W4 | Convert dashboard pages feature-by-feature to TSX; thin pages | Med |
| W5 | Shared ledger component extraction | Med |
| W6 | Dependency cleanup (date/icon/select/hash duplicates; remove dead packages) | Low–med |
| W7 | Enable stricter TS gradually; turn off `ignoreBuildErrors` only when green | High (do last) |

Agents may execute **one small slice of one wave** when it coincides with a user task or when the user names the wave.

---

## 8. Communication

When a task conflicts with these rules (e.g. user asks for a full rewrite), **explain the production risk** and propose a phased plan instead of a single destructive PR.
**Do not mention database redesign** as part of “architecture cleanup” unless the user explicitly opens that topic.
