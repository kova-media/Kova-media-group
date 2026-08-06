# Architecture

**Status:** Authoritative. Change this document before changing the system.
**Last reviewed:** 2026-08-06

---

## 1. What this application is

A single Next.js 16 application that serves two audiences from one codebase and one database:

| Surface               | Audience                     | Path                          | Rendering                                    |
| --------------------- | ---------------------------- | ----------------------------- | -------------------------------------------- |
| Public marketing site | Prospects (DTC brand owners) | `/`, `/work/*`, `/contact`, … | Prerendered static shell, cached, CDN-served |
| Admin CMS             | One administrator            | `/admin/*`                    | Fully dynamic, authenticated, never cached   |

There is no headless CMS, no Shopify, no WordPress, no page builder. Content lives in our own Postgres database and is edited through our own admin.

**The single most important architectural constraint:** the public site must be servable from a CDN with zero database round-trips on the hot path. Everything below follows from that.

### 1.1 What "long-term" means here

Realistic steady state: under 20 pages, ~30 case studies, one administrator, traffic in the low tens of thousands of visits per month. **Nothing in this system is anywhere near a scale limit, and nothing should be designed as though it were.**

This is worth stating up front because it defines what "good architecture" means for this project. The risks worth engineering against are _cost of change_ and _cost of being wrong_ — not throughput, not concurrency, not query volume. A design that trades simplicity for a performance win on a path that runs a few times per deploy is a bad trade here, however sophisticated it looks.

Any future proposal justified by "this won't scale" needs a number attached to it. This document has already lost one decision to that test (ADR-003 → ADR-012).

---

## 2. Stack (locked)

| Layer               | Choice                                                                       | Version at time of writing |
| ------------------- | ---------------------------------------------------------------------------- | -------------------------- |
| Framework           | Next.js (App Router)                                                         | 16.3.0                     |
| React               | React                                                                        | 19.2                       |
| Language            | TypeScript (strict)                                                          | 5.x                        |
| Bundler             | Turbopack (default in 16)                                                    | —                          |
| Styling             | Tailwind CSS (CSS-first config)                                              | 4.x                        |
| Admin UI kit        | shadcn/ui                                                                    | latest                     |
| Motion              | Framer Motion (`motion`) only in V1 — GSAP requires a measured ADR (ADR-015) | —                          |
| Database            | Postgres (Supabase)                                                          | —                          |
| ORM                 | Prisma                                                                       | 6.x                        |
| Auth                | Supabase Auth (identity only)                                                | —                          |
| Object storage      | Supabase Storage                                                             | —                          |
| Transactional email | Resend                                                                       | —                          |
| Hosting             | Vercel                                                                       | —                          |
| Runtime             | Node.js ≥ 20.9 (dev on 22.x)                                                 | —                          |

> Non-Next.js library APIs (Prisma, Supabase, Resend) must be verified against the installed package's own docs at implementation time. Only the Next.js facts in this document were verified against `node_modules/next/dist/docs/`.

---

## 3. Layered architecture

Dependencies point **downward only**. A layer may never import from a layer above it.

```
┌──────────────────────────────────────────────────────────────┐
│  ROUTES            src/app/**                                │
│  Thin. Composition, Suspense boundaries, metadata. No logic. │
├──────────────────────────────────────────────────────────────┤
│  FEATURES          src/features/**                           │
│  Section components, admin screens, forms, server actions.   │
├──────────────────────────────────────────────────────────────┤
│  DOMAIN            src/server/**                             │
│  Data access layer, auth, publishing, media, mail, content   │
│  schemas. `import 'server-only'` at the top of every file.   │
├──────────────────────────────────────────────────────────────┤
│  PLATFORM          src/lib/**, src/db/**, src/env.ts         │
│  Prisma client, Supabase clients, Resend client, utilities,  │
│  validated environment.                                      │
└──────────────────────────────────────────────────────────────┘
```

Hard rules, enforced in review (and by ESLint boundaries where practical):

1. **Route files never talk to Prisma.** They call the data access layer (DAL).
2. **Client Components never talk to the DAL.** They receive plain serializable props or call Server Actions.
3. **Only `src/server/**` and `src/db/**` may import `@/db/prisma`.**
4. **Nothing outside `src/server/auth/**` reads the session cookie.**
5. **Public routes never import from `src/features/admin/**`,** and vice versa.

