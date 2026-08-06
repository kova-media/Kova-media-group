# Database

**Status:** Authoritative for schema shape and data access rules.
**Last reviewed:** 2026-08-06

---

## 1. Overview

Postgres, hosted on Supabase (project: _Kova Website_). Prisma is the **only** client that reads or writes application tables.

| Concern             | Owner                                                               |
| ------------------- | ------------------------------------------------------------------- |
| Schema definition   | `prisma/schema.prisma`                                              |
| Migrations          | Prisma Migrate                                                      |
| Application queries | Prisma Client, called only from `src/server/**`                     |
| Auth users          | Supabase Auth (`auth.users`) — we do not own or migrate this schema |
| Files               | Supabase Storage — we store metadata, not bytes                     |

---

## 2. Connections

Supabase exposes a pooled connection (Supavisor) and a direct connection. Serverless functions open and discard connections constantly, so the pooled URL is mandatory at runtime; Prisma Migrate needs the direct one because it issues statements the pooler cannot proxy.

> **Prisma 7 changed how this is wired** (we are on 7.9.1, not the 6.x this document originally assumed). The `datasource` block no longer takes `url` or `directUrl`, and `directUrl` does not exist at all. Instead:
>
> - **CLI and migrations** read `datasource.url` from `prisma.config.ts`, which is a real TypeScript file and does _not_ auto-load `.env` — it needs an explicit `import 'dotenv/config'`.
> - **The runtime client** connects through a **driver adapter** (`@prisma/adapter-pg`), which receives the connection string in code.
>
> This is arguably cleaner than 6.x: the split between "the CLI connects directly" and "the app connects through the pooler" is now explicit in two different files rather than implicit in one schema block.

```prisma
// prisma/schema.prisma — no url here in Prisma 7
datasource db {
  provider = "postgresql"
}
```

```ts
// prisma.config.ts — CLI/migrations use the DIRECT connection
export default defineConfig({
  datasource: { url: process.env['DIRECT_URL'] },
})
```

```ts
// src/db/prisma.ts — the app uses the POOLED connection
const adapter = new PrismaPg({ connectionString: env.DATABASE_URL })
new PrismaClient({ adapter })
```

| Variable       | Points at                    | Used by                                    |
| -------------- | ---------------------------- | ------------------------------------------ |
| `DATABASE_URL` | Supavisor transaction pooler | Prisma Client at runtime, via `PrismaPg`   |
| `DIRECT_URL`   | Direct Postgres              | `prisma migrate`, seed, introspection      |

Getting this wrong produces failures that only appear under load in production. Verify the exact connection string parameters (pooler port, `pgbouncer`/`connection_limit` flags) against Supabase's current documentation when wiring this up — the specifics have changed across Supabase releases (OD-1).

### 2.1 Client singleton

Next.js dev hot-reloads modules, which will exhaust the connection pool if a new `PrismaClient` is constructed each time. `src/db/prisma.ts` caches the instance on `globalThis` outside production and is the only place `new PrismaClient()` appears in the codebase.

### 2.2 Generated client location

Prisma 7's default generator is `prisma-client` (not `prisma-client-js`) and requires an explicit `output`. It generates to `src/generated/prisma`, which is **git-ignored** and rebuilt by a `postinstall` hook — generated code is a build artefact, not source.

---

## 3. Modelling conventions

| Rule            | Value                                                                                                                                                                                                                                    |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Model names     | `PascalCase`, singular (`CaseStudy`, not `case_studies`)                                                                                                                                                                                 |
| Field names     | `camelCase`, no `@map`. Prisma is the only client (ADR-004), so snake_case mapping would add an annotation to every field and buy nothing. Raw SQL quotes identifiers: `"Page"."publishedAt"`                                            |
| Primary keys    | `String @id @default(cuid())` — opaque, sortable enough, safe in URLs                                                                                                                                                                    |
| Timestamps      | Every table has `createdAt` and `updatedAt`                                                                                                                                                                                              |
| Deletes         | Soft-delete only where recovery matters (`MediaAsset`); hard delete for personal data (`ContactSubmission`) and everything else                                                                                                          |
| Money / metrics | Avoid `Decimal` columns. Display figures live in JSON documents as numbers. If a `Decimal` column ever becomes necessary, it **must** be mapped before crossing a cached boundary (see §6)                                               |
| Enums           | Postgres enums only for closed sets the application branches on in SQL (`SubmissionStatus`). Content-shape unions (section types, metric units) are TypeScript unions owned by the registry — changing them must not require a migration |
| JSON            | `Json` columns only where the shape is owned by a Zod schema (content documents, revisions, settings)                                                                                                                                    |

