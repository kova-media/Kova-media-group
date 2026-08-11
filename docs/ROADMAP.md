# Roadmap

**Status:** Living document. Update as phases complete.
**Last reviewed:** 2026-08-06

---

## How this is sequenced

Foundations before features, and the **content pipeline before the visual design**. The homepage is the hardest and most valuable thing we build; it should be built last among the core work, on top of a system that already works, using real content — not designed in a vacuum and retrofitted into a CMS.

Each phase has explicit exit criteria. A phase is not done because the code exists; it is done when the criteria are met. No phase starts before the previous one exits.

---

## Phase 0 — Documentation and decisions ✅

**Goal:** A written architecture that outlives any single conversation.

- [x] `ARCHITECTURE.md`, `DATABASE.md`, `CMS.md`, `FOLDER_STRUCTURE.md`, `CODING_STANDARDS.md`, `ROADMAP.md`, `DECISIONS.md`
- [x] Verify all framework claims against `node_modules/next/dist/docs/` for Next.js 16.3
- [x] Adversarial self-review before implementation — ADR-003 superseded, two internal conflicts resolved (ADR-012 to ADR-019)

**Exit:** Documents reviewed and approved by the owner. **Complete pending owner sign-off.**

---

## Phase 1 — Foundation

**Goal:** An empty but correct application. Nothing user-facing.

- Restructure into `src/`; update `tsconfig.json` paths (`@/*` → `./src/*`)
- Strengthen `tsconfig.json` per `CODING_STANDARDS.md` §2; pin Node in `.nvmrc` + `engines`
- `next.config.ts`: `cacheComponents: true`, `partialPrefetching: true`, `images.remotePatterns` for Supabase Storage, static security headers for public routes (ADR-013), `serverActions.allowedOrigins`
- Install and configure: Prisma, Supabase clients, Zod, Resend, Tailwind token layer, shadcn/ui (admin scope), Framer Motion
- `src/env.ts` — Zod-validated environment, failing at build time
- `src/db/prisma.ts` singleton
- Supabase projects: production and preview. Connection strings verified (pooled runtime, direct for migrations)
- Prisma schema per `DATABASE.md` §4; initial migration applied
- `prisma/seed.ts`, idempotent
- RLS enabled with deny-all policies on all application tables
- ESLint boundaries, Prettier + Tailwind class sorting
- GitHub repo `kova-media/Kova-media-group`; Vercel project `Kova-media-group-website` linked
- CI: type-check, lint, test, `next build`, `prisma migrate deploy` before promotion
- `src/lib/logger.ts`

**Exit criteria**

- `npm run build` succeeds locally and on Vercel
- Migrations apply cleanly to an empty database; seed produces a working dataset
- A deliberately malformed env var fails the build
- Preview deployments work on a PR

---

## Phase 2 — Authentication and admin shell

**Goal:** The owner can log in and see an empty, well-built admin.

- Supabase Auth wiring; cookie session via `@supabase/ssr`; absolute session expiry
- `src/server/auth/dal.ts`: `verifySession()`, `requireAdmin()`, `React.cache`-memoised
- `src/proxy.ts`: **matcher scoped to `/admin/:path*` and `/api/preview/:path*` only** (ADR-014); optimistic redirect; nonce-based admin CSP (ADR-013)
- `/admin/login` with `useActionState`; rate-limited
- Admin shell: sidebar, topbar, breadcrumbs, empty dashboard
- Sign-out; password reset flow
- `error.tsx` / `not-found.tsx` for the admin segment

**Exit criteria**

- Unauthenticated `/admin/*` redirects to login; authenticated login redirects to the dashboard
- Removing the proxy entirely still blocks data access (DAL is the real boundary) — verified by test
- A deactivated `AdminUser` is locked out on the next request
- Admin routes return no cached responses (verified in response headers)
- Security headers present on all responses

---

## Phase 3 — CMS core

**Goal:** Content can be modelled, edited, previewed, and published. This is the heart of the project.