---

## 4. Rendering model

We enable **Cache Components** and **Partial Prefetching** in `next.config.ts`:

```ts
const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
}
```

The pairing is what the ISR guide prescribes: Cache Components produces the App Shell, Partial Prefetching upgrades it to a full route once params are known.

This makes Partial Prerendering the default behaviour. Every route produces a static shell; anything that cannot be prerendered must be explicitly handled. Next.js's dev overlay refuses to let a route silently become fully dynamic — this is a feature, and it is why we adopt it on day one rather than retrofitting.

Three kinds of work exist in a route, and each has exactly one correct treatment:

| Kind of work                                                                                        | Treatment                                                   | Ends up in              |
| --------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- | ----------------------- |
| Content from our database                                                                           | `'use cache'` + `cacheTag(...)` + `cacheLife('max')`        | Static shell            |
| Per-request data (`cookies()`, `headers()`, `searchParams`, `params` not in `generateStaticParams`) | `<Suspense>` boundary, read as deep in the tree as possible | Streams at request time |
| Truly static markup                                                                                 | nothing                                                     | Static shell            |

### 4.1 Public routes

Public page content is read through cached functions, so the entire marketing site prerenders. Concretely:

```
app/(marketing)/page.tsx
  └─ getPublishedPage('home')      ← 'use cache', cacheTag('page:home'), cacheLife('max')
       └─ prisma.page.findUnique({ where: { slug } })  → parse publishedContent
```

`cacheLife('max')` means we do **not** revalidate on a timer. Content changes only when the admin publishes, and publishing invalidates the tag. This is the pattern the Next.js docs recommend explicitly for CMS content: long life + tag invalidation, no unnecessary time-based churn.

### 4.1.1 Which URLs get prerendered

`generateStaticParams` supplies the published slugs for the CMS catch-all and for `/work/[slug]`, so every URL that existed at build time is fully prerendered. Pages published _after_ a build are served the App Shell on first visit and upgraded in the background — correct ISR behaviour, and the reason publishing never requires a deploy.

Two consequences to hold onto:

- **The build reads the database.** `DATABASE_URL` must be available in the Vercel build environment, and a database outage becomes a build failure. This is a genuine new dependency, accepted deliberately (ADR-017).
- Params must be awaited **inside** a Suspense boundary even when statically known. Awaiting above the boundary ties that layout's App Shell to a single URL.

### 4.1.2 Route ownership

The catch-all does not own everything. Routes with bespoke behaviour are real files; the catch-all handles the rest.

| URL            | Owner                              | Why                                                        |
| -------------- | ---------------------------------- | ---------------------------------------------------------- |
| `/`            | `(marketing)/page.tsx`             | The homepage is the product; it gets its own route         |
| `/contact`     | `(marketing)/contact/page.tsx`     | Contains a Server Action form                              |
| `/work`        | `(marketing)/work/page.tsx`        | Listing with its own query and ordering                    |
| `/work/[slug]` | `(marketing)/work/[slug]/page.tsx` | Case study template                                        |
| anything else  | `(marketing)/[...slug]/page.tsx`   | Editor-created pages: about, privacy, terms, landing pages |

Static segments take precedence over the catch-all, so this resolves without special handling. The catch-all calls `notFound()` for unknown slugs. All five render through the same `SectionRenderer` — the difference is which data they load and what surrounds it, never how sections are drawn.

### 4.2 Maximising the static shell

Await as late and as deep as possible. A layout that does `const { slug } = await params` at the top cannot prerender; pass the promise down and await it inside a `<Suspense>` boundary instead. Same principle for `cookies()`, `headers()`, and any uncached fetch. See `docs/CODING_STANDARDS.md` §6.

### 4.3 Admin routes

`/admin/*` is the inverse: authenticated, per-user, always fresh. Admin route segments must **never** use `'use cache'`. Every admin data read goes through the DAL, which calls `verifySession()` first, which reads `cookies()` — and reading cookies inside a cache scope is an error by design. The framework enforces the boundary for us.

