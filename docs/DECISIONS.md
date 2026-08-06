# Architecture Decision Records

**Status:** Append-only log. Never edit a decision — supersede it with a new one.
**Last reviewed:** 2026-08-06

---

## How to use this file

One record per decision that would be expensive to reverse or that a future engineer would otherwise re-litigate. Format:

```
## ADR-NNN — Title
**Date** · **Status:** Accepted | Superseded by ADR-NNN | Deprecated
**Context** — the forces at play
**Decision** — what we chose
**Consequences** — what this costs us, including the bad parts
**Alternatives considered** — and why they lost
```

Superseding a decision means adding a new ADR and marking the old one. The history stays.

---

## ADR-001 — Full-stack Next.js application, not a headless CMS

**Date:** 2026-08-06 · **Status:** Accepted

**Context.** The site is moving off Shopify. The owner needs to edit content without a developer. The obvious options were a headless CMS (Sanity, Payload, Contentful) fronting a Next.js site, or building the CMS into the application.

**Decision.** One Next.js application containing the public site, the admin, the database, and the content model. No external CMS.

**Consequences.**

- We own the editing experience end to end, so it can be shaped exactly to this site's section types rather than to a generic content abstraction.
- No third-party pricing, rate limits, API downtime, or migration risk.
- No network hop between content and rendering — content is a Postgres row read in the same process.
- We build and maintain the admin ourselves. That is real, ongoing work, and it is the main cost of this decision.
- Content modelling changes require a migration and a deploy, not a click in someone else's dashboard.

