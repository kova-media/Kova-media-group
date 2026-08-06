# Coding Standards

**Status:** Authoritative. Deviations need a comment explaining why.
**Last reviewed:** 2026-08-06

---

## 1. The rule behind the rules

> Optimise for the engineer who opens this file in three years with no context.

Not for fewer lines. Not for cleverness. Not for premature generality. Readability wins every tie.

Corollaries we actually apply:

- Duplication is cheaper than the wrong abstraction. Extract on the third occurrence, not the second.
- A slightly longer explicit version beats a short implicit one.
- If a reviewer needs an explanation in the PR thread, that explanation belongs in a code comment.
- Delete dead code. Version control remembers it.

---

## 2. TypeScript

Strict mode, already on. Additionally enable in `tsconfig.json` during Phase 1:

```jsonc
{
  "noUncheckedIndexedAccess": true,
  "noImplicitOverride": true,
  "noFallthroughCasesInSwitch": true,
  "forceConsistentCasingInFileNames": true,
}
```

Rules:

- **No `any`.** Use `unknown` and narrow. If a third-party type is wrong, write a local declaration and comment why.
- **No non-null assertions (`!`)** except immediately after a check the compiler cannot see, with a comment.
- **No type assertions to silence errors.** `as` is for genuinely unrepresentable narrowing, not for making red squiggles go away.
- **Infer types from Zod schemas** with `z.infer`. Never maintain a parallel hand-written interface.
- **Discriminated unions over optional-field soup.** `{ ok: true; data: T } | { ok: false; error: string }`, not `{ ok: boolean; data?: T; error?: string }`.
- **Function return types are explicit** on anything exported from `src/server/**`.
- **`satisfies` for config objects** so literals stay narrow while still being checked.

Target `ES2022` or later once the toolchain is settled; the Create Next App default of `ES2017` is unnecessarily conservative for our browser support matrix (Chrome/Edge/Firefox 111+, Safari 16.4+).

---

## 3. Server and Client Components

**Server by default.** `'use client'` is a deliberate decision, made as deep in the tree as possible.

Add `'use client'` only for: event handlers, `useState`/`useEffect`/`useRef`, browser APIs, Framer Motion, or a third-party client-only library.

The pattern:

```tsx
// hero.tsx — Server Component. Fetches nothing, receives data as props.
export function Hero({ headline, subhead, media }: HeroProps) {
  return (
    <Section>
      <AnimatedHeadline text={headline} /> {/* client leaf */}
      <p>{subhead}</p>
      <MediaImage asset={media} priority />
    </Section>
  )
}
```

Not:

```tsx
'use client'                      // ✗ makes the whole subtree client-side
export function Hero({ … }) { … }
```

Additional rules:

- A Client Component never imports from `src/server/**`. It receives props or calls a Server Action.
- Props crossing the server/client boundary must be serializable. No class instances, no functions except Server Actions, no `Date`… actually `Date` is fine; `Decimal` is not.
- Pass `children` down from a Server Component rather than importing a server component into a client one.
- `import 'server-only'` at the top of every `src/server/**` file. `import 'client-only'` on modules that must never run on the server.

---

## 4. Data fetching

- Reads live in `src/server/**`, never in a route file or component body.
- Public reads are wrapped in `'use cache'` with a `cacheTag` and a `cacheLife`. Pair every cache directive with a `cacheLife` — the implicit `default` profile is almost never what we want.
- **Cached functions return plain objects.** Prisma `Decimal` is a class instance and will fail serialization. Map it in `mappers.ts`.
- **Cached functions cannot read `cookies()`, `headers()`, or `searchParams`** — nor can anything they call. Extract the value outside the cache scope and pass it as an argument.
- Use `React.cache` for per-request memoisation (e.g. `verifySession`). Note that `React.cache` is isolated inside `'use cache'` scopes — it cannot be used to smuggle values in.
- Admin reads are never cached and always call `requireAdmin()` first.