Every foreign key gets an index. Every column used in a `where` or `orderBy` on a hot path gets an index. We add them when the query is written, not after a slow-query report.

---

## 4. Schema

This is the intended V1 shape. It is a specification, not generated output — the real `schema.prisma` is written in Phase 1 and this document is updated alongside it.

### 4.1 Identity

```prisma
model AdminUser {
  id           String    @id @default(cuid())
  supabaseId   String    @unique          // auth.users.id
  email        String    @unique
  name         String
  isActive     Boolean   @default(true)
  lastLoginAt  DateTime?
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
}
```

Supabase owns credentials; this table owns _authorization_. `requireAdmin()` resolves the Supabase user id to an active row here. Deactivating an admin is a single boolean flip and takes effect on the next request.

### 4.2 Pages

Content is a **Zod-validated JSON document**, not normalised section rows. See ADR-012 for why this replaced the earlier snapshot design.

```prisma
model Page {
  id               String    @id @default(cuid())
  slug             String    @unique          // "home", "about", "contact"
  title            String                     // internal label for the admin
  isSystem         Boolean   @default(false)  // system pages cannot be deleted

  draftContent     Json      @default("{\"sections\":[]}")  // what the admin edits
  publishedContent Json?                                     // what the public sees
  publishedAt      DateTime?
  publishedBy      String?

  draftVersion     Int       @default(0)      // optimistic concurrency for autosave

  seoTitle         String?
  seoDescription   String?
  seoImageId       String?
  seoNoIndex       Boolean   @default(false)

  revisions        ContentRevision[]

  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt

  @@index([publishedAt])
}
```

**`publishedContent != null` is the single source of truth for "is this page live?"** There is deliberately no `status` enum — two sources of truth for liveness is a bug factory. The admin's badge (_Draft_ / _Live_ / _Live, with unpublished changes_) is derived:

| Condition                                                    | Admin shows               |
| ------------------------------------------------------------ | ------------------------- |
| `publishedContent` is null, never published                  | Draft                     |
| `publishedContent` is null, `publishedAt` was set previously | Unpublished               |
| `publishedContent` set, `updatedAt <= publishedAt`           | Live                      |
| `publishedContent` set, `updatedAt > publishedAt`            | Live, unpublished changes |

The document shape, owned by `pageContentSchema`:

```ts
{
  sections: Array<{
    id: string // stable uuid, generated client-side on add
    type: SectionType // TypeScript union — not a Postgres enum
    isEnabled: boolean
    data: unknown // validated against the schema registered for `type`
  }>
}
```

Array order **is** section order. There is no `position` column to renumber. Sections reference other entities by id (`{ testimonialIds: [...] }`, `{ mediaId: "..." }`); the renderer resolves those through separately cached functions, so a typo fix in a testimonial or an alt-text correction goes live everywhere without republishing.

`draftVersion` guards autosave: the editor sends the version it loaded, the action increments on write, and a mismatch returns a conflict rather than silently clobbering a newer edit from another tab.

### 4.3 Revisions

```prisma
model ContentRevision {
  id          String   @id @default(cuid())
  entityType  String              // "page" | "caseStudy"
  entityId    String
  page        Page?    @relation(fields: [entityId], references: [id], onDelete: Cascade, map: "revision_page_fk")
  content     Json                // copy of the document at publish time
  action      String              // "published" | "unpublished"
  createdAt   DateTime @default(now())
  createdBy   String

  @@index([entityType, entityId, createdAt(sort: Desc)])
}
```

Append-only, never read on the public path, no UI in V1. It exists so that a bad edit is recoverable and so that "who changed what, when" is answerable. Rollback is copying `content` back into `draftContent` and republishing.

### 4.4 Case studies

Same document model. Metrics live **inside** the document rather than in their own table — they are always rendered with their case study, never queried independently, and a separate table bought a join and an extra admin sub-form for nothing.

```prisma
model CaseStudy {
  id               String   @id @default(cuid())
  slug             String   @unique
  clientName       String
  clientLogoId     String?
  headline         String
  summary          String
  industry         String?
  isFeatured       Boolean  @default(false)
  position         Int      @default(0)
  heroImageId      String?

  draftContent     Json     @default("{\"sections\":[],\"metrics\":[]}")
  publishedContent Json?
  publishedAt      DateTime?
  publishedBy      String?
  draftVersion     Int      @default(0)

  seoTitle         String?
  seoDescription   String?

  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  @@index([publishedAt, isFeatured, position])
}
```

