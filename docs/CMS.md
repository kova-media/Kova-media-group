# CMS

**Status:** Authoritative for the content model and editorial workflow.
**Last reviewed:** 2026-08-26

---

## 1. Philosophy

The owner should not need VS Code after launch. The site should also never look like it was assembled in a page builder. Those two goals conflict unless the system is designed carefully, so this is the governing principle:

> **The admin controls content and composition. Engineering controls design.**

An editor can change every word, image, logo, testimonial, metric, and SEO field. They can reorder, enable, and disable sections. They **cannot** change spacing, typography, colour, breakpoints, or animation — because those are what make the site feel handcrafted, and they are the first things to degrade when exposed as knobs.

Practically:

| Editor can                            | Editor cannot                        |
| ------------------------------------- | ------------------------------------ |
| Edit copy, images, links, metrics     | Change fonts, colours, spacing       |
| Reorder sections on a page            | Invent a new section layout          |
| Enable / disable a section            | Nest arbitrary blocks                |
| Add case studies, testimonials, logos | Add custom CSS or HTML               |
| Set SEO fields per page               | Change URL structure of system pages |
| Preview and publish                   | Bypass validation                    |

Every editable field is a deliberate decision made by engineering. When the editor needs something new, the answer is a new section type or a new field — added in code, reviewed, and shipped. This is a feature. It is how the site stays at the quality bar in `ARCHITECTURE.md` §2 three years from now.

---

## 2. Content entities

| Entity              | Purpose                                                    | Publishable                    |
| ------------------- | ---------------------------------------------------------- | ------------------------------ |
| `Page`              | A URL with an ordered list of sections                     | Yes (draft/published document) |
| `CaseStudy`         | Long-form client story with structured metrics             | Yes (draft/published document) |
| `Testimonial`       | Reusable quote, referenced by sections                     | Simple flag                    |
| `PartnerLogo`       | Client/partner mark for logo strips                        | Simple flag                    |
| `EmailExample`      | A real email design, shown in galleries                    | Simple flag                    |
| `MediaAsset`        | An uploaded file and its derived metadata                  | n/a                            |
| `SiteSettings`      | Nav, header CTA, footer content, defaults, contact details | Immediate                      |
| `ContactSubmission` | Inbound lead                                               | n/a (read-only)                |

Publishable entities carry two content documents: `draftContent` (edited) and `publishedContent` (served). "Simple flag" entities have an `isPublished` boolean and are referenced by id from within those documents.

**The resulting model, stated plainly: page composition is versioned; library content is live.** Publishing a page freezes its structure and its own copy. It does not freeze the testimonials, logos, or images it points at — fixing a typo in a quote or an image's alt text updates every page showing it, immediately, with no republish. This is a deliberate choice (ADR-012) and it is the behaviour an editor actually expects.

Schema detail lives in `docs/DATABASE.md` §4.

---

## 3. The section system

### 3.1 Shape

A page's content is one JSON document containing an ordered array of sections:

```ts
{
  sections: Array<{
    id: string // stable uuid, generated when the section is added
    type: SectionType // TypeScript union member
    isEnabled: boolean
    data: unknown // validated against the Zod schema registered for `type`
  }>
}
```

Array order is section order — there is no `position` field to renumber. The document is only ever read or written through its Zod schema; nothing in the codebase touches raw section JSON.

`SectionType` is a **TypeScript union derived from the registry**, not a Postgres enum. This is deliberate: adding a section type must not require a database migration (ADR-012).

### 3.2 The registry

One module is the single source of truth for what a section type is:

```
src/server/content/sections/
  registry.ts          ← the map; the only file that knows every type
  types.ts             ← SectionType union, shared TS types
  definitions/
    hero.ts            ← schema + defaults + metadata for the hero section
    logo-strip.ts
    proof-metrics.ts
    …
```

Each definition exports:

```ts
export const heroSection = defineSection({
  type: 'HERO',
  label: 'Hero',
  description: 'Full-width opening statement with a primary call to action.',
  schema: heroSchema,                 // Zod
  defaults: { … },                    // used when the editor adds the section
  allowedOn: ['home', 'any'],         // optional constraint
  maxPerPage: 1,                      // optional constraint
})
```

The registry is consumed in three places, and they cannot drift because they all read the same object:

| Consumer        | Uses                                                              |
| --------------- | ----------------------------------------------------------------- |
| Admin editor    | `label`, `description`, `schema` (to render the form), `defaults` |
| Server actions  | `schema` (to validate before write)                               |
| Public renderer | `type` → React component                                          |

