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

export const nav = [
  { label: 'Services', href: '/services' },
  { label: 'Case Studies', href: '/case-studies' },
  { label: 'Process', href: '/process' },
  { label: 'About', href: '/about' },
]

export const clients = [
  'Zilkee',
  'Tiny Explorings',
  'Livora',
  'AquaCats',
  'Kindred Harvest',
  'Study Notes',
  'LoyalTees',
]

/**
 * Agency-wide credibility figures.
 *
 * **Deliberately empty**, on the same rule as `testimonials` below. The four
 * numbers that used to sit here — $10M+ generated, 35% of revenue from
 * retention, 99% client retention, 100M+ messages delivered — came out of the
 * v0 generation and were never provided or verified by Kova. A headline
 * statistic is a factual claim about the business, so it is either sourced or
 * it is absent; a plausible-looking placeholder is the one thing it cannot be.
 *
 * The bands that read this render nothing while it is empty. Real, verified
 * figures can be added here and both surfaces pick them up.
 */
export const metrics: { value: string; label: string }[] = []

export type Service = {
  slug: string
  title: string
  summary: string
  description: string
  points: string[]
}

/**
 * The two services Kova sells.
 *
 * Deliberately two, not ten. Everything else people ask about — the audit that
 * opens an engagement, the copy, the deliverability work, segmentation,
 * automations, campaigns, reporting, and the platforms themselves (Klaviyo,
 * Privy, Postscript) — is *how* these two channels get run, not a separate
 * thing to buy. Those belong inside a service's description; promoting them to
 * catalogue entries makes the offer read as a feature list and dilutes the
 * two-channel claim the whole site is built on.
 */
export const services: Service[] = [
  {
    slug: 'email-marketing',
    title: 'Email Marketing',
    summary:
      'The channel that turns existing customers into repeat revenue — planned, built, and measured end to end.',
    description:
      'A complete email programme: the campaign calendar, the automated flows behind it, and the segmentation that decides who sees what. We plan against your launches and promotions, design and write every send, and keep the account healthy so the revenue you build actually lands in the inbox.',
    points: [
      'Campaign calendar planned around your launches',
      'Automated flows — welcome, abandonment, post-purchase, win-back',
      'Segmentation and list health',
      'Deliverability, monitored continuously',
      'Weekly reporting tied to revenue',
    ],
  },
  {
    slug: 'sms-marketing',
    title: 'SMS Marketing',
    summary:
      'The most immediate channel you own, used for the moments that genuinely warrant it.',
    description:
      'SMS reaches customers in seconds, which is exactly why it has to be used with restraint. We grow a compliant list, pick the moments worth interrupting someone for, and write messages short enough to earn the tap — with timing and frequency managed so the channel stays welcome.',
    points: [
      'Compliant list growth',
      'Launch, restock, and time-sensitive sends',
      'Automated SMS alongside email flows',
      'Timing and frequency strategy',
    ],
  },
]

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

export const process = [
  {
    step: '1',
    title: 'Audit',
    description:
      'We review your entire setup — account structure, list health, flows, and past performance — and pinpoint exactly what’s working, what’s not, and what to fix first.',
  },
  {
    step: '2',
    title: 'Strategy',
    description:
      'We turn the audit into a clear plan: segmentation, a campaign calendar, the flows to build, and the SMS moments worth owning — all tied to revenue goals.',
  },
  {
    step: '3',
    title: 'Execution',
    description:
      'We design, write, and ship. Campaigns go out on a consistent calendar and automations are built, tested, and launched — all in-house.',
  },
  {
    step: '4',
    title: 'Optimization',
    description:
      'We test, measure, and refine every week. Winning ideas scale, weak ones are cut, and the program compounds quarter over quarter.',
  },
]

/**
 * Client testimonials.
 *
 * **Deliberately empty.** Every quote shown on this site must come from a real,
 * attributable Kova client. The three quotes that previously sat here were
 * produced by the v0 generation and attributed anonymously ("Founder, DTC
 * Consumer Brand") — they are not verifiably real, so they are gone rather than
 * left in place to fill a section.
 *
 * Real quotes are added through the admin (Library → Testimonials) and appear
 * automatically. Until then the testimonials section renders nothing at all:
 * showing fewer is correct, inventing more never is.
 */
export const testimonials: { quote: string; name: string; role: string }[] = []

export const faqs = [
  {
    q: 'Do you only do email and SMS?',
    a: 'Yes. We specialize exclusively in email and SMS marketing for ecommerce. We’re not a full-service agency — that focus is exactly why our clients get better results from these channels.',
  },
  {
    q: 'What size brands do you work with?',
    a: 'We work best with direct-to-consumer ecommerce brands doing roughly $500K to $20M in annual revenue that already understand the value of retention and want a specialist to run it.',
  },
  {
    q: 'Which platforms do you work in?',
    a: 'Klaviyo, Privy, Postscript, and many more.',
  },
  {
    q: 'How quickly will we see results?',
    a: 'Automated flows often begin recovering revenue within the first few weeks. Campaign performance compounds as we test and refine your calendar over the first quarter.',
  },
  {
    q: 'Is everything done in-house?',
    a: 'Yes. Strategy, design, copy, and analysis are handled by our team — never outsourced. That’s how we keep quality consistent and the work accountable.',
  },
  {
    q: 'How do we get started?',
    a: 'It starts with a free call. We go through your current email and SMS setup together, and you’ll walk away with a clear picture of what your program is leaving on the table — whether or not we end up working together.',
  },
]