### 4.4 Bots and crawlers

Next.js detects crawler user agents and renders the full page dynamically instead of serving the shell. Consequence: **every input the shell depends on must also be reachable at request time.** No build-time-only data sources. Our content comes from Postgres, which is available in both phases, so this holds — but it is a rule to keep in mind if we ever add a build-time file read.

---

## 5. Caching and invalidation

### 5.1 Tag taxonomy

Tags are the contract between the CMS and the cache. They live in one place: `src/server/cache/tags.ts`. Never inline a tag string.

| Tag                                   | Applied to                                                              | Invalidated when                                        |
| ------------------------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------- |
| `page:<slug>`                         | A published page's content document                                     | That page is published or unpublished                   |
| `pages:index`                         | The list of published page slugs (sitemap, nav, `generateStaticParams`) | Any page is published, unpublished, or its slug changes |
| `case-study:<slug>`                   | A published case study                                                  | That case study is published                            |
| `case-studies:index`                  | Case study listing                                                      | Any case study is published or reordered                |
| `testimonial:<id>`                    | One resolved testimonial                                                | That testimonial is saved                               |
| `media:<id>`                          | One resolved media asset                                                | That asset's metadata or alt text changes               |
| `logos:index`, `email-examples:index` | Library collections                                                     | Any member is saved or reordered                        |
| `settings:global`                     | Site settings, nav, footer, global SEO                                  | Settings saved                                          |

Because sections reference library entities by id and resolve them through their own tagged, cached functions, editing a testimonial invalidates _that testimonial_ — not every page displaying it. This granularity is what makes "library content is live" (see `CMS.md` §2) cheap rather than a cache-thrashing liability.

### 5.2 Invalidation API

Next.js 16 changed these APIs. Use them exactly as follows:

| API                           | Where it is legal                 | Semantics                                          | Our use                                                                                     |
| ----------------------------- | --------------------------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `updateTag(tag)`              | Server Actions only               | Expires immediately, refreshes in the same request | **Default for publish actions** — the admin must see their own write instantly              |
| `revalidateTag(tag, profile)` | Server Actions and Route Handlers | Stale-while-revalidate                             | Webhooks / background invalidation. **The second argument is required in 16** — use `'max'` |
| `revalidatePath(path)`        | Actions and handlers              | Invalidates a whole route                          | Avoid. Too blunt. Only as a documented escape hatch                                         |
| `refresh()`                   | Server Actions                    | Refreshes the client router                        | Admin list screens after non-content mutations                                              |

### 5.3 What is _not_ cached

- Anything under `/admin`
- Contact form submission handling
- The draft preview path (Draft Mode bypasses `use cache` entirely, by design)

### 5.4 Serialization constraint

Values returned from a `'use cache'` function must be serializable. **Class instances are not.** Prisma returns `Decimal` for decimal columns and its own types in some positions.

> Cached DAL functions must return plain objects. Mapping from Prisma row → domain type happens inside the cached function, in `src/server/*/mappers.ts`.

Violating this is a runtime error, not a type error — and on a dynamically rendered route it can pass `next build` and only surface under `next start`. The schema avoids `Decimal` columns for exactly this reason (`DATABASE.md` §3), but the mapper layer stays as the enforcement point.

### 5.5 What happens when the database is down

Worth stating because the answer is unusually good and shapes how much resilience machinery we need: the public site is prerendered and CDN-served, so a Supabase outage is invisible to visitors on already-built pages. What breaks is publishing, the admin, the contact form, and cache misses on pages published since the last build.

The contact form is the one that matters commercially. Its failure mode is a clear error message asking the visitor to email directly, with the address shown — not a spinner. That is the whole mitigation; queueing submissions client-side would be more machinery than the risk warrants.

---

## 6. Content, draft, and publish

Full detail in `docs/CMS.md`. The architectural shape:

```
  ADMIN EDITS            PUBLISH               PUBLIC READS
  ───────────            ───────               ────────────
  Page.draftContent ──────────────────►  Page.publishedContent
  (Zod-validated JSON     copy + revision      (same shape)
   document)              updateTag('page:x')        │
        │                                            ▼
        └── Draft Mode preview ──────────────►  cached render
            (bypasses cache, reads draftContent)
```

