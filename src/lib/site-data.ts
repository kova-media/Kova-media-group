/**
 * Bundled content — the floor the public site renders from when the database
 * has nothing.
 *
 * Almost everything that used to live here is now CMS content: the homepage
 * and interior-page copy moved to `src/server/content/blueprints.ts`, and the
 * navigation, footer and site-wide CTA labels moved to Site settings. What
 * remains is the case study set, which `site-content.ts` still falls back to,
 * and the handful of constants that describe the business itself.
 *
 * Editing this file does **not** change the live site once the CMS has been
 * seeded. Change content in the admin; change this only to move the floor.
 */
export const site = {
  name: 'Kova Media Group',
  shortName: 'Kova',
  email: 'damian@kovamediagroup.com',
  /**
   * The single conversion action for the whole site.
   *
   * Kova runs no social accounts, so there are deliberately no social links
   * anywhere — a footer column of dead icons costs credibility.
   */
  bookingUrl: 'https://calendly.com/damian-kovamediagroup-7lpe/30min',
  tagline: 'Email & SMS marketing that drives revenue.',
}

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
export const caseStudies: CaseStudy[] = [
  {
    slug: 'zilkee',
    brand: 'Zilkee',
    category: 'Tech',
    summary:
      'Rebuilt the retention program around stronger flows, campaigns, segmentation, and SMS.',
    background:
      'Zilkee is a technology brand selling data-recovery hardware direct to consumers. Kova runs its email and SMS program.',
    challenge: '',
    strategy: [
      'Rebuilt the automated flows',
      'Put campaigns on a consistent calendar',
      'Reworked segmentation around how customers actually buy',
      'Added SMS as a second owned channel',
    ],
    design: '',
    automation:
      'Automations carry the program. Across November 2024 to July 2025 they accounted for 74% of attributed revenue, with email automation revenue rising from $114.6K to $132.7K. Attributed revenue over that window reached $334.7K, up 44.5%, and average order value rose from $83.05 to $120.97.',
    sms: 'SMS went from a marginal contribution to a substantial one over the same window, growing from $20.2K to $128.4K.',
    results: [
      { value: '+44.5%', label: 'Attributed revenue' },
      { value: '+45.7%', label: 'Average order value' },
    ],
    resultsPeriod: 'November 2024 – July 2025',
    accent: 'oklch(0.55 0.19 262)',
  },
  {
    slug: 'tiny-explorings',
    brand: 'Tiny Explorings',
    category: "Children's Shoes",
    summary:
      'Built a retention program around thoughtful campaigns, automations, and a strong understanding of the brand and its customers.',
    background:
      'Tiny Explorings is a children’s shoe brand. Kova ran its email program.',
    challenge: '',
    strategy: [
      'Campaigns written in the brand’s own voice',
      'Automations for the moments that repeat for every customer',
      'Planning grounded in a close understanding of the brand and its customers',
    ],
    design: '',
    automation:
      'Automations ran alongside the campaign calendar, covering the points in the customer relationship that recur for every customer.',
    sms: '',
    results: [],
    accent: 'oklch(0.62 0.14 40)',
  },
  {
    slug: 'livora',
    brand: 'Livora',
    category: 'Beauty',
    summary:
      'Built a focused email program for a women’s razor brand, with campaigns, automations, and ongoing optimization.',
    background:
      'Livora is a beauty brand selling razors for women. Kova ran its email program.',
    challenge: '',
    strategy: [
      'A campaign calendar the brand could keep to',
      'Automations for the recurring moments in the customer relationship',
      'Ongoing testing and refinement of what was already live',
    ],
    design: '',
    automation:
      'Automations handled the recurring moments in the customer relationship, leaving the campaign calendar free for what was genuinely new.',
    sms: '',
    results: [],
    accent: 'oklch(0.58 0.12 155)',
  },
]
