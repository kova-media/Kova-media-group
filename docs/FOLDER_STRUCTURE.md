# Folder Structure

**Status:** Authoritative. New directories require an update to this document.
**Last reviewed:** 2026-08-06

---

## 1. Principles

1. **Find code by what it does, not by what it is.** `src/features/sections/hero/` beats a `components/` folder with 200 files in it.
2. **The route tree is for routing.** `src/app/**` holds `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, `route.ts`, and metadata files. Implementation lives in `src/features/**`.
3. **Server code is quarantined.** Everything under `src/server/**` starts with `import 'server-only'`. An accidental client import is a build error, not a leaked credential.
4. **One concept, one home.** Cache tags, section definitions, and env vars each have exactly one module that owns them.
5. **Colocate until it is shared twice.** A component used by one section lives in that section's folder. On the second consumer it moves up. Not before.

---

## 2. Top level

```
kova-website/
├── docs/                  ← this documentation; the source of truth
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── public/                ← genuinely static files only (favicon, robots assets)
├── src/
│   ├── app/               ← routes
│   ├── features/          ← feature modules
│   ├── server/            ← domain + data access (server-only)
│   ├── components/        ← shared, presentational, app-agnostic
│   ├── lib/               ← platform utilities
│   ├── db/                ← Prisma client
│   ├── styles/
│   ├── env.ts             ← validated environment
│   └── proxy.ts           ← Next.js 16 proxy (was middleware.ts)
├── tests/
│   └── e2e/
├── next.config.ts
├── tsconfig.json
├── eslint.config.mjs
├── postcss.config.mjs
├── AGENTS.md              ← managed by `next dev`; do not hand-edit the marked block
├── CLAUDE.md
└── package.json
```

We adopt `src/`. Next.js supports it, and it separates twelve config files at the repo root from the application itself. `proxy.ts` must sit beside `app/`, so it lives in `src/`, not at the repo root.

`@/*` maps to `./src/*` in `tsconfig.json`. Relative imports (`../../`) that cross a feature boundary are not allowed.

---

## 3. `src/app` — routes

```
src/app/
├── layout.tsx                  root layout: fonts, <html>, global providers
├── globals.css
├── not-found.tsx
├── global-error.tsx
│
├── (marketing)/                route group — public site
│   ├── layout.tsx              header, footer, PreviewBanner
│   ├── page.tsx                /
│   ├── work/
│   │   ├── page.tsx            /work
│   │   └── [slug]/page.tsx     /work/:slug
│   ├── contact/page.tsx
│   ├── [...slug]/page.tsx      CMS-managed pages (catch-all, last)
│   ├── sitemap.ts
│   ├── robots.ts
│   └── opengraph-image.tsx
│
├── admin/
│   ├── layout.tsx              auth guard + admin shell
│   ├── login/
│   │   ├── layout.tsx          bare layout (no admin chrome)
│   │   └── page.tsx
│   ├── page.tsx                dashboard
│   ├── pages/
│   │   ├── page.tsx
│   │   └── [id]/page.tsx
│   ├── case-studies/
│   ├── library/
│   │   ├── testimonials/
│   │   ├── partner-logos/
│   │   └── email-examples/
│   ├── media/
│   ├── submissions/
│   └── settings/
│
└── api/
    ├── preview/route.ts        GET  — enable Draft Mode
    ├── preview/exit/route.ts   POST — disable Draft Mode
    └── revalidate/route.ts     POST — secret-guarded external invalidation
```

Notes:

- **Route groups** `(marketing)` and the `admin` segment give the two surfaces independent layouts without affecting URLs.
- **The catch-all `[...slug]` is intentionally last.** Static segments win over dynamic ones, so `/contact` resolves to its own route while `/about` falls through to the CMS.
- **Route files stay thin.** A page composes, sets `<Suspense>` boundaries, and exports `generateMetadata`. It does not query, transform, or lay out.
- Use the generated `PageProps<'/work/[slug]'>` and `LayoutProps<'/…'>` helpers rather than hand-written prop types. Run `npx next typegen` after adding routes.
- `params` and `searchParams` are promises. Await them as deep in the tree as possible (see `CODING_STANDARDS.md` §6).

---

## 4. `src/features` — feature modules

A feature owns its components, its client-side state, its server actions, and its schemas.

```
src/features/
├── sections/                   public section components
│   ├── registry.tsx            SectionType → React component
│   ├── section-renderer.tsx
│   ├── rich-text/              node tree → React elements (never innerHTML)
│   ├── hero/
│   │   ├── hero.tsx
│   │   ├── hero-headline.tsx   (client, motion)
│   │   └── index.ts
│   ├── logo-strip/
│   ├── proof-metrics/
│   ├── email-gallery/
│   ├── case-study-feature/
│   ├── testimonial-grid/
│   ├── faq/
│   └── cta/
│
├── marketing/                  public chrome and shared marketing UI
│   ├── site-header/
│   ├── site-footer/
│   ├── preview-banner.tsx
│   └── contact-form/
│       ├── contact-form.tsx    (client)
│       ├── actions.ts          'use server'
│       └── schema.ts
│
└── admin/
    ├── shell/                  sidebar, topbar, page frame
    ├── auth/
    │   ├── login-form.tsx
    │   └── actions.ts
    ├── pages/
    │   ├── page-list.tsx
    │   ├── section-editor/
    │   │   ├── section-editor.tsx
    │   │   ├── section-list.tsx
    │   │   ├── section-form.tsx
    │   │   └── field-controls/
    │   └── actions.ts          save, reorder, publish, unpublish
    ├── case-studies/
    ├── media/
    │   ├── media-library.tsx
    │   ├── upload-dropzone.tsx
    │   └── actions.ts
    ├── submissions/
    └── settings/
```

Rules:

- `actions.ts` in a feature folder starts with `'use server'` and contains that feature's mutations only.
- Feature A does not import from feature B's internals. Shared code moves to `src/components/` or `src/lib/`.
- `src/features/admin/**` and `src/features/marketing|sections/**` never import each other.
- Section folders export a single public component through `index.ts`.

---

## 5. `src/server` — domain and data access

Every file here begins with `import 'server-only'`.

```
src/server/
├── auth/
│   ├── dal.ts              verifySession(), requireAdmin() — React.cache memoised
│   ├── session.ts          Supabase SSR client + cookie handling
│   └── supabase.ts         server client factories
│
├── content/
│   ├── queries.ts          cached public reads: getPublishedPage, getPublishedCaseStudy…
│   ├── resolvers.ts        cached, individually tagged: getTestimonials, getMediaAssets…
│   ├── admin-queries.ts    uncached admin reads (authorized)
│   ├── mutations.ts        write helpers used by feature actions
│   ├── publish.ts          publishPage(), unpublishPage(), assertReferencesResolvable()
│   ├── mappers.ts          Prisma row → plain domain object
│   ├── schemas/
│   │   ├── page.ts         pageContentSchema (the document)
│   │   ├── case-study.ts
│   │   ├── rich-text.ts    the constrained node tree (ADR-016)
│   │   ├── media.ts
│   │   └── settings.ts
│   └── sections/
│       ├── registry.ts     the section registry (no JSX)
│       ├── types.ts        SectionType union, derived from the registry
│       └── definitions/
│           ├── hero.ts
│           ├── logo-strip.ts
│           └── …
│
├── media/
│   ├── queries.ts
│   ├── upload.ts           signed URLs, finalize, sharp metadata
│   └── storage.ts          Supabase Storage wrapper
│
├── submissions/
│   ├── queries.ts
│   ├── mutations.ts
│   └── rate-limit.ts
│
├── mail/
│   ├── resend.ts           client
│   ├── send.ts             typed send helpers
│   └── templates/
│
└── cache/
    └── tags.ts             THE cache tag vocabulary — never inline a tag string
```

Why `queries.ts` and `admin-queries.ts` are separate files: public queries are wrapped in `'use cache'` and must never read `cookies()`. Admin queries call `requireAdmin()`, which reads `cookies()`, and must never be cached. Keeping them in separate modules makes the mistake hard to make and obvious in review.

---

## 6. `src/components` — shared UI

```
src/components/
├── ui/            shadcn/ui primitives (admin) — generated, then owned by us
├── primitives/    handcrafted public primitives: Container, Section, Prose, Eyebrow…
├── motion/        motion wrappers: FadeIn, StaggerChildren, ScrollReveal, Parallax
└── media/         Image wrappers bound to MediaAsset
```

Nothing here fetches data or imports from `src/server/**`. These are presentational, take props, and are reusable across both surfaces.

The `motion/` layer exists so that Framer Motion is called from a handful of files rather than sprinkled through the codebase. Every wrapper honours `prefers-reduced-motion`. Swapping or upgrading a motion library then touches one folder — which is also what makes ADR-015's "add GSAP later, with evidence" a cheap option rather than a rewrite.

---

## 7. `src/lib` and `src/db`

```
src/lib/
├── utils.ts        cn(), small pure helpers
├── logger.ts       structured logging wrapper
├── format.ts       number, currency, date formatting
├── seo.ts          metadata composition helpers
└── constants.ts    routes, breakpoints, motion durations

src/db/
└── prisma.ts       the only `new PrismaClient()` in the codebase
```

`src/lib` is for genuinely generic code. If a helper knows what a `CaseStudy` is, it belongs in `src/server/content/` instead.

---

## 8. `src/styles`

```
src/styles/
├── globals.css     Tailwind entry, @theme tokens, base layer
└── fonts.ts        next/font definitions
```

Tailwind v4 is configured in CSS via `@theme`, not a JS config file. Design tokens — type scale, spacing rhythm, colour, easing curves, durations — are defined once in `globals.css` and consumed as Tailwind utilities. Arbitrary values in components are a signal that a token is missing.

---

## 9. Naming

| Kind                  | Convention                | Example                |
| --------------------- | ------------------------- | ---------------------- |
| Directories           | kebab-case                | `case-study-feature/`  |
| React component files | kebab-case                | `section-editor.tsx`   |
| Components            | PascalCase                | `SectionEditor`        |
| Non-component modules | kebab-case                | `rate-limit.ts`        |
| Functions / variables | camelCase                 | `getPublishedPage`     |
| Types / interfaces    | PascalCase, no `I` prefix | `PublishedPage`        |
| Constants             | SCREAMING_SNAKE_CASE      | `MAX_UPLOAD_BYTES`     |
| Zod schemas           | camelCase + `Schema`      | `heroSectionSchema`    |
| Server action files   | `actions.ts`              | —                      |
| Route files           | Next.js conventions       | `page.tsx`, `route.ts` |

`index.ts` is used only to define a folder's public surface (barrel exports for a section or feature). It is never used to re-export half the codebase — that defeats tree-shaking and makes imports untraceable.

---

## 10. Import direction

Allowed (downward and sideways within a layer):

```
app/      → features/, components/, server/, lib/
features/ → components/, server/, lib/
server/   → db/, lib/, env
components/ → lib/
lib/      → (nothing internal)
```

Forbidden:

```
components/ → features/       (a primitive must not know about a feature)
components/ → server/         (presentational code has no data layer)
lib/        → server/, features/, app/
server/     → features/, app/, components/
features/admin/**  ↔  features/marketing/**, features/sections/**
any client component → server/   (only via Server Actions or props)
```

Where practical these are enforced with ESLint `no-restricted-imports`. Where not, they are enforced in review — and a violation is a blocking comment, not a nit.

---

## 11. Where things go — quick reference

| I am building…            | It goes in                                                                      |
| ------------------------- | ------------------------------------------------------------------------------- |
| A new public page section | `src/server/content/sections/definitions/` + `src/features/sections/<name>/`    |
| A new admin screen        | `src/app/admin/<route>/` + `src/features/admin/<feature>/`                      |
| A database query          | `src/server/<domain>/queries.ts`                                                |
| A mutation                | `src/features/<feature>/actions.ts`, calling `src/server/<domain>/mutations.ts` |
| A reusable button/card    | `src/components/primitives/` (public) or `src/components/ui/` (admin)           |
| An animation wrapper      | `src/components/motion/`                                                        |
| A cache tag               | `src/server/cache/tags.ts`                                                      |
| A Zod schema for content  | `src/server/content/schemas/`                                                   |
| A date/number formatter   | `src/lib/format.ts`                                                             |
| An environment variable   | `src/env.ts`                                                                    |