---

## 5. Mutations

Every mutation is a Server Action in a `actions.ts` file with `'use server'` at the top.

```ts
'use server'

export async function updateSection(input: unknown): Promise<ActionResult> {
  const admin = await requireAdmin() // 1. authorize
  const parsed = updateSectionSchema.safeParse(input) // 2. validate
  if (!parsed.success) {
    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors }
  }

  try {
    await updateSectionData(parsed.data) // 3. write
    updateTag(cacheTags.page(parsed.data.pageSlug)) // 4. invalidate
    return { ok: true }
  } catch (error) {
    logger.error('updateSection failed', { error, adminId: admin.id })
    return { ok: false, message: 'Could not save the section. Please try again.' }
  }
}
```

Non-negotiable:

1. **Authorize first, in the action itself.** A Server Action is a public HTTP endpoint. Checks in the calling component protect nothing.
2. **Validate every input.** The client's types are a suggestion, not a guarantee.
3. **Return a typed result.** Never let an internal error message reach the browser.
4. **Invalidate the right tags.** Use `updateTag` in actions (read-your-writes). `revalidateTag` requires a second cacheLife argument in Next.js 16 — `revalidateTag(tag, 'max')`.
5. **Multi-row writes are transactions.**

Forms use `useActionState` with progressive enhancement: the form works before hydration, and the schema is shared between the client-side check and the server-side truth.

---

## 6. Rendering discipline (Cache Components)

With `cacheComponents: true`, every route must produce a static shell. Two habits make this automatic:

**Await deep, not shallow.** Reading a promise at the top of a layout blocks the whole subtree from prerendering.

```tsx
// ✗ layout cannot prerender
export default async function Layout({
  params,
  children,
}: LayoutProps<'/work/[slug]'>) {
  const { slug } = await params
  return (
    <div>
      <Sidebar />
      <h1>{slug}</h1>
      {children}
    </div>
  )
}

// ✓ only the heading streams
export default function Layout({ params, children }: LayoutProps<'/work/[slug]'>) {
  return (
    <div>
      <Sidebar />
      <Suspense fallback={<HeadingSkeleton />}>
        {params.then(({ slug }) => (
          <SlugHeading slug={slug} />
        ))}
      </Suspense>
      {children}
    </div>
  )
}
```

**Wrap the dynamic hole, not the page.** A `<Suspense>` boundary should surround the smallest subtree that actually needs request-time data. Its fallback ships in the static shell, so the fallback must look deliberate — a designed skeleton, not a spinner.

Also:

- `Math.random()`, `Date.now()`, `crypto.randomUUID()` must be preceded by `await connection()` inside a `<Suspense>` boundary, or be inside a `'use cache'` scope. The dev overlay will tell you which; do not silence it.
- Never opt a route out of prerendering to make a warning disappear. Fix the structure.
- The dev overlay's blocking-route insights are treated as build failures, not suggestions.

---

## 7. Styling

Tailwind CSS v4, configured in CSS via `@theme` in `src/styles/globals.css`.

- **Design tokens live in `@theme`.** Type scale, spacing rhythm, colour, radii, shadow, easing curves, durations. Components consume tokens as utilities.
- **Arbitrary values (`text-[17px]`) are a smell.** They mean a token is missing. Add the token.
- **No CSS-in-JS.** No `styled-components`. No runtime style computation.
- **Class order** is enforced by `prettier-plugin-tailwindcss`.
- **`cn()`** (clsx + tailwind-merge) for conditional classes. Never string concatenation.
- **Long class lists get extracted into a component**, not a `@apply` rule. `@apply` is reserved for genuine base-layer resets.
- **Light theme only** for the public site. The admin may follow the system preference.
- Layout uses logical properties and modern CSS (`grid`, `clamp()`, container queries) freely — our browser floor is Chrome/Edge/Firefox 111+ and Safari 16.4+.