**Alternatives considered.** Payload CMS (closest fit; rejected because it brings its own admin conventions and its own opinions about the data layer, and we would end up fighting them to reach the design bar). Sanity (excellent editing UX, but content lives in someone else's system and the rendering path gains a network dependency). Contentful (cost, and the model is too generic for a handcrafted marketing site).

---

## ADR-002 — Enable Cache Components (`cacheComponents: true`) from day one

**Date:** 2026-08-06 · **Status:** Accepted

**Context.** Next.js 16 removed the experimental PPR flag and replaced it with Cache Components. Under it, `'use cache'`, `cacheTag`, and `cacheLife` are stable, Partial Prerendering is the default, and the framework refuses to let a route silently become fully dynamic.

**Decision.** Enable it in `next.config.ts` before any application code is written.

**Consequences.**

- The public site prerenders to a static shell servable from the CDN. This is the mechanism behind the performance budget in `ARCHITECTURE.md` §12.
- Content invalidation becomes explicit and precise: tag on read, `updateTag` on publish.
- Every uncached read or runtime API access must be inside a `<Suspense>` boundary. The dev overlay enforces this. It is stricter than the old model, and that strictness is the point.
- Cached functions cannot read `cookies()`/`headers()`/`searchParams`, and cannot return class instances. Both constraints shape the DAL (see ADR-005).
- Retrofitting this later would mean restructuring every route's Suspense boundaries. Adopting it on an empty codebase costs nothing.

**Alternatives considered.** The previous caching model (`caching-without-cache-components`). Rejected: it is the legacy path in this version, and the failure mode — a route quietly turning dynamic and losing its static shell — is exactly the failure we cannot afford on a marketing site.

---

## ADR-003 — Immutable publication snapshots for published content

**Date:** 2026-08-06 · **Status:** ~~Accepted~~ **Superseded by ADR-012 (2026-08-06)**

> Superseded on review, before implementation. The joinless-read benefit optimised a path that runs only on cache miss, the snapshot builder was the most complex code in the system, and the media-staleness cost was real. See ADR-012.

**Context.** The admin edits normalised relational content. The public site needs the fastest, most cache-friendly read possible, and must never show a half-published page. Editing a live page must not change the live page.

**Decision.** Two representations. The **working copy** is normalised rows (`Page` + `PageSection`). Publishing writes an immutable `PagePublication` row containing the fully-resolved page as JSON — sections, SEO, and all referenced media, testimonials, and logos already resolved — and repoints `Page.currentPublicationId` in the same transaction. The public site reads only publications.

**Consequences.**

- Public rendering is one indexed row read with no joins. Trivially cacheable, since the row can never change.
- Publishing is atomic. There is no observable partial state.
- Editing a published page is safe: the live site is untouched until publish.
- Rollback is repointing a foreign key. Version history is free later, though not exposed in V1.
- **Cost:** snapshots duplicate content. Storage is negligible; staleness is not. Editing a `MediaAsset`'s alt text does not change already-published pages until they are republished. The admin surfaces affected pages rather than letting them diverge silently.
- **Cost:** the snapshot builder is a real piece of code that must stay in sync with the section registry. It is validated against a Zod schema at publish time so drift fails loudly.

**Alternatives considered.** A `status` column on the working rows (simplest, but editing a live page changes the live page — unacceptable). Draft/published column pairs (doubles every column; unreadable). A full versioned-content table with row-level history (correct but far more machinery than a single-admin V1 needs; the snapshot model upgrades into it cleanly).

---

## ADR-004 — Supabase Auth for identity, Prisma for all data

**Date:** 2026-08-06 · **Status:** Accepted

**Context.** One administrator. We need a session mechanism, password reset, and eventually MFA — without hand-rolling crypto — plus a single, auditable choke point for authorization.

**Decision.** Supabase Auth issues and refreshes the session (cookie-based, via `@supabase/ssr`). It is an identity provider only. **Prisma is the sole client for application tables.** Authorization happens in the Data Access Layer: `verifySession()` resolves the session, `requireAdmin()` confirms an active `AdminUser` row. `proxy.ts` performs an optimistic redirect and nothing more.

**Consequences.**

- No bespoke session storage, password hashing, or reset flows.
- One typed ORM over our schema, rather than two clients with different capabilities and different security models.
- Because Prisma connects as a privileged role, Supabase RLS does not gate our queries — authorization is entirely our responsibility, concentrated in the DAL. This is stated plainly so nobody assumes RLS is protecting them.
- We still enable RLS with deny-all policies as defence in depth (ADR-006).
- Coupling to Supabase Auth. Migrating to another provider means replacing session issuance only; the `AdminUser` authorization table is ours and would survive.

**Alternatives considered.** Auth.js/NextAuth (more configuration, more surface, no advantage for one user). A hand-rolled JWT session (the Next.js docs describe how; rejected — password reset and MFA are exactly the things not worth hand-rolling). Supabase client-side queries with RLS as the authorization model (rejected: puts authorization in database policies rather than reviewable application code, and would mean two data clients).

---

## ADR-005 — Cached functions return mapped plain objects

**Date:** 2026-08-06 · **Status:** Accepted

**Context.** `'use cache'` serializes return values and rejects class instances. Prisma returns `Decimal` class instances for decimal columns and its own types elsewhere. A cached function returning a Prisma row therefore fails at runtime — and in a dynamically-rendered route, that failure can pass `next build` and only appear under `next start`.

**Decision.** Every cached read ends in a mapper (`src/server/*/mappers.ts`) that converts Prisma rows into plain domain objects — `Decimal` → `number`, explicit field selection, object literals only. Domain types are what leave `src/server/**`; Prisma types never do.

**Consequences.**

- A mapper layer exists that would otherwise look like ceremony. It is not ceremony; it is required for correctness.
- Route and feature code depends on our types, not Prisma's, so schema refactors have a contained blast radius.
- Response payloads are explicit, which also means we never accidentally serialize a column we did not intend to expose.
- Mappers must be updated when the schema changes. Type errors catch this.

**Alternatives considered.** Returning Prisma rows and hoping (fails at runtime). A generic `JSON.parse(JSON.stringify(x))` round-trip (loses `Date`, hides the problem, and silently ships fields we did not intend to expose).

---

## ADR-006 — RLS enabled with deny-all policies

**Date:** 2026-08-06 · **Status:** Accepted

**Context.** Prisma connects as a privileged role, so RLS does not affect our queries. The Supabase anon key is, by design, exposed to browsers in typical Supabase applications, and Supabase client libraries are easy to reach for by habit.

**Decision.** Enable RLS on every application table with no permissive policies for `anon` or `authenticated`.

**Consequences.**

- Zero effect on normal operation.
- If the anon key leaks, or a Client Component ever instantiates a Supabase client and queries a table, it reads nothing.
- Eliminates an entire class of accidental exposure for a one-line-per-table cost.
- Anyone later wanting legitimate client-side Supabase access must write an explicit policy — a visible, reviewable act rather than an accident.

**Alternatives considered.** Leaving RLS off (Supabase warns about it, and it makes the default state "open"). Writing real per-role policies (unnecessary: no client ever queries directly).

---

## ADR-007 — Fixed section registry, not a page builder

**Date:** 2026-08-06 · **Status:** Accepted

**Context.** The owner must be able to compose pages. The site must look handcrafted. Every page builder ever shipped has, over time, produced pages that look like they came from a page builder.

**Decision.** Pages are an ordered array of typed sections drawn from a fixed registry. The editor reorders, enables, disables, and edits content. Adding a new section _type_ requires code: a Prisma enum member, a Zod schema, a registry entry, and a React component.

**Consequences.**

- Design quality is structurally protected. There is no path by which an editor produces an ugly layout.
- Section data is strongly typed and validated at every boundary.
- The admin form for each section is derived from its schema, so the editor and the renderer cannot disagree about the shape of the data.
- **Cost:** a new layout needs a developer and a deploy. This is a deliberate trade, and the reason the section catalogue is designed around the site's narrative rather than around generic building blocks.
- Unknown section types in old snapshots render as nothing rather than crashing, so removing a type is safe.

**Alternatives considered.** A block-based editor with nestable primitives (this _is_ a page builder, whatever it is called). Free-form rich text per page (loses all layout control and all structure). Section types defined entirely in the database (no type safety, no validation, no component mapping — the worst of both).

---

## ADR-008 — shadcn/ui in the admin only

**Date:** 2026-08-06 · **Status:** Accepted

**Context.** shadcn/ui is excellent for building dense, functional interfaces quickly. It also has a recognisable aesthetic, and the public site must not look like anything recognisable.

**Decision.** shadcn/ui components live in `src/components/ui/` and are used **only** by `/admin`. The public marketing site uses handcrafted primitives in `src/components/primitives/`, built against our own design tokens.

**Consequences.**

- The admin is built fast, is accessible by default, and is consistent — none of which the owner will ever notice, which is correct for an internal tool.
- The public site owes nothing to a component library's defaults, and its bundle carries none of them.
- Two sets of primitives exist. This is intentional separation, not duplication: they serve different audiences with different requirements.
- Radix primitives (which shadcn/ui wraps) may still be used directly on the public site where genuinely hard interaction patterns arise — accordions, dialogs — styled entirely by us.

**Alternatives considered.** shadcn/ui everywhere (risks the generic-SaaS look the brief explicitly rejects). Handcrafting the admin too (weeks of work on screens one person sees).

---

## ADR-009 — Server Actions as the mutation interface

**Date:** 2026-08-06 · **Status:** Accepted

**Context.** Mutations are needed from the admin (content) and the public site (contact form). Options: REST route handlers, or Server Actions.

**Decision.** All mutations are Server Actions. Route Handlers exist only where an HTTP contract is imposed on us: Draft Mode entry/exit and an optional external revalidation webhook.

**Consequences.**

- Types flow end to end without a client, a schema-sharing layer, or generated types.
- Forms work with progressive enhancement via `useActionState`.
- `updateTag` — the read-your-writes invalidation API — is Server-Actions-only, and it is exactly what a publish action needs.
- **A Server Action is a public HTTP endpoint.** Every one authorizes and validates independently. This is the single most important rule in `CODING_STANDARDS.md` §5.
- No public API surface for third parties. We do not need one; if we ever do, it is an additive change.

**Alternatives considered.** Route Handlers for everything (more boilerplate, manual serialization, no progressive enhancement, and gives up `updateTag`). tRPC (excellent, but redundant when the server and client are the same application and Server Actions already provide typed RPC).

---

## ADR-010 — `src/` directory layout

**Date:** 2026-08-06 · **Status:** Accepted

**Context.** Create Next App scaffolded `app/` at the repo root. The root will accumulate roughly a dozen config files, `prisma/`, `docs/`, `tests/`, and `public/`.

**Decision.** Move application code under `src/`. `@/*` maps to `./src/*`. `proxy.ts` lives in `src/` because it must sit beside `app/`.

**Consequences.**

- Application code is visibly separate from project configuration.
- One-time restructure, done in Phase 1 while the codebase is empty. Free now, disruptive later.
- All documentation, tooling paths, and ESLint boundary rules assume `src/`.

**Alternatives considered.** Keeping `app/` at the root (works, but the root becomes noisy and the boundary between "the app" and "how the app is built" blurs).

---

## ADR-011 — Direct-to-storage uploads with server-side metadata extraction

**Date:** 2026-08-06 · **Status:** Accepted

**Context.** The media library must handle real photography and email design renders — multi-megabyte files. Vercel's serverless request body limit makes proxying uploads through our own server unreliable. Separately, `next/image` needs accurate dimensions and a blur placeholder to meet the CLS budget.

**Decision.** Three steps: a Server Action issues a signed upload URL and a deterministic storage path; the browser uploads directly to Supabase Storage; a second Server Action fetches the object server-side, derives width, height, real MIME type, and a blur placeholder with `sharp`, and writes the `MediaAsset` row.

**Consequences.**

- Large files upload reliably, and bytes never transit our functions.
- Dimensions, MIME type, and placeholder are derived server-side, never trusted from the client. A file claiming to be a PNG that is not one is rejected.
- Every rendered image has explicit dimensions and a placeholder, which is what actually delivers the CLS budget.
- A two-step flow can leave an orphaned object if the browser dies between steps. A periodic reconciliation job is a known follow-up, deliberately deferred — a handful of orphans in a single-admin system is not worth pre-solving.

**Alternatives considered.** Uploading through a Route Handler (body size limit). Trusting client-reported dimensions (wrong under EXIF rotation, and trivially spoofable). Skipping blur placeholders (measurably worse perceived performance on an image-heavy premium site).

---

## ADR-012 — Content is a validated JSON document, not normalised section rows

**Date:** 2026-08-06 · **Status:** Accepted · **Supersedes ADR-003**

**Context.** ADR-003 stored content as normalised `PageSection` rows plus an immutable `PagePublication` snapshot with every reference pre-resolved. Reviewing it before implementation, three of its four justifications did not survive scrutiny:

- _"One indexed row, no joins"_ optimised the **cache-miss path only**. Under ADR-002, a published page is cached with `cacheLife('max')` and served from the static shell; a cache hit performs zero database reads either way. We were paying real complexity to speed up a query that runs a handful of times per deploy. That is precisely the premature optimisation the engineering principles forbid.
- _"Free version history"_ does not require the snapshot to be on the read path.
- _"Atomic publish"_ comes from the transaction, not from the snapshot table.

Only the fourth — _editing a published page must not change the live page_ — was load-bearing. Meanwhile the snapshot builder was the most complex module in the design, and its documented cost (media alt-text edits not propagating until republish) was a genuine editorial regression.

**Decision.** A page's content is a single Zod-validated JSON document — an ordered array of sections — stored in two columns on the `Page` row:

- `draftContent Json` — what the admin edits
- `publishedContent Json?` — what the public sees; `null` means not live

Publishing copies `draftContent` into `publishedContent` in one statement and appends a row to an append-only `ContentRevision` table. `PageSection`, `PagePublication`, `CaseStudyPublication`, and `CaseStudyMetric` are all deleted from the schema. The `SectionType` Postgres enum is deleted; section types are a TypeScript union owned by the registry.

**Sections store references (media ids, testimonial ids) rather than resolved copies.** The renderer resolves them through separately cached, separately tagged functions.

**Consequences.**

- The snapshot builder — roughly the most intricate code in the system — no longer exists. Publishing is a column copy.
- Adding a section type drops from six steps to three: Zod definition, registry entry, React component. **No migration.** The friction that protects design quality was always the requirement to write a component; the enum migration added ceremony, not safety.
- Reordering is array manipulation, not a position-renumbering transaction.
- Editing an image's alt text or fixing a typo in a testimonial goes live immediately, everywhere it appears. The ADR-003 staleness cost is gone, and OD-7 is closed.
- **New, explicit trade:** _page composition_ is versioned; _library content_ (testimonials, logos, media, email examples) is live. Publishing a page freezes its structure and copy, not the shared entities it references. This is coherent and explainable — and it matches what an editor actually wants when fixing a typo in a quote.
- Referential integrity for media references is no longer enforced by foreign keys. At our scale (well under a hundred content rows) the "which pages use this asset?" check is a scan, not an index problem. A GIN index on the JSONB columns is available if it ever matters.
- Autosave writes the whole document. Documents hold ids, not blobs, so they are a few kilobytes. An optimistic-concurrency `draftVersion` integer guards against a stale tab clobbering newer edits.
- `ContentRevision` is append-only, off the read path, and has no UI in V1. Rollback is a copy from a revision row.

**Alternatives considered.** Keeping ADR-003 (rejected above). Draft/published column pairs on normalised section rows (requires published mirrors of `position` and `isEnabled` plus tombstones for deleted-but-still-published sections — genuinely ugly). Snapshotting the document but still resolving references at render (half the complexity for none of the benefit).

---

## ADR-013 — Split CSP: nonce-based for the admin, static header for the public site

**Date:** 2026-08-06 · **Status:** Accepted

**Context.** `ARCHITECTURE.md` §13 specified a Content Security Policy delivered via `proxy.ts`. The Next.js CSP guide states plainly that a nonce must be unique per request and therefore **"you must use dynamic rendering to add nonces."** That is in direct conflict with ADR-002, whose entire purpose is a prerendered static shell. My original documents asserted both. One of them had to give.

**Decision.** Two policies:

- **Public routes** — a static CSP delivered through `headers()` in `next.config.ts`. No nonce, so pages stay static. `script-src` permits `'self' 'unsafe-inline'`; `object-src 'none'`, `base-uri 'self'`, `frame-ancestors 'none'`, `form-action 'self'`, and a tight `default-src`/`img-src`/`font-src`/`connect-src` allowlist are all still enforced.
- **`/admin/*`** — a strict nonce-based CSP with `'strict-dynamic'`, generated in `proxy.ts`. The admin is authenticated and dynamic by design, so the nonce costs nothing there.

**Consequences.**

- The static shell survives, and with it the performance budget.
- `'unsafe-inline'` on the public site is a real weakening, and we should be honest about it rather than pretend otherwise. It is acceptable **only because the public site renders no user-supplied HTML** — which ADR-016 makes a hard rule rather than a happy accident. `frame-ancestors`, `base-uri`, `form-action`, and `object-src` still block clickjacking, base-tag injection, form hijacking, and plugin injection.
- The admin — the surface where a compromise would be most damaging — gets the strong policy.
- Two policies to maintain. Both live in one module each, and a Playwright test asserts the headers on a public route and an admin route.

**Alternatives considered.** Nonce everywhere (destroys the static shell; unacceptable). No CSP (leaves easy wins on the table). Hash-based CSP for public scripts (Next.js's inline bootstrap content is not stable across builds, so the hashes would need regenerating every deploy — brittle).

---

## ADR-014 — `proxy.ts` runs only on `/admin` and preview routes

**Date:** 2026-08-06 · **Status:** Accepted

**Context.** The Next.js authentication guide recommends running proxy on all routes. My `ARCHITECTURE.md` §7 repeated that. But the CDN caching guide warns that proxy "should run before the CDN cache" and that deployments placing it behind the CDN must "bypass caching for routes that depend on proxy decisions." Running proxy on every public request therefore threatens the CDN-served static shell that ADR-002 exists to produce — a second conflict between my own documents. Proxy is also Node-runtime-only in Next.js 16, so it is not free.

**Decision.** The proxy matcher covers `/admin/:path*` and `/api/preview/:path*` and nothing else. Security headers for public routes move to `headers()` in `next.config.ts`, which is static configuration and does not touch the request path.

**Consequences.**

- Public routes are served from the CDN with no function invocation. This is the mechanism behind the LCP budget.
- The general advice to run auth proxy everywhere exists to protect authenticated content. **All** of our authenticated content is under `/admin`; the public site is intentionally world-readable. The advice does not apply to our shape.
- The proxy remains what ADR-004 already said it was: an optimistic redirect, not a security boundary. The DAL is the boundary, and it is unaffected by the matcher.
- If a future feature puts authenticated content outside `/admin`, this matcher must be revisited. Noted in the file's header comment.

---

## ADR-015 — Framer Motion only in V1; GSAP requires a measured justification

**Date:** 2026-08-06 · **Status:** Accepted

**Context.** The brief allows GSAP "only where it produces a better result." The original documents listed both libraries as available. GSAP with ScrollTrigger costs roughly 60–70 kB gzipped before any of our own code; Framer Motion is meaningfully smaller and can be reduced further with its lazy-loaded feature API. The public JS budget is 130 kB. Shipping both would spend most of the budget on animation libraries.

**Decision.** V1 ships Framer Motion only, imported through its lazy feature API, and only inside leaf Client Components under `src/components/motion/`. CSS transitions remain the default for anything simple. Introducing GSAP requires an ADR containing a specific effect that was attempted in Framer Motion, why it fell short, and the measured bundle delta.

**Consequences.**

- The budget stays intact, and the brief's "only where it produces a better result" becomes a testable gate rather than an aspiration.
- If a scroll-linked sequence genuinely needs GSAP, the door is open — with evidence.
- All motion already routes through `src/components/motion/`, so adding GSAP later touches one folder.

---

## ADR-016 — Rich text is structured JSON; the public site never renders raw HTML

**Date:** 2026-08-06 · **Status:** Accepted

**Context.** A `RICH_TEXT` section is in the V1 catalogue and the original documents never said how its content is stored. The default instinct — store HTML from a WYSIWYG editor and render it with `dangerouslySetInnerHTML` — would introduce a stored-XSS vector, and would specifically invalidate the reasoning in ADR-013 that permits `'unsafe-inline'` on the public site.

**Decision.** Rich text is stored as a structured JSON document (a constrained node tree: paragraph, heading, list, link, emphasis, strong) validated by Zod, and rendered by mapping nodes to React elements. `dangerouslySetInnerHTML` does not appear anywhere in the codebase; an ESLint rule forbids it. Link `href` values are validated against an allowlist of schemes (`https:`, `mailto:`, relative).

**Consequences.**

- No stored-XSS vector, and ADR-013's public CSP reasoning holds.
- Typography of rich text is controlled by us, not by whatever markup an editor produced — which is also what the design brief demands.
- The editor is constrained to the node types we support. That is the same intentional constraint as ADR-007, applied at a smaller scale.
- The renderer is a modest amount of code. Worth it.

---

## ADR-017 — Prerender known content routes with `generateStaticParams`; enable `partialPrefetching`

**Date:** 2026-08-06 · **Status:** Accepted

**Context.** The original documents specified a `[...slug]` catch-all for CMS pages and a `/work/[slug]` route but never said how those URLs get prerendered. Without `generateStaticParams`, every content URL is served as a generic App Shell on first visit and upgraded in the background — working, but a worse first impression on exactly the pages that matter.

**Decision.** `generateStaticParams` on the CMS catch-all and on `/work/[slug]`, sourced from published slugs. `partialPrefetching: true` alongside `cacheComponents: true`, which the ISR guide names as the pairing that upgrades an App Shell to a full route.

**Consequences.**

- Every page that existed at build time is fully prerendered.
- Pages published _after_ a build are served the App Shell on first visit, then cached — correct ISR behaviour, no deploy required to publish.
- **The build now requires database access.** `DATABASE_URL` must be present in the Vercel build environment, and a database outage becomes a build failure. This is a real new dependency and is called out in `ARCHITECTURE.md` §11.
- Params must still be awaited _inside_ a Suspense boundary even when statically known, or the App Shell gets tied to one URL.

---

## ADR-018 — Cookieless analytics, no consent banner, and a stated retention policy

**Date:** 2026-08-06 · **Status:** Accepted

**Context.** Entirely absent from the original documents, despite the site collecting personal data from EU/UK prospects through a contact form. Two separate obligations: consent for non-essential cookies, and a lawful basis plus retention period for submitted personal data.

**Decision.** Vercel Analytics and Speed Insights only — both cookieless — so no consent banner is required. No Google Analytics, no advertising pixels, no third-party tracking scripts. `ContactSubmission` rows are retained for 24 months and then hard-deleted by a scheduled job. A privacy policy page ships before launch and is linked from the contact form.

**Consequences.**

- No cookie banner. This is a genuine design and conversion win, not merely a compliance one — a consent modal over the hero of a premium marketing site is a real cost.
- Adding a marketing pixel later means adding a consent mechanism. That trade is now explicit rather than accidental.
- Retention is enforced by a job, not by intention. **Hard delete, not soft delete** — `deletedAt` is therefore removed from `ContactSubmission`; an `ARCHIVED` status covers the admin's "dealt with" case.
- Analytics is limited to page-level data. Sufficient for a site whose conversion event is a form submission we store ourselves.

---

## ADR-019 — Postgres-backed rate limiting; no third-party error monitoring in V1

**Date:** 2026-08-06 · **Status:** Accepted · **Closes OD-2, OD-3**

**Context.** Two open decisions that would default badly if left open: they would each be resolved under time pressure by adding a dependency.

**Decision.** Rate limiting uses a small Postgres table with a windowed count, queried in the contact Server Action. No Upstash, no Vercel KV. Error handling uses structured logging via `src/lib/logger.ts` plus Vercel's built-in runtime logs; no Sentry in V1.

**Consequences.**

- Two fewer services, two fewer sets of credentials, two fewer bills, and no client-side error-reporting bundle on a site with a 130 kB budget.
- A realistic volume for this site is tens of submissions per month against a table with an index on `(ipHash, createdAt)`. Postgres is not the bottleneck and will not become one.
- **The trigger for revisiting is explicit:** if a genuine spam problem emerges, or if we ever need cross-region rate limiting, move to a KV store. If a production bug proves hard to diagnose from logs alone, add Sentry — server-side only first.
- We accept slower diagnosis of client-side errors in exchange for the budget. For a marketing site of this size that is the right trade; for an application with real user workflows it would not be.

---

## Open decisions

Recorded so they are made deliberately rather than by default. Each becomes an ADR when resolved.

| #    | Question                                                                                                                                                    | Needed by      |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- |
| OD-1 | Exact Supabase pooler connection parameters for Prisma 6 (pooler port, flags) — verify against current Supabase docs                                        | Phase 1        |
| OD-4 | Booking: link out to an external scheduler vs. embed                                                                                                        | Phase 5        |
| OD-5 | React Compiler (`reactCompiler: true`) — measure build-time cost against re-render benefit                                                                  | Post-launch    |
| OD-6 | React `<ViewTransition>` for page transitions                                                                                                               | Post-launch    |
| OD-8 | Whether `docs/CONTENT_STRATEGY.md` should exist — the homepage narrative is a content decision the owner must lead, and the section catalogue depends on it | Before Phase 5 |

Closed on review: OD-2 and OD-3 by ADR-019; OD-7 by ADR-012.

---

## Note on verification

The Next.js facts in these documents were verified against the bundled docs at `node_modules/next/dist/docs/` for the installed version (16.3.0) on 2026-08-06. Claims about Prisma, Supabase, Resend, and `sharp` come from general knowledge and **must be re-verified against each package's own documentation at implementation time**. Where a document states an API detail for those libraries, treat it as intent, not as a verified fact.