The React component is registered separately, in `src/features/sections/registry.tsx`, because the server-side registry must remain importable from contexts that should not pull in JSX. A build-time type check asserts that every `SectionType` has both a definition and a component.

### 3.3 Rendering

```tsx
// src/features/sections/section-renderer.tsx
export function SectionRenderer({ sections }: { sections: PublishedSection[] }) {
  return sections.map((section) => {
    const Component = sectionComponents[section.type]
    if (!Component) return null // forward-compatible: unknown types are skipped
    return <Component key={section.id} {...section.data} />
  })
}
```

Unknown types render nothing rather than crashing. A published document referencing a since-removed section type degrades gracefully instead of taking the page down.

### 3.4 Adding a section type

For a designed marketing band:

1. Build the component in `src/features/marketing/**`. It takes its content as
   props and renders nothing when it has none.
2. Add the type to `SECTION_TYPES` and a definition to
   `sections/marketing-definitions.ts` (schema, publish schema, defaults, group).
3. Map the type to the component in `features/marketing/marketing-sections.tsx`.
4. Write its admin form in `admin/pages/section-editor/marketing-forms.tsx` and
   add the case to `section-form.tsx`.

Four steps, no migration, all in code, all reviewed. The friction that protects design quality is **having to write a component** — a designed layout cannot be conjured from the admin. An enum migration added ceremony without adding safety, so it is gone.

Forms are hand-written rather than derived from the schema. A generated form is a key/value editor, and these are the screens the owner opens every week: field order, wording and hints are the difference between a CMS someone uses and one they avoid.

### 3.5 The section catalogue

Two groups, and the split matters.

**Marketing sections** are the designed bands of the public site. Each one is a
component in `src/features/marketing/**` that a designer wrote; the section type
is that component's _content_ and nothing else. They are defined in
`sections/marketing-definitions.ts`, edited through the hand-written forms in
`admin/pages/section-editor/marketing-forms.tsx`, and rendered by the single
mapping in `features/marketing/marketing-sections.tsx`.

| Type                | The band it fills                                                |
| ------------------- | ---------------------------------------------------------------- |
| `PAGE_HEADER`       | Interior-page masthead: label, headline, intro                   |
| `HOME_HERO`         | The homepage opening — animated headline, paragraph, two buttons |
| `CLIENT_MARQUEE`    | The scrolling row of client names                                |
| `METRICS_BAND`      | A headline over a row of figures. Absent while it holds none     |
| `SERVICES_OVERVIEW` | The channels as ruled rows, pointing at the services page        |
| `WORK_INDEX`        | Featured case studies as a ruled list                            |
| `PROCESS_STEPS`     | Engagement steps beside the automation diagram (homepage)        |
| `PROCESS_DETAIL`    | The full step list with a sticky diagram column                  |
| `STATEMENT`         | One paragraph set large, alone, with an optional button          |
| `TESTIMONIALS`      | Quotes from the library. Absent while there are none             |
| `FINAL_CTA`         | The full-bleed navy closing band                                 |
| `VALUES`            | A standing statement beside a ruled list of beliefs              |
| `SERVICES_LIST`     | Each service given a full band                                   |
| `SERVICES_CLOSING`  | A short label beside a large statement, under a teal rule        |
| `CASE_STUDY_LIST`   | Every published study as a numbered index                        |
| `CONTACT_INTRO`     | Contact copy and details, with the enquiry form beside it        |
| `BOOK_DETAILS`      | What to expect from the call, beside the scheduler               |

**Utility sections** are the original generic catalogue, used by the legal and
utility pages that render through the `[...slug]` catch-all.

| Type                                             | Role                                  |
| ------------------------------------------------ | ------------------------------------- |
| `HERO`, `LOGO_STRIP`, `PROOF_METRICS`            | Generic opening, credibility, numbers |
| `NARRATIVE`, `SERVICE_DETAIL`, `PARTNERSHIP`     | Prose and outcome lists               |
| `EMAIL_GALLERY`, `TESTIMONIAL_*`, `CASE_STUDY_*` | Library-driven blocks                 |
| `FAQ`, `CTA`, `RICH_TEXT`                        | Questions, the ask, and legal prose   |

`FAQ` is shared: the homepage's accordion and the `/faq` page read the same
section type, flattening its rich-text answers to paragraphs.