Typography is the heaviest lift in the design. It gets an explicit scale with defined line-heights, tracking, and optical sizing, defined once, and used everywhere. Fonts are self-hosted through `next/font` with `display: 'swap'` and preloading on the routes that need them.

---

## 8. Motion

Animation supports storytelling. If it does not communicate something — hierarchy, causality, continuity, state — it does not ship.

| Tool                     | Use for                                                                                                                                      |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| CSS transitions          | Hover, focus, small state changes. **Default choice.**                                                                                       |
| Framer Motion (`motion`) | Entrances, layout transitions, orchestrated sequences, scroll-linked effects, gestures                                                       |
| GSAP                     | **Not in V1.** Requires an ADR with a specific effect attempted in Framer Motion, why it fell short, and the measured bundle delta (ADR-015) |

Rules:

- All motion goes through `src/components/motion/` wrappers. Components do not import `motion` directly.
- Import Framer Motion through its **lazy feature API**, so the animation runtime is code-split rather than bundled into every page that fades something in.
- **`prefers-reduced-motion` is honoured everywhere, and this is a correctness requirement, not a courtesy.** The failure mode is specific and common: a scroll-reveal implemented as `opacity: 0` → animate-to-1 leaves content **permanently invisible** when the animation is disabled. Reduced motion must mean _the content is immediately present_, never _the animation was skipped so the starting state persists_. Every motion wrapper is tested with the preference on. This is treated as a blocking accessibility bug, not a polish item.
- Animate `transform` and `opacity`. Anything that triggers layout is rejected in review.
- Durations and easings come from tokens (`--duration-fast`, `--ease-out-expo`), not magic numbers.
- Motion is imported only in leaf Client Components, so it stays out of the shared bundle.
- Scroll-driven effects clean up their listeners and observers on unmount. Every one of them.
- React 19.2 `<ViewTransition>` is available but not adopted in V1 (OD-6). Revisit after launch with an ADR.

---

## 9. Accessibility

Non-optional, part of the definition of done.

- Semantic HTML first. A `<div>` with a click handler is a bug.
- One `<h1>` per page; heading levels never skip.
- Every interactive element is keyboard reachable with a visible focus ring. Never `outline: none` without a replacement.
- Colour contrast ≥ 4.5:1 for body text, ≥ 3:1 for large text and UI boundaries. A premium light theme is where low-contrast grey text creeps in — check it.
- Every image has an `alt`; decorative images get `alt=""` explicitly.
- Form fields have real `<label>`s. Errors are associated via `aria-describedby` and announced.
- Modals and menus trap focus and restore it on close.
- `prefers-reduced-motion` respected (see §8).

---

## 10. Error handling

- **`dangerouslySetInnerHTML` is forbidden**, enforced by `react/no-danger` as an error. Rich text renders through the node-tree mapper (ADR-016). If you believe you need raw HTML, you need an ADR first.
- `error.tsx` at each route group; `global-error.tsx` at the root. Both are designed, not default.
- `not-found.tsx` designed to the same standard as the rest of the site.
- Server Actions return typed failures; they do not throw to the client.
- `src/server/**` logs through `src/lib/logger.ts` with structured context. No bare `console.log`.
- Never log secrets, tokens, full request bodies, or raw email addresses.
- Expected failures (validation, not-found) are values. Unexpected failures are exceptions.

---

## 11. Testing

Proportionate. We test what breaks silently and what would be expensive to get wrong.

| Layer       | Tool                                 | Scope                                                                                                                      |
| ----------- | ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| Unit        | Vitest                               | Zod schemas, content document parsing, rich-text renderer, section registry, mappers, formatters, rate limiter             |
| Integration | Vitest + test database               | Publish transaction, DAL authorization, contact submission pipeline                                                        |
| End-to-end  | Playwright                           | Admin login, edit → preview → publish, contact form submission, 404 handling, security headers on a public vs. admin route |
| Static      | `tsc --noEmit`, ESLint, `next build` | Every PR                                                                                                                   |

