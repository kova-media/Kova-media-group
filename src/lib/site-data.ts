/**
 * The shape a case study takes once it has left the server.
 *
 * A **type only**. There is no bundled case study content in `src/` any more:
 * the public site reads published studies from the CMS and shows nothing when
 * there are none. The starting data for the three real studies lives in
 * `prisma/seed-case-studies.ts`, which is seed input and is never rendered.
 */
export type CaseStudy = {
  slug: string
  brand: string
  category: string
  summary: string
  background: string
  challenge: string
  strategy: string[]
  design: string
  automation: string
  sms: string
  results: { value: string; label: string }[]
  qualitative?: string
  accent: string
  /**
   * The window the `results` figures cover, e.g. 'November 2024 – July 2025'.
   *
   * A percentage can travel without its timeframe; an absolute figure cannot.
   * Absolute figures therefore stay in the narrative prose, where the sentence
   * states the period, and this labels the headline cards so a reader knows
   * what window they describe. Empty when the figures have no stated period.
   */
  resultsPeriod?: string
}

/**
 * The bundled case studies.
 *
 * **Every claim here is either verified or absent.** Empty `challenge` and
 * `design` fields are not oversights: the blocks they feed are dropped rather
 * than filled with plausible-sounding narrative about a real client's business
 * that nobody confirmed. The same rule governs numbers — Zilkee has verified
 * figures and shows them with their timeframe; Tiny Explorings and Livora have
 * none on file, so their pages carry none rather than borrowing a shape from
 * the study that does.
 *
 * `sms` is empty for the two email-only engagements. Claiming a channel Kova
 * did not run for a client is the same class of error as inventing a number.
 */