Content is a **single Zod-validated JSON document** — an ordered array of sections — held in two columns on the same row: `draftContent` (edited) and `publishedContent` (served). Publishing copies one into the other and appends to an append-only `ContentRevision` table.

Sections reference library entities (media, testimonials, logos) **by id**. The renderer resolves them through separately cached, separately tagged functions. The resulting model: _page composition is versioned, library content is live_ — fixing a typo in a testimonial updates every page showing it without republishing.

> This supersedes an earlier design (ADR-003) that stored normalised section rows plus an immutable pre-resolved snapshot per publish. It was reviewed out before implementation: its headline benefit — a joinless read — optimised only the cache-miss path, which under §4 runs a handful of times per deploy. See ADR-012 for the full reasoning. The replacement removes four tables and the single most complex module in the design.

Publishing is transactional, so the public site never sees a half-published page. Rollback is copying a revision back into `draftContent` and republishing — no UI in V1, but the data supports it.

Preview uses Next.js **Draft Mode**. Enabling it sets the `__prerender_bypass` cookie, which causes every `'use cache'` scope to re-execute and skip writing to the cache. The preview route therefore reads `draftContent` directly and renders it through the _same_ section components as production. There is no second rendering path to keep in sync.

---

## 7. Authentication and authorization

Single administrator. Design goal: no bespoke crypto, no session table we have to maintain, and a single choke point for every authorization decision.

**Supabase Auth is the identity provider only.** It issues and refreshes the session; it does not gate data.

```
Request
  │
  ├─ proxy.ts ............ ONLY on /admin/:path* and /api/preview/:path*
  │                        Optimistic check: reads the session cookie, redirects
  │                        unauthenticated /admin/* → /admin/login. Also issues the
  │                        admin CSP nonce. NEVER queries the database.
  │
  └─ Route / Action / Handler
       └─ DAL: verifySession() ..... authoritative check, React.cache-memoised
            └─ requireAdmin() ....... confirms the user id is an active AdminUser row
                 └─ prisma query
```

The proxy is a redirect convenience, **not** a security boundary. Every read and write is authorized at the data access layer, as close to the data as possible. If someone reaches a route handler without going through the proxy, the DAL still stops them.

**The matcher is deliberately narrow** (ADR-014). The Next.js auth guide recommends running proxy on all routes, but the CDN caching guide warns that routes depending on proxy decisions may need to bypass the CDN cache — which would undo §4's entire premise. Proxy is also Node-runtime-only in Next.js 16, so it is a function invocation, not a free edge hop. Since every authenticated surface we have lives under `/admin`, scoping the matcher costs nothing and keeps public routes CDN-served.

If authenticated content ever appears outside `/admin`, this matcher must be revisited. That warning belongs in a comment at the top of `proxy.ts`.

**Prisma is the only thing that touches application tables**, connecting as a privileged Postgres role. Supabase RLS therefore does not gate our own queries. We still enable RLS with deny-all policies on every application table as defence in depth: if the anon key ever leaks or is used from the browser by mistake, it reaches nothing. See `docs/DATABASE.md` §7.

The public site never instantiates a Supabase browser client for data.

---

## 8. Mutations

All writes are **Server Actions**, not REST endpoints. One validation schema per action, shared with the client form via `useActionState`.

```
Client form ──► Server Action
                  ├─ requireAdmin()        (authorization first, always)
                  ├─ schema.parse(input)   (validation second)
                  ├─ prisma write          (in a transaction if multi-row)
                  ├─ updateTag(...)        (cache invalidation)
                  └─ return typed result   ({ ok } | { ok: false, fieldErrors })
```

Actions never throw raw errors to the client. They return a discriminated union. Unexpected errors are logged server-side and surfaced as a generic message.

Route Handlers (`route.ts`) exist only where the HTTP contract is imposed on us:

| Handler                    | Reason                                                            |
| -------------------------- | ----------------------------------------------------------------- |
| `/api/preview` (GET)       | Draft Mode entry — must be a link the admin can open in a new tab |
| `/api/preview/exit` (POST) | Exits Draft Mode                                                  |
| `/api/revalidate` (POST)   | Optional external invalidation hook, secret-guarded               |