Notably absent, per the design brief: process diagrams as content, fake
dashboards, generic feature grids, pricing tables.

### 3.6 The designed marketing pages

`/`, `/about`, `/services`, `/process`, `/case-studies`, `/contact` and `/book`
are real route files **and** CMS pages. The route reads its `Page` row by slug
and hands the sections to `MarketingSections`; it holds no copy of its own.

Their default documents live in `src/server/content/blueprints.ts` and are the
floor the site renders from when the database has nothing — a fresh clone or a
new preview environment still shows a complete site. `prisma/seed-content.ts`
promotes them into the CMS; from that point the database is authoritative and
the seed is a no-op. It never overwrites a page whose document already contains
marketing sections, so an edit made in the admin always survives a re-run.

These pages are `isSystem`, so their slugs cannot be changed from the admin: the
slug is wired to a route file and changing it would 404 the page.

### 3.7 Section data references other entities by id

A `TESTIMONIAL_GRID` section stores `{ testimonialIds: string[] }`, not copies of the quotes. A media field stores `{ mediaId }`, not a resolved URL. The renderer resolves these through separately cached, separately tagged functions:

```
getPublishedPage(slug)        → cacheTag('page:home')
  └─ getTestimonials(ids)     → cacheTag('testimonial:<id>') each
  └─ getMediaAssets(ids)      → cacheTag('media:<id>') each
```

Each resolver is its own cache entry with its own tag, so editing one testimonial invalidates that testimonial — not every page that shows it. On a cache hit the whole page still costs zero database reads.

### 3.8 Rich text

`RICH_TEXT` stores a **structured node tree**, not HTML:

```ts
{ type: 'paragraph', children: [{ type: 'text', text: 'Hello', bold: true }] }
```

Validated by Zod, rendered by mapping nodes to React elements. `dangerouslySetInnerHTML` appears nowhere in this codebase and is blocked by an ESLint rule. Link `href` values are validated against an allowlist of schemes (`https:`, `mailto:`, relative paths).

This is a security requirement, not a preference: ADR-013 permits `'unsafe-inline'` in the public CSP specifically _because_ no user-supplied HTML is ever rendered. It also happens to give us full typographic control over prose, which the design brief demands anyway.

---

## 4. Draft and publish

### 4.1 The model

```
     draftContent                      publishedContent
  ──────────────────                ────────────────────
  Edited freely, autosaved   ──►    Written only by publish
  Read by admin + preview           Read by the public site
```

Two columns on the same row. Editing a live page never affects the live page; publishing is the only thing that does.

### 4.2 Liveness

`publishedContent != null` is the **single source of truth** for whether a page is live. There is no status enum to fall out of sync with it. The admin's badge is derived — see `DATABASE.md` §4.2 for the derivation table.

### 4.3 The publish action

```ts
// src/features/admin/pages/actions.ts  (sketch — not implementation)
export async function publishPage(pageId: string) {
  const admin = await requireAdmin()

  const page = await getPageForEdit(pageId)
  const content = pageContentSchema.parse(page.draftContent) // fail loudly before going live
  await assertReferencesResolvable(content) // media/testimonials still exist

  const published = await prisma.$transaction(async (tx) => {
    const updated = await tx.page.update({
      where: { id: pageId },
      data: {
        publishedContent: content,
        publishedAt: new Date(),
        publishedBy: admin.id,
      },
    })
    await tx.contentRevision.create({
      data: {
        entityType: 'page',
        entityId: pageId,
        content,
        action: 'published',
        createdBy: admin.id,
      },
    })
    return updated
  })

  updateTag(cacheTags.page(published.slug))
  updateTag(cacheTags.pagesIndex)
  return { ok: true }
}
```

What matters here:

1. **Authorize, then validate, then write.** In that order, always.
2. **Validate the document before it goes live**, and check that its references still resolve. A section pointing at a deleted image fails the publish with a message naming the section, rather than shipping a hole in the page.
3. **One transaction** covering the publish and its revision record.
4. **`updateTag`, not `revalidateTag`.** The admin clicks publish and then clicks "view site"; they must see their own change. `updateTag` is Server-Action-only and gives read-your-writes semantics. (`revalidateTag` also requires a cacheLife argument in Next.js 16 — `revalidateTag(tag, 'max')`.) The cost is that the next public visitor blocks on a re-render instead of receiving stale content — negligible at this traffic level, and the correct trade for an editor who needs to trust the publish button.