Metrics inside the document keep their structure — `{ label, value, unit, timeframe }` with `unit` a TypeScript union of `PERCENT | CURRENCY_USD | MULTIPLIER | ABSOLUTE` — so they still render consistently and animate on scroll. **`value` is a number in JSON, not a Postgres `Decimal`**, which conveniently sidesteps the serialization constraint in §6. These are display figures rounded to two decimals, never summed or reconciled; float precision is not a concern here. If we ever need to aggregate metrics across case studies for homepage proof points, that is the moment to promote them to a table — and the trigger is written down rather than guessed at now.

### 4.5 Content library

Entities referenced _by_ sections, by id. They are resolved at render time through individually cached, individually tagged functions — so editing one updates every page showing it without a republish.

```prisma
model Testimonial {
  id           String   @id @default(cuid())
  quote        String
  authorName   String
  authorRole   String?
  companyName  String
  companyLogoId String?
  avatarId     String?
  caseStudyId  String?              // optional link to a full case study
  isPublished  Boolean  @default(false)
  position     Int      @default(0)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@index([isPublished, position])
}

model PartnerLogo {
  id          String   @id @default(cuid())
  name        String
  mediaId     String
  href        String?
  isPublished Boolean  @default(false)
  position    Int      @default(0)

  @@index([isPublished, position])
}

model EmailExample {
  id          String   @id @default(cuid())
  title       String
  clientName  String?
  mediaId     String              // the email design render
  category    String?             // "Welcome flow", "Abandoned cart", …
  caseStudyId String?
  isPublished Boolean  @default(false)
  position    Int      @default(0)

  @@index([isPublished, position])
}
```

### 4.6 Media

```prisma
model MediaAsset {
  id           String    @id @default(cuid())
  storagePath  String    @unique          // path within the Supabase Storage bucket
  url          String                     // public URL
  filename     String
  mimeType     String
  byteSize     Int
  width        Int?
  height       Int?
  blurDataURL  String?                    // base64 LQIP for next/image
  alt          String    @default("")
  caption      String?
  folder       String?                    // flat, optional grouping
  uploadedBy   String
  deletedAt    DateTime?                  // soft delete
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  @@index([deletedAt, createdAt(sort: Desc)])
  @@index([folder])
}
```

`width`, `height`, and `blurDataURL` are non-negotiable for the CLS budget in `ARCHITECTURE.md` §12. They are derived server-side after upload, not trusted from the client.

Deleting a media asset is a soft delete. Hard deletion of the underlying object is a separate, explicit admin operation that first reports which publications reference it.

### 4.7 Site settings

```prisma
model SiteSettings {
  id               String   @id @default("singleton")
  siteName         String
  defaultSeoTitle  String
  defaultSeoDescription String
  defaultSeoImageId String?
  contactEmail     String
  bookingUrl       String?
  socialLinks      Json     @default("[]")
  navigation       Json     @default("[]")
  footer           Json     @default("{}")
  updatedAt        DateTime @updatedAt
}
```

A single row with a fixed id. Enforced by `upsert` in the DAL and a check constraint added in the migration.

### 4.8 Contact submissions

```prisma
model ContactSubmission {
  id             String   @id @default(cuid())
  name           String
  email          String
  company        String?
  websiteUrl     String?
  monthlyRevenue String?             // banded select, not a free number
  message        String
  source         String?             // page path the form was submitted from
  status         SubmissionStatus @default(NEW)
  adminNotes     String?
  notifiedAt     DateTime?           // when the Resend notification succeeded
  ipHash         String?             // salted hash, for rate limiting — not raw IP
  userAgent      String?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  @@index([status, createdAt(sort: Desc)])
  @@index([ipHash, createdAt])
}

enum SubmissionStatus {
  NEW
  READ
  REPLIED
  BOOKED
  ARCHIVED
  SPAM
}
```

`notifiedAt` makes email delivery auditable: a null value on an old row means the notification never went out, which the admin dashboard surfaces.

**No `deletedAt`.** These rows contain personal data, and under ADR-018 deletion means deletion. `ARCHIVED` covers the admin's "dealt with" case; removal is a hard delete. A scheduled job hard-deletes rows older than 24 months.

The IP is stored as a hash salted with a secret env var (`IP_HASH_SALT`), never as a constant — an unsalted hash of an IPv4 address is trivially reversible by enumeration, which would defeat the entire point of not storing the address.

### 4.9 Rate limiting

```prisma
model RateLimitEntry {
  id        String   @id @default(cuid())
  bucket    String            // "contact" | "login"
  key       String            // ipHash
  createdAt DateTime @default(now())

  @@index([bucket, key, createdAt])
}
```