Everything else is a Server Action.

---

## 9. Media pipeline

Vercel's serverless request body limit makes proxying uploads through our own server a dead end for large images. Uploads go **directly to Supabase Storage**, then we record metadata server-side.

```
1. Admin picks a file
2. Server Action → signed upload URL + deterministic storage path
3. Browser uploads straight to Supabase Storage
4. Server Action → server fetches the object, derives width, height,
   MIME, byte size, and a blur placeholder (sharp), writes MediaAsset row
5. updateTag('media:index')
```

`MediaAsset` stores everything `next/image` needs (`url`, `width`, `height`, `blurDataURL`, `alt`) so that renders never need a second lookup or a layout-shifting guess.

`next.config.ts` must whitelist the Supabase Storage host under `images.remotePatterns`. Note two Next.js 16 defaults that affect us: `images.minimumCacheTTL` is now 4 hours, and `16` was removed from `images.imageSizes`. Both defaults are correct for us — do not override without a recorded reason.

---

## 10. Email

Resend, called only from `src/server/mail/**`.

| Trigger                         | Recipient  | Notes                                      |
| ------------------------------- | ---------- | ------------------------------------------ |
| Contact / strategy-call enquiry | Kova inbox | Sent **after** the submission is persisted |
| Enquiry acknowledgement         | Prospect   | Optional, phase 4                          |

The database write is the source of truth. Email delivery is best-effort: a Resend failure is logged and surfaced in the admin, but never loses a lead or fails the user's form submission.

Lead capture is the entire commercial point of this site. It gets the most defensive error handling in the codebase.

---

## 11. Environments

| Environment | Branch | Database                                  | Notes                                  |
| ----------- | ------ | ----------------------------------------- | -------------------------------------- |
| Local       | any    | **Dedicated remote Supabase dev project** | `.env.local`, never committed          |
| Preview     | any PR | Dedicated preview Supabase project        | Seeded, disposable                     |
| Production  | `main` | Supabase "Kova Website"                   | Migrations applied in CI before deploy |

Local development uses a **remote** dev Supabase project rather than the local Docker stack. The reasoning is developer experience: no Docker daemon to babysit, and — more importantly — real Supabase Storage and Auth behaviour, which is where local-vs-hosted divergence actually bites. The cost is that offline development is not possible and one project is shared if the team ever grows. Both are acceptable now and easy to revisit; `supabase start` remains available for anyone who wants it.

Environment variables are validated at module load by `src/env.ts` (Zod). A missing or malformed variable fails the build, not the first request. Server-only variables are never referenced from a Client Component; the `NEXT_PUBLIC_` prefix is the only way a value reaches the browser, and each one is justified in code comments.

**The build reads the database** (§4.1.1), so `DATABASE_URL` must be set in the Vercel build environment for every environment, not just at runtime.

Tooling is pinned: npm (a `package-lock.json` already exists — no reason to churn), Node version fixed in `.nvmrc` and `engines`, matching the CI and Vercel runtime.

---

## 12. Performance budgets

These are commitments, checked before each phase is called done.

| Metric                                       | Budget   |
| -------------------------------------------- | -------- |
| LCP (homepage, mobile, 4G)                   | < 1.8 s  |
| CLS                                          | < 0.05   |
| INP                                          | < 200 ms |
| Public JS shipped (homepage, gzipped)        | < 130 kB |
| Public route DB queries on a cache hit       | 0        |
| Lighthouse Performance / A11y / SEO (mobile) | ≥ 95     |

The homepage is a sales asset. A 4-second homepage is a broken homepage regardless of how it looks.

Enablers: server components by default, `next/font` self-hosting with `display: swap`, `next/image` everywhere with explicit dimensions and blur placeholders, motion imported only in the leaf Client Components that need it, and no client-side data fetching on the marketing site.

The single largest threat to the JS budget is animation libraries — GSAP with ScrollTrigger alone would consume roughly half of it. This is why ADR-015 restricts V1 to Framer Motion, loaded through its lazy feature API.

---

## 13. Security posture