- Section registry, definitions, and Zod schemas for the V1 catalogue
- `pageContentSchema` — the content document; rich-text node tree + renderer (ADR-016)
- Page CRUD; system pages protected from deletion
- Section editor: add, remove, reorder (drag-and-drop), enable/disable, edit, autosave with `draftVersion` conflict detection
- `publishPage()` / `unpublishPage()` — transactional, writes `ContentRevision`, `updateTag` invalidation
- Cached, individually tagged resolvers for media / testimonials / logos / email examples
- Cache tag vocabulary in `src/server/cache/tags.ts`
- Draft Mode: `/api/preview` (secret + session guarded, DB-resolved redirect), `/api/preview/exit`, `PreviewBanner`
- Media library: signed direct upload, server-side `sharp` metadata + blur placeholder, MIME/size limits, SVG sanitisation, alt-text editing, soft delete with usage checks
- Case studies with structured metrics; same publish semantics
- Content library: testimonials, partner logos, email examples
- Site settings: nav, footer, SEO defaults, contact details

**Exit criteria**

- A page can be created, edited, previewed, published, edited again, and republished — with the public site showing the published version throughout and the preview showing the draft
- Publishing is atomic: a forced mid-transaction failure leaves the previous published content live
- Publishing a page with a broken reference (deleted media) fails with a clear message naming the section, rather than shipping a hole
- Editing a testimonial's text updates every published page showing it, with no republish — and invalidates only that testimonial's tag
- Two browser tabs editing the same page produce a conflict error, not a silent clobber
- Preview and production render through the same components — verified by a shared-path test
- Zero database reads on a cache hit
- Uploading an 8 MB image succeeds end to end and produces correct width, height, and blur placeholder; an SVG with an embedded script is sanitised

---

## Phase 4 — Public site shell and lead capture

**Goal:** The site exists, is fast, and can capture a lead.

- Design token layer: typography scale, spacing rhythm, colour, easing, durations
- `next/font` self-hosted typefaces
- Public primitives: `Container`, `Section`, `Prose`, `Eyebrow`, `Button`, `Link`
- Motion wrappers with `prefers-reduced-motion` support
- Site header (with scroll behaviour) and footer
- `[...slug]` catch-all route rendering published pages
- Contact form: Server Action, Zod, honeypot, timing check, Postgres-backed IP-hash rate limit, `ContactSubmission` persistence, Resend notification with `notifiedAt`
- Submissions inbox in the admin with status workflow and notes
- `generateStaticParams` on the CMS catch-all and `/work/[slug]` (ADR-017)
- SEO: `generateMetadata`, `sitemap.ts`, `robots.ts`, OG image generation, JSON-LD
- Privacy policy page; 24-month submission retention job (ADR-018)
- Public `error.tsx`, `not-found.tsx`
- Vercel Analytics + Speed Insights (cookieless — no consent banner)

**Exit criteria**

- Submitting the contact form persists the lead and delivers the email; a simulated Resend outage still persists the lead and flags it in the admin
- Rate limiting and honeypot verified against scripted submission
- Lighthouse mobile ≥ 95 across Performance, Accessibility, Best Practices, SEO on a representative page
- Sitemap lists exactly the published slugs and updates on publish
- Keyboard-only navigation of the full public shell works

---

## Phase 5 — The homepage

**Goal:** The sales experience. Built with real content, in the CMS, from the first commit of this phase.

- Narrative sequence agreed before any component is built: claim → credibility → proof → capability → evidence → partnership → objections → ask
- Real assets collected: client logos, email designs, Klaviyo screenshots, metrics, quotes
- Content entered through the admin — this is the CMS's acceptance test
- Build each section component against real content
- Scroll-driven motion designed as part of the narrative, not applied afterwards
- Responsive refinement across breakpoints
- Performance pass: LCP image priority, bundle audit, motion cost

**Exit criteria**

- Every word and image on the homepage is editable in the admin without touching code
- Homepage LCP < 1.8 s on mobile 4G; CLS < 0.05; INP < 200 ms
- Public JS for the homepage < 130 kB gzipped
- Full experience is coherent with `prefers-reduced-motion: reduce`
- Owner review: "this does not look like an agency template"
- A prospect can reach the booking CTA without needing another page

---

## Phase 6 — Supporting pages and launch

**Goal:** Ship it.