Unpublishing sets `publishedContent` to null, records a revision, and invalidates the same tags. Revisions are retained either way.

There is **no snapshot builder**. That module was the most complex piece of the original design, and ADR-012 removed the need for it.

---

## 5. Preview

Preview uses Next.js **Draft Mode**. When enabled, Next.js sets the `__prerender_bypass` cookie, and every `'use cache'` scope re-executes and skips writing to the cache for that request. Other visitors keep getting the cached published page.

```
Admin clicks "Preview"
  └─ opens /api/preview?secret=…&slug=… in a new tab
       ├─ verify secret                     (constant-time compare)
       ├─ verify the admin session
       ├─ look up the page by slug in the database
       ├─ 401 if either check fails
       ├─ draftMode().enable()
       └─ redirect(page.slug)   ← the slug from the DB row, never from the query string
```

Redirecting to the _fetched_ slug rather than the raw parameter is an open-redirect defence called out explicitly in the Next.js Draft Mode guide. We follow it.

The preview render path:

```tsx
// src/app/(marketing)/[...slug]/page.tsx  (sketch)
const { isEnabled } = await draftMode()
const page = isEnabled
  ? await getDraftPage(slug) // NOT cached — reads draftContent
  : await getPublishedPage(slug) // 'use cache' + cacheTag + cacheLife('max')
```

Both branches produce the same `PublishedPage` shape and feed the same `SectionRenderer`. **There is exactly one rendering path.** Preview showing something different from production is a class of bug we design out rather than test for.

A `PreviewBanner` in the marketing layout reads `draftMode().isEnabled` and renders a persistent indicator with an exit control. The exit is a `<form>` posting to a Server Action — not a `<Link>`, because Next.js prefetches links and would clear the cookie before the admin clicked.

Constraints inherited from the framework, worth remembering:

- `draftMode().enable()` / `.disable()` cannot be called inside a `'use cache'` scope. Only Route Handlers and Server Actions may toggle it.
- `isEnabled` _can_ be read inside a cache scope; `cookies()` and `headers()` cannot.

---

## 6. Validation

Zod schemas are the contract, defined once and used everywhere:

```
src/server/content/schemas/
  page.ts               pageSchema, publishedPageSchema
  case-study.ts
  media.ts
  settings.ts
  contact.ts
  sections/…            one per section type, co-located with its definition
```

| Boundary            | What is validated                                                                                                                                                                                                                                                            |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Admin form submit   | Section data against its registered schema                                                                                                                                                                                                                                   |
| Server Action entry | The full action input                                                                                                                                                                                                                                                        |
| Publish             | The whole content document, plus reference resolvability                                                                                                                                                                                                                     |
| Public read         | Parsed through the document schema on every read. It is one `safeParse` of a few kilobytes inside an already-cached function — effectively free, and it turns "a section type was renamed and old documents no longer match" into a caught error rather than a broken render |
| Contact form        | Both client-side (UX) and server-side (truth)                                                                                                                                                                                                                                |

Unknown section types encountered on parse are dropped with a logged warning rather than failing the page (see §3.3).

Types are inferred from schemas (`z.infer`). We never hand-write a type that duplicates a schema — they drift.

---

## 7. Media library

### 7.1 Upload flow

Vercel's request body limit makes proxying uploads through our server impractical, so files go directly to Supabase Storage and we record metadata afterwards.

```
1. Admin selects files in the media library
2. Server Action  requestUpload(filename, mimeType, byteSize)
     ├─ requireAdmin()
     ├─ reject disallowed MIME types and oversized files
     └─ returns { signedUrl, storagePath }
3. Browser PUTs the file directly to Supabase Storage
4. Server Action  finalizeUpload(storagePath)
     ├─ fetch the object server-side
     ├─ sharp → width, height, real MIME, blur placeholder
     ├─ reject if the real content type disagrees with the claim
     ├─ create MediaAsset
     └─ updateTag(cacheTags.mediaIndex)
```

Dimensions and MIME type are derived on the server, never trusted from the client. A file claiming to be a PNG that is not one is rejected at step 4.

### 7.2 Storage layout

```
media/
  YYYY/MM/<cuid>-<slugified-filename>.<ext>
```

Content-addressed enough to avoid collisions, human-readable enough to debug. Paths are stable; we never rename an object after upload.

### 7.3 Rendering