- Authorization at the DAL, never only at the proxy or in the UI.
- Every Server Action re-authorizes. A Server Action is a public HTTP endpoint; treat it as one. `serverActions.allowedOrigins` is configured so the built-in origin check is meaningful behind Vercel's proxy.
- Every external input parsed with Zod at the boundary.
- Draft Mode entry guarded by a secret **and** an authenticated admin session, with the redirect target taken from the database row rather than the query parameter (open-redirect defence, per the Next.js docs). The `__prerender_bypass` cookie it sets is a capability — preview links are not shareable and this is stated in the admin UI.
- **No `dangerouslySetInnerHTML` anywhere.** Rich text is a structured node tree (ADR-016). Enforced by lint.
- **Split CSP** (ADR-013): a static policy for public routes via `next.config.ts` `headers()`, and a strict nonce-based policy for `/admin/*` via `proxy.ts`. Plus HSTS, `X-Content-Type-Options`, `Referrer-Policy`, and a restrictive `Permissions-Policy` on all routes.
- Uploads: server-side MIME verification, size limits, and SVG sanitisation before storage (`CMS.md` §7.6).
- Contact form: honeypot field, minimum time-to-submit, and per-IP-hash rate limiting. The IP hash is salted with a secret, never a constant — an unsalted hash of an IPv4 address is reversible by enumeration.
- Admin sessions have an absolute expiry (30 days) in addition to Supabase's rolling refresh, so a stolen refresh token cannot grant indefinite access.
- Secrets live in Vercel environment variables. The Supabase service role key is server-only and never logged.
- `import 'server-only'` at the top of every file under `src/server/**` so that an accidental client import fails at build time rather than leaking credentials.

### 13.1 The `'unsafe-inline'` trade, stated honestly

The public CSP permits `'unsafe-inline'` for scripts because a per-request nonce would force dynamic rendering and destroy the static shell. This is a real weakening and should not be glossed over. It is acceptable here for a specific, checkable reason: **the public site renders no user-supplied HTML and executes no third-party scripts.** ADR-016 makes the first a hard rule and ADR-018 makes the second one. `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`, and `frame-ancestors 'none'` remain enforced, so clickjacking, base-tag injection, and form hijacking are still blocked.

If either premise ever changes — a rich-text section starts storing HTML, or a marketing pixel is added — this decision must be reopened, not quietly inherited.

---

## 14. Observability

- Vercel Analytics + Speed Insights on the public site. Both are cookieless, so **no consent banner is required** (ADR-018) — a genuine conversion win, not just a compliance one.
- Structured server-side logging via a thin `src/lib/logger.ts` wrapper — never bare `console.log` in `src/server/**`.
- Contact submissions are visible in the admin, and un-notified rows are flagged, so a broken lead path is detectable without external tooling.
- **No third-party error monitoring in V1** (ADR-019). Vercel runtime logs plus structured logging cover the server; we accept slower diagnosis of client-side errors in exchange for the JS budget. The trigger for adding Sentry — server-side first — is a production bug that logs alone cannot explain.

---

## 15. What we are deliberately not building

Recorded so the boundary does not erode:

- A drag-and-drop page builder. Sections are a fixed, typed registry.
- Multi-user roles and permissions. One admin.
- Content version history UI in V1 (the data model permits it later at no cost).
- Internationalisation.
- A public API.
- Ecommerce, carts, or payments.
- A separate design-system package. Components live in this repo until there is a second consumer.

Every item above is a _later_ decision, not a _never_ decision — but adding any of them requires an entry in `docs/DECISIONS.md` first.

---

## 16. Related documents

| Document              | Covers                                                         |
| --------------------- | -------------------------------------------------------------- |
| `DATABASE.md`         | Schema, Prisma, connections, migrations, RLS                   |
| `CMS.md`              | Content model, section registry, draft/publish, preview, media |
| `FOLDER_STRUCTURE.md` | Directory layout and import rules                              |
| `CODING_STANDARDS.md` | TypeScript, React, styling, motion, forms, testing             |
| `ROADMAP.md`          | Delivery phases and exit criteria                              |
| `DECISIONS.md`        | Architecture decision records                                  |