Per ADR-019: a windowed count against this table, no external KV service. Rows older than the longest window are pruned by the same scheduled job that enforces submission retention.

---

## 5. Migrations

```bash
npx prisma migrate dev --name <descriptive_name>   # local: create + apply
npx prisma migrate deploy                          # CI/production: apply only
npx prisma generate                                # after any schema change
```

Rules:

1. **Every schema change is a committed migration.** `prisma db push` is for local scratch work only and never touches a shared database.
2. Migration names describe intent: `add_case_study_metrics`, not `update_schema`.
3. Destructive migrations (drop column, narrow a type) are split into an expand phase and a contract phase across two deploys, so a rollback never loses data.
4. Migrations run in CI **before** the Vercel deploy is promoted.
5. Generated SQL is reviewed before merge. Prisma occasionally produces a rewrite where an `ALTER` would do.

---

## 6. Data access rules

All queries live in `src/server/**`. Callers receive domain types, not Prisma types.

```
Route/Action  →  DAL (src/server/content/queries.ts)
                   ├─ authorize (admin paths)
                   ├─ prisma.…
                   └─ mapper: Prisma row → plain domain object
```

Three rules that carry real weight:

**1. Cached functions must return plain objects.** `'use cache'` serializes return values and rejects class instances, and Prisma's `Decimal` is a class instance. Since ADR-012 moved content into JSON documents, most reads are already plain — the mapper layer is correspondingly thin, and its job is now mainly explicit field selection and parsing the JSON document through its Zod schema. It is still mandatory: a future `Decimal` or `Prisma.JsonValue` leaking into a cached return is a **runtime** error that can pass `next build` and only fail under `next start`.

**2. Select explicitly.** Use `select` on any query whose result crosses a trust boundary. Never spread a whole row into a response or a snapshot.

**3. Multi-row writes are transactions.** Publishing, reordering sections, and deleting a page with its sections all use `prisma.$transaction`. Partial writes in a CMS are corrupted content.

---

## 7. Row Level Security

Prisma connects with a privileged role, so RLS does not constrain our own queries. We enable it anyway:

- RLS **enabled** on every application table.
- **No permissive policies.** The `anon` and `authenticated` roles get nothing.
- Consequence: if the Supabase anon key leaks, or a Client Component ever instantiates a Supabase client and queries a table, it reads zero rows.

This is cheap, invisible in normal operation, and eliminates an entire class of accidental exposure. Supabase Storage buckets get their own policies: the media bucket is public-read for delivery, and writes are only possible via server-issued signed upload URLs.

---

## 8. Seeding

`prisma/seed.ts` produces a working site from an empty database:

- One `AdminUser` linked to a Supabase user created by the seed script.
- `SiteSettings` singleton.
- System pages (`home`, `contact`) with a representative section arrangement.
- A small set of realistic case studies, testimonials, and partner logos.

The seed must be idempotent (`upsert` throughout) and must never run against production. It is what makes preview environments and a fresh clone useful within minutes.

---

## 9. Backup and recovery

- Supabase automated daily backups on the production project; point-in-time recovery enabled before launch.
- `ContentRevision` rows are append-only, so a bad content edit is recoverable without a database restore.
- **Supabase Storage is not covered by database backups.** Media objects need their own backup — a scheduled sync of the media bucket to separate storage. This is easy to overlook precisely because the `MediaAsset` rows _are_ backed up, which makes a restore look complete while every image 404s. Scheduled in Phase 6.
- Before any destructive migration, take a manual snapshot and note it in the PR.
- Recovery is exercised once, against the preview project, before launch — **including media**. An untested restore is not a backup.

---

## 10. Scale, honestly

Realistic steady state: fewer than 20 pages, perhaps 30 case studies, one administrator, and traffic in the low tens of thousands of visits per month. Nothing in this schema is near a scale limit, and nothing in it should be designed as though it were.

This matters because it changes what "good" means here. The risks worth engineering against are **cost of change** and **cost of being wrong**, not throughput. A query that scans every page row to find media usage is correct at this size and will stay correct for years. Adding machinery to avoid that scan would be the mistake — it was, in fact, the mistake ADR-012 corrected.

Any future proposal justified by "this won't scale" needs a number attached to it.

---

## 11. Open questions

| Question                                                        | Owner       | Resolve by |
| --------------------------------------------------------------- | ----------- | ---------- |
| Exact Supabase pooler connection parameters for Prisma 6 (OD-1) | Engineering | Phase 1    |

Resolutions are recorded in `docs/DECISIONS.md`.