Every image renders through `next/image` with `width`, `height`, `placeholder="blur"`, and `blurDataURL` from the `MediaAsset` row. `alt` comes from the asset, overridable per usage where a section needs different context. Decorative images get `alt=""` explicitly — never omitted.

The Supabase Storage host must be listed in `next.config.ts` under `images.remotePatterns`.

### 7.4 Deletion

Soft delete by default (`deletedAt`), which hides the asset from the picker while leaving existing references working.

Before hard deletion, the admin is shown every page and case study whose published document references the asset. At our content volume this is a scan of well under a hundred rows — no index required, no usage table to keep in sync. Hard deletion of a referenced asset is blocked, not merely warned about: a broken image on a published page is not a recoverable mistake for a site whose job is to look expensive.

### 7.5 Orphaned objects

The two-step upload can leave an object in Storage with no `MediaAsset` row if the browser dies between steps. A weekly reconciliation job lists bucket objects with no matching row, older than 24 hours, and deletes them. Small, contained, and worth doing rather than accumulating mystery storage cost.

### 7.6 Limits

Enforced server-side, in `requestUpload` and again in `finalizeUpload`:

| Constraint    | Value                                                                                                                 |
| ------------- | --------------------------------------------------------------------------------------------------------------------- |
| Allowed types | `image/jpeg`, `image/png`, `image/webp`, `image/avif`, `image/svg+xml`, `application/pdf`                             |
| Max size      | 15 MB                                                                                                                 |
| SVG handling  | Sanitised server-side before storage — SVG is executable content and must never be served unsanitised from our origin |

---

## 8. SEO

Per-entity fields (`seoTitle`, `seoDescription`, `seoImageId`, `seoNoIndex`), falling back to `SiteSettings` defaults. Resolved into `generateMetadata` in the route.

- `sitemap.ts` reads published slugs through a cached function tagged `pages:index` and `case-studies:index`.
- `robots.ts` disallows `/admin` and `/api`.
- OG images: an uploaded `seoImage` when present, otherwise a generated image via the `opengraph-image` file convention. Note that in Next.js 16 the image-generating function receives `params` and `id` as **promises**.
- JSON-LD `Organization` and `WebSite` on the homepage; `Article`-style structured data on case studies.
- `seoNoIndex` sets `robots: { index: false }` and is used for utility pages.

---

## 9. Contact submissions

Read-only in the admin, with status transitions (`NEW → READ → REPLIED → BOOKED`) and private notes.

Submission handling, in order:

1. Honeypot field must be empty.
2. Time-to-submit must exceed a small threshold.
3. Per-IP-hash rate limit.
4. Zod validation.
5. Persist `ContactSubmission`.
6. Send the Resend notification; on success set `notifiedAt`.
7. Return success to the user.

Step 5 completes before step 6. **An email failure must never lose a lead** — the record exists, the admin dashboard flags un-notified submissions, and the form still returns success to the prospect.

---

## 10. Admin information architecture

Desktop-first. shadcn/ui throughout (see `DECISIONS.md` ADR-008 — the public site does not use it).

```
/admin
  /login
  /                     Dashboard: new submissions, unpublished changes, recent activity
  /pages                List, status, "has unpublished changes"
  /pages/[id]           Section editor: reorder, toggle, edit, preview, publish
  /case-studies         List
  /case-studies/[id]    Editor
  /library
    /testimonials
    /partner-logos
    /email-examples
  /media                Grid, upload, alt-text editing, usage
  /submissions          Inbox
  /submissions/[id]     Detail, status, notes
  /settings             Site name, logos, contact, booking link, navigation,
                        header CTA, footer columns and copy, SEO defaults
```

Editor behaviour that matters:

- **Autosave `draftContent`** on a debounce, sending `draftVersion` so a stale tab conflicts rather than clobbers. Losing work is unacceptable; publishing is the deliberate act, so autosaving drafts is safe.
- **Explicit publish.** Never automatic.
- **Preview opens in a new tab**, so the editor keeps their place.
- **Unsaved-changes guard** on navigation.
- **Reordering** is drag-and-drop within the fixed section list — reordering existing sections, not composing new layouts.

---

## 11. Content migration from the current site

Before launch, real content is entered through the admin — not scripted into the database. This is the acceptance test for the CMS: if entering the real homepage through the admin is painful, the CMS is wrong, and it is far cheaper to learn that in Phase 5 than in month six.

Assets (client logos, email designs, Klaviyo screenshots, case study photography) are collected and uploaded through the media library as part of the same exercise.