- Remaining pages: work index, case study detail, contact, privacy, terms
- Case study template built and populated with real studies
- Cross-browser QA (Chrome, Safari, Firefox, Edge; iOS and Android)
- Accessibility audit: automated pass plus manual keyboard and screen-reader review
- Security review: authorization coverage, both CSPs, rate limits, secret handling, dependency audit
- 301 redirect map from the current Shopify URL structure
- Domain cutover to `kovamediagroup.com`; SSL; `www` handling
- Analytics verified in production
- **Media bucket backup job** — Supabase Storage is not covered by database backups (`DATABASE.md` §9)
- Backup and restore rehearsed against the preview project, **including media**
- Owner handover: a short written guide plus a walkthrough

**Exit criteria**

- All redirects resolve; no 404s from indexed URLs
- Production smoke test: publish a change and see it live
- Owner independently publishes a content change without assistance
- Restore from backup verified — database _and_ media, with images actually loading afterwards

---

## Phase 4.5 — v0 frontend integration ✅

Not in the original plan. A separately generated v0 frontend became the visual
source of truth mid-project, and it was branched from a snapshot of `main` in a
way that deleted the entire backend (23,529 deletions). The frontend was ported
across rather than the branch merged; see PR #2 for the full reasoning.

Consequences recorded here because they change earlier decisions:

- **The design token layer is v0's**, not the one specified in Phase 4. The
  admin's `ink-*` / `paper` vocabulary is mapped onto it in a scoped
  compatibility block rather than rewriting ~160 class usages on a working,
  tested surface.
- **The homepage is a fixed composition, not a CMS-arranged page.** Its sections
  and their order are a designed narrative; the CMS controls the content inside
  them (case studies, quotes, FAQ, articles). The generic section registry still
  serves utility pages through the catch-all.
- **`instant = false` on all three dynamic routes**, revising ADR-017 for them.
  Reading `params` inside a Suspense boundary flushes a 200 before `notFound()`
  is reached, turning every missing page into a soft 404. Every published slug
  is prerendered, so real pages lose nothing.
- **The public JS budget of < 130 kB gzipped (Phase 5) is not met and is
  withdrawn as stated.** The homepage ships ~255 kB gzipped. The brief that
  produced the v0 design explicitly requires scroll-driven motion, parallax and
  animated mockups, and names Framer Motion and Lenis as acceptable; that is a
  deliberate, sanctioned cost, not an oversight. Lenis is loaded dynamically
  after hydration and barrel imports are optimised. The remaining lever is
  Framer Motion's `LazyMotion`, which would require replacing `motion.*` with
  `m.*` across every v0 component — deferred, because the instruction is to
  preserve those animations exactly.
- **`MotionConfig reducedMotion="user"`** is set site-wide. Framer Motion writes
  inline styles from rAF, so the CSS `prefers-reduced-motion` block never
  reached it and every reveal ignored the preference.

## Post-launch backlog

Not scheduled. Each requires an ADR before it starts.

| Item                                              | Trigger                                                                                         |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Content version history UI                        | Owner needs rollback; `ContentRevision` already stores the data                                 |
| Blog / resources section                          | Content strategy commits to publishing cadence                                                  |
| Booking integration (Cal.com / Savvycal) embedded | Conversion data suggests the handoff is leaking (OD-4)                                          |
| A/B testing on homepage copy                      | Enough traffic for significance                                                                 |
| Sentry (server-side first)                        | A production bug that structured logs cannot explain (ADR-019)                                  |
| KV-backed rate limiting                           | A genuine spam problem, or multi-region need (ADR-019)                                          |
| GSAP                                              | A specific effect Framer Motion cannot deliver, with measured bundle cost (ADR-015)             |
| Framer Motion `LazyMotion`                        | A measured need to cut the ~255 kB homepage bundle, weighed against touching every v0 animation |
| Real logo and favicon                             | Brand files supplied; the logo already resolves from Site settings with no code change          |
| React `<ViewTransition>` adoption                 | After stability in production usage (OD-6)                                                      |
| React Compiler                                    | Measured build-time cost vs. re-render benefit (OD-5)                                           |
| Multi-user roles                                  | A second person needs admin access                                                              |
| Client portal                                     | A commercial decision, not a technical one                                                      |

---

## Working agreement

1. **No implementation code until the documentation is approved.** (Phase 0's real exit criterion.)
2. Architectural changes update `docs/` in the same PR.
3. Phases are not run in parallel. Foundations that shift under a half-built feature cost more than the sequencing saves.
4. If a phase's exit criteria cannot be met, we fix the phase — we do not lower the criteria.
