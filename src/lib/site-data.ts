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

export const metrics = [
  { value: '$10M+', label: 'Email & SMS revenue generated' },
  { value: '35%', label: 'Average revenue from retention' },
  { value: '99%', label: 'Client retention rate' },
  { value: '100M+', label: 'Messages delivered' },
]

export type Service = {
  slug: string
  title: string
  summary: string
  description: string
  points: string[]
}

/**
 * The four core services.
 *
 * Deliberately four, not ten. Klaviyo is a platform Kova manages as part of a
 * client's email and SMS programme — not a service in its own right — and the
 * same is true of deliverability, segmentation, automations, campaigns and
 * reporting. Those are how the work gets done, and they belong inside a
 * service's description rather than fragmenting the offer into a grid of
 * capabilities that reads like a feature list.
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
  {
    slug: 'account-audits',
    title: 'Account Audits',
    summary:
      'A clear read on what your programme is doing today, and what it is leaving on the table.',
    description:
      'We go through the account properly: structure, list health, every live flow, historic performance, and the gaps between them. You get a prioritised picture of what is working, what is quietly costing you, and what to fix first — as a standalone piece of work or as the opening step of an engagement.',
    points: [
      'Account structure and data review',
      'Flow-by-flow performance analysis',
      'List health and deliverability check',
      'A prioritised plan, ordered by revenue impact',
    ],
  },
  {
    slug: 'copywriting',
    title: 'Copywriting',
    summary: 'Words that sound like your brand and give the reader a reason to act.',
    description:
      'Subject lines that earn the open, body copy that holds attention, and calls to action that do not shout. We write in your voice across email and SMS, and we test the parts worth testing rather than guessing at what works.',
    points: [
      'Brand voice, applied consistently',
      'Subject-line and preview-text testing',
      'Story-driven sequences',
      'Clear, unhyped calls to action',
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
}

export const caseStudies: CaseStudy[] = [
  {
    slug: 'zilkee',
    brand: 'Zilkee',
    category: 'Consumer Products',
    summary:
      'Rebuilt a neglected email program into a structured revenue channel with a full flow suite and a consistent campaign calendar.',
    background:
      'Zilkee had strong paid acquisition but treated email as an afterthought. Sends were irregular, automations were minimal, and a growing list was going unmarketed.',
    challenge:
      'Turn a large but under-engaged list into a dependable, high-ROI channel without discounting the brand into the ground.',
    strategy: [
      'Audited the account, list health, and existing flows',
      'Rebuilt segmentation around purchase behavior and engagement',
      'Established a weekly campaign calendar aligned to the product roadmap',
      'Layered SMS onto the highest-intent moments',
    ],
    design:
      'A clean, modular template system that let the team ship on-brand emails quickly while keeping every send consistent and easy to read on mobile.',
    automation:
      'A complete flow suite — welcome, browse and cart abandonment, post-purchase, and win-back — replaced ad-hoc sending and began recovering revenue automatically.',
    sms: 'SMS was introduced for launches and time-sensitive offers, with compliant list growth and careful timing to protect the customer relationship.',
    results: [
      { value: '3x', label: 'Increase in email revenue' },
      { value: '40%+', label: 'Of revenue from owned channels' },
      { value: '9', label: 'Automated flows live' },
    ],
    accent: 'oklch(0.55 0.19 262)',
  },
  {
    slug: 'tiny-explorings',
    brand: 'Tiny Explorings',
    category: 'Kids & Family',
    summary:
      'Built a warm, story-led email and SMS program that matched a family brand and grew repeat purchase rate.',
    background:
      'Tiny Explorings had a devoted community but leaned almost entirely on social. Email felt transactional and off-brand, and SMS was unused.',
    challenge:
      'Extend the brand’s warmth into email and SMS while making both channels pull real weight in revenue.',
    strategy: [
      'Redefined the email voice to match the brand’s community feel',
      'Segmented by lifecycle stage and product interest',
      'Introduced SMS for restocks and seasonal moments',
      'Set up clean reporting tied to repeat purchase',
    ],
    design:
      'Soft, editorial layouts with generous imagery that felt like the brand rather than a template, engineered to render cleanly everywhere.',
    automation:
      'Lifecycle flows nurtured first-time buyers into repeat customers, with post-purchase education that reduced support load and increased reorders.',
    sms: 'SMS became the go-to channel for restock alerts and seasonal drops, driving fast, measurable response from the most engaged customers.',
    results: [
      { value: '2.4x', label: 'Repeat purchase lift from flows' },
      { value: '28%', label: 'Revenue from email & SMS' },
      { value: '+18%', label: 'List growth in first quarter' },
    ],
    accent: 'oklch(0.62 0.14 40)',
  },
  {
    slug: 'livora',
    brand: 'Livora',
    category: 'Home & Lifestyle',
    summary:
      'Introduced disciplined segmentation and deliverability work that lifted inbox placement and campaign performance.',
    background:
      'Livora was sending to its entire list on every campaign. Engagement was declining, and deliverability was starting to suffer.',
    challenge:
      'Protect sender reputation and grow revenue at the same time, without shrinking the program’s reach to nothing.',
    strategy: [
      'Cleaned the list and set up ongoing hygiene',
      'Implemented engagement-based segmentation',
      'Fixed authentication and monitored reputation',
      'Rebuilt the campaign calendar around relevance',
    ],
    design:
      'Refined, product-forward templates that put Livora’s catalog first and made each campaign feel considered rather than mass-sent.',
    automation:
      'Re-engagement and post-purchase flows kept the active audience warm while quietly sunsetting contacts that were hurting deliverability.',
    sms: 'A small, high-intent SMS list was grown deliberately and used sparingly for the moments that genuinely warranted an instant message.',
    results: [
      { value: '+22%', label: 'Inbox placement improvement' },
      { value: '2x', label: 'Campaign click-through rate' },
      { value: '30%', label: 'Lower unsubscribe rate' },
    ],
    accent: 'oklch(0.58 0.12 155)',
  },
]

export const process = [
  {
    step: '01',
    title: 'Audit',
    description:
      'We review your entire setup — account structure, list health, flows, and past performance — and pinpoint exactly what’s working, what’s not, and what to fix first.',
  },
  {
    step: '02',
    title: 'Strategy',
    description:
      'We turn the audit into a clear plan: segmentation, a campaign calendar, the flows to build, and the SMS moments worth owning — all tied to revenue goals.',
  },
  {
    step: '03',
    title: 'Execution',
    description:
      'We design, write, and ship. Campaigns go out on a consistent calendar and automations are built, tested, and launched — all in-house.',
  },
  {
    step: '04',
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
    a: 'It starts with a free call and an account audit. You’ll walk away with a clear picture of what your program is leaving on the table, whether or not we work together.',
  },
]
