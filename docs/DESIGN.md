# Visual Direction — Marketing Site

**Status:** Standing direction. Applies to every marketing section from here forward.
**Scope:** The public marketing site. The admin is a tool, not a brand surface, and is out of scope.
**Last reviewed:** 2026-08-24

---

## Why this document exists

There is a house style that current AI-assisted design converges on: white rounded cards, pastel gradient blocks, tiny uppercase labels, oversized sans headlines, big metrics, and the same card component repeated down the page. It is competent and completely interchangeable. Hundreds of agency sites share it.

Kova sells judgement. A site that looks assembled from the same parts as everyone else's argues against the thing being sold. This document is the standing constraint that keeps us out of that basin.

**The test:** could this section be lifted onto a competitor's site with only a logo swap? If yes, it is not finished.

---

## This is direction, not a migration

Do not rewrite working sections to satisfy a checklist. The prohibitions below govern **new and revised** work. Where the current site already works, it stays.

Two failure modes, equally bad:

1. Falling into the generic pattern.
2. Fleeing it into another recognisable template. Swapping the SaaS look for the "premium studio" look — oversized type, brutalist mono, hairline rules everywhere — is the same mistake wearing different clothes.

The objective is a Kova identity, arrived at deliberately.

---

## Positive principles

These carry the weight. The prohibitions are downstream of them.

**Typography is the primary instrument.** Hierarchy comes from size, weight, measure, and spacing — not from containers. A section should read correctly with every border and background removed. If it collapses without its cards, the cards were doing work the type should have done.

**Composition should be editorial, not gridded.** Vary the axis. Asymmetry, a deliberate off-centre column, text set against generous void, an image that breaks its column. Think print layout, not dashboard.

**Proportion and whitespace over decoration.** Space is the premium signal. Confidence reads as restraint — room around a claim rather than ornament pointing at it.

**Motion is purposeful and subtle.** Motion clarifies arrival, sequence, or state change. It never announces itself. Respect `prefers-reduced-motion` — already wired via the Lenis deferral (see `CODING_STANDARDS.md`).

**Real work, real imagery.** Client work carries the credibility. Never fabricate testimonials, logos, or metrics — the content commits (`57fb9a2`, `4621cfd`) settled this, and it is a brand rule, not just an honesty rule.

**Variety between sections, coherence across them.** Sections should differ structurally, not just in copy. Coherence comes from the type system, spacing scale, and colour discipline — not from every section sharing a shell.

---

## Colour

**Teal `#14B8A6` is the accent and the CTA colour.** Already correct in `globals.css` as `--brand` and `--cta`, with `--cta-hover: #0d9488`. Use the tokens, never the literal.

Rules:

- Teal is **strategic, not atmospheric.** It marks action and the occasional deliberate emphasis. A page with teal in six places has none.
- The palette is teal + the `ink` neutral ramp + `--navy: #0b1120` as a dark ground. That is the system.
- **Do not introduce new accent colours to differentiate sections.** Sections are distinguished by structure and rhythm. A section that needs its own colour to feel distinct has a composition problem.
- Oversized colour-block CTAs are out. A CTA earns attention through placement and surrounding space, not surface area.

**Known tension to resolve at the next design pass:** `--brand-muted` and `--accent` are both `#e0f2fe`, a pale sky blue. It is off-hue from teal and reads as exactly the generic pastel this document rejects. Left in place for now — flagged so it is a decision when touched, not an accident.

---

## Prohibitions

Each of these is a symptom. The **instead** column matters more than the ban.

| Avoid                                              | Why                                                         | Instead                                                                                    |
| -------------------------------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Leading-zero section numbers (`01`, `02`)          | Pure decoration cosplaying as structure                     | Prefer no numbering. If sequence is genuinely load-bearing, plain numerals                 |
| Tiny or low-contrast supporting text               | Illegible, and "small = refined" is a tell                  | Supporting text stays readable. Demote with weight and colour, within contrast limits      |
| Nested boxes, layered cards, fake 3D depth         | Depth without meaning; containers standing in for hierarchy | Flat composition. Let space and type separate things                                       |
| Beige/tan-heavy palettes                           | Not the Kova identity                                       | The ink ramp, with navy as the dark ground                                                 |
| Decorative serif typography                        | Borrowed gravitas                                           | Geist Sans carries the hierarchy; Geist Mono for genuinely technical labels                |
| An eyebrow label above every headline              | Formula. Three words of filler before the real sentence     | Most sections open on the headline. An eyebrow must earn its place                         |
| Bento grids                                        | The single strongest marker of the generic look             | Compose to the content's actual shape                                                      |
| Randomly italicised words in headlines             | Emphasis with nothing behind it                             | Write a better headline                                                                    |
| Gradient blobs and glows                           | Decoration hiding a thin composition                        | Nothing, usually. Or real imagery                                                          |
| Generic pastel card systems                        | "Premium" by association                                    | See Colour                                                                                 |
| Repetitive rounded-card layouts                    | Every section becomes the same component                    | Vary the structure section to section                                                      |
| The eyebrow → headline → paragraph → cards formula | The whole page becomes one component with different text    | Vary the opening move. Some sections start on an image, a statement, or a full-bleed break |

---

## Review checklist

Before a marketing section is considered done:

1. Could it be lifted onto a competitor's site with a logo swap?
2. Does it hold up with all borders and backgrounds stripped?
3. Does it open the same way as the section above it?
4. Is teal doing one clear job, or several vague ones?
5. Is every container earning its place, or is it habit?
6. Does anything here claim something we cannot verify?

---

## What is explicitly kept

The brand token system in `globals.css`, Geist Sans + Geist Mono, teal as CTA, navy as dark ground, the reduced-motion handling, and the verified-claims-only content rule. This document constrains what we build on top of that system. It does not replace it.