Explicitly **not** tested: visual appearance of marketing sections (reviewed by eye), and third-party library behaviour.

Two cheap tests worth more than a dozen component tests:

- A **build-time assertion** that every `SectionType` has both a registry definition and a React component.
- A test that renders every motion wrapper with `prefers-reduced-motion: reduce` and asserts the content is visible (see §8 — this catches the invisible-content failure mode).

---

## 12. Git and review

- Branch from `main`: `feature/…`, `fix/…`, `docs/…`, `chore/…`.
- Conventional Commits: `feat(cms): add proof metrics section`.
- Small PRs. A PR that touches the schema, the CMS, and the homepage design is three PRs.
- Every PR: passes type-check, lint, tests, and `next build`; updates the relevant document in `docs/` if it changes architecture, schema, or structure.
- Squash merge. `main` stays deployable at every commit.
- Schema changes include the generated migration and a note on reversibility.

Review looks for, in order: correctness → security (authorization, validation) → architectural fit → readability → performance → style. Style comments are the least important and should mostly be automated away.

---

## 13. Comments

Comment **why**, never **what**.

```ts
// ✗
// loop over sections
for (const section of sections) { … }

// ✓
// Sections are renumbered rather than fractionally ranked: pages hold a few dozen
// sections at most, and integer positions keep the admin's reorder logic trivial.
```

Every non-obvious decision, workaround, or framework constraint gets a comment. Anything genuinely load-bearing gets an entry in `docs/DECISIONS.md` and a comment pointing at it.

`TODO` comments include an owner and a date: `// TODO(2026-09-01, damian): replace with signed URL expiry from settings`.

---

## 14. Dependencies

Every new dependency is a long-term liability. Before adding one, answer:

1. Can the platform or ~30 lines of our own code do this?
2. Is it actively maintained, and what is its bundle cost on the public site?
3. What is the exit cost if it is abandoned?

Anything client-side on the marketing site gets extra scrutiny — it is measured against the JS budget in `ARCHITECTURE.md` §12.

Dependencies are pinned. Upgrades are deliberate, in their own PR, with the changelog read. Next.js and React are upgraded together, following the version guide in `node_modules/next/dist/docs/`.

---

## 15. Working with this Next.js version

This project runs Next.js 16, which differs from most training data and most tutorials. Before writing framework code, read the relevant guide in `node_modules/next/dist/docs/`.

Facts that most commonly trip people up here:

| Old                                            | Current                                                                  |
| ---------------------------------------------- | ------------------------------------------------------------------------ |
| `middleware.ts`                                | `proxy.ts` (Node runtime only, no edge)                                  |
| `export function middleware()`                 | `export function proxy()`                                                |
| Sync `params` / `searchParams`                 | Promises — `await props.params`                                          |
| Sync `cookies()` / `headers()` / `draftMode()` | All async                                                                |
| `experimental.ppr`                             | `cacheComponents: true`                                                  |
| `unstable_cacheLife` / `unstable_cacheTag`     | `cacheLife` / `cacheTag` from `next/cache`                               |
| `revalidateTag(tag)`                           | `revalidateTag(tag, 'max')` — second argument required                   |
| —                                              | `updateTag(tag)` — new, Server Actions only, read-your-writes            |
| `--turbopack` flag                             | Turbopack is the default for `dev` and `build`                           |
| Hand-written page prop types                   | `PageProps<'/route'>`, `LayoutProps<'/route'>`, `RouteContext<'/route'>` |
| `params` in `opengraph-image` / `sitemap`      | Promises                                                                 |
| `images.minimumCacheTTL` default 60s           | 4 hours                                                                  |

The managed block in `AGENTS.md` is written by `next dev`. Do not hand-edit it; commit it with your work if it reappears.
