# Kova Media Group — Project Documentation

The source of truth for this application's architecture. If code and these documents disagree, one of them is a bug — decide which, then fix it.

## Read in this order

| #   | Document                                     | Covers                                                          |
| --- | -------------------------------------------- | --------------------------------------------------------------- |
| 1   | [ARCHITECTURE.md](./ARCHITECTURE.md)         | System shape, rendering model, caching, auth, security, budgets |
| 2   | [DATABASE.md](./DATABASE.md)                 | Schema, Prisma, connections, migrations, RLS, backups           |
| 3   | [CMS.md](./CMS.md)                           | Content model, section registry, draft/publish, preview, media  |
| 4   | [FOLDER_STRUCTURE.md](./FOLDER_STRUCTURE.md) | Directory layout, import rules, naming                          |
| 5   | [CODING_STANDARDS.md](./CODING_STANDARDS.md) | TypeScript, React, styling, motion, testing, Next.js 16 gotchas |
| 6   | [ROADMAP.md](./ROADMAP.md)                   | Delivery phases and exit criteria                               |
| 7   | [DECISIONS.md](./DECISIONS.md)               | Architecture decision records                                   |

New to the project? Read 1 and 5 in full, skim the rest, then come back to whichever covers what you are about to build.

## The short version

A single Next.js 16 application serving a public marketing site and its own admin CMS from one database. The public site is prerendered and CDN-served with zero database reads on a cache hit; the admin is fully dynamic and authenticated. Content is a Zod-validated JSON document with draft and published copies on the same row. Authorization lives in a data access layer, not in middleware.

## Ground rules

1. **This is not the Next.js you know.** Version 16 renamed `middleware` to `proxy`, made request APIs async, and replaced experimental PPR with Cache Components. Read `node_modules/next/dist/docs/` before writing framework code. `CODING_STANDARDS.md` §15 lists the traps.
2. **Architectural changes update these documents in the same PR.** A design that only exists in someone's head is not a design.
3. **Decisions are superseded, never edited.** Add a new ADR and mark the old one. ADR-003 → ADR-012 is the worked example.
4. **"It won't scale" needs a number.** Realistic steady state is under 20 pages, ~30 case studies, one admin, and low-tens-of-thousands of visits a month. Optimising past that is how this codebase gets worse, not better.

## Status

Phase 0 complete: documented, then reviewed adversarially before any implementation code. That review superseded one decision, resolved two conflicts between documents, and closed three open questions — see ADR-012 through ADR-019.

No implementation code has been written yet.
