import type { PageContent } from './schemas/page'

/**
 * The starting content for every designed marketing page.
 *
 * **Seed input only.** `prisma/seed-content.ts` writes these documents into the
 * CMS once; from that moment the database is the source of truth and the admin
 * can change every word without a deploy. Nothing on the public site reads this
 * file — a page with no published document 404s rather than rendering from
 * code, because a site that keeps showing copy the owner deleted is the exact
 * failure this system exists to prevent.
 *
 * Two rules govern what belongs in it.
 *
 * 1. **Copy only.** Nothing here describes how anything looks. The section
 *    types name designed components; the fields are the words inside them.
 *
 * 2. **Verified claims only.** Every figure has to trace to something real.
 *    The `$10M+ generated / 35% of revenue / 99% client retention / 100M+
 *    messages` band that once sat on the About page came out of the original
 *    v0 generation and was never sourced by Kova — so it is not here, and the
 *    figures band is simply absent from the About and Home blueprints rather
 *    than reproduced with different numbers. The band remains available in the
 *    admin's "add section" list for the day there are real figures to put in
 *    it. Case study figures are the exception that proves the rule: Zilkee's
 *    are verified and carry their window, and the two email-only engagements
 *    carry none rather than borrowing the shape of the one that does.
 */
export type PageBlueprint = {
  slug: string
  title: string
  /** The route that renders it. Used by the seed for reporting only. */
  path: string
  seoTitle: string
  seoDescription: string
  content: PageContent
}

let counter = 0

/** Stable, readable section ids — the seed writes these straight into the DB. */
function section(
  slug: string,
  type: string,
  data: Record<string, unknown>,
): PageContent['sections'][number] {
  counter += 1
  return {
    id: `${slug}-${type.toLowerCase().replace(/_/g, '-')}-${counter}`,
    type: type as PageContent['sections'][number]['type'],
    isEnabled: true,
    data,
  }
}

const BOOK_CTA = { label: 'Book a strategy call', href: '/book' }
const WORK_CTA = { label: 'View case studies', href: '/case-studies' }

/* -------------------------------------------------------------------- Home */

const home: PageBlueprint = {
  slug: 'home',
  title: 'Homepage',
  path: '/',
  seoTitle: 'Kova Media Group — Email & SMS marketing for DTC brands',
  seoDescription:
    'Email and SMS marketing for ecommerce brands. We turn the customers you already have into recurring revenue.',
  content: {
    sections: [
      section('home', 'HOME_HERO', {
        // Line breaks are content: the hero animates the headline line by line.
        headline: 'Email & SMS\nmarketing that\ndrives revenue.',
        subhead:
          'We help ecommerce brands generate more revenue from the customers they already have — through high-performing campaigns, intelligent automations, and strategic SMS.',
        primaryCta: BOOK_CTA,
        secondaryCta: WORK_CTA,
      }),
      section('home', 'CLIENT_MARQUEE', {
        caption: 'Trusted by direct-to-consumer brands',
        clients: [
          'Zilkee',
          'Tiny Explorings',
          'Livora',
          'AquaCats',
          'Kindred Harvest',
          'Study Notes',
          'LoyalTees',
        ],
      }),
      section('home', 'SERVICES_OVERVIEW', {
        heading: 'Two channels. Done exceptionally well.',
        body: 'We are not a full-service agency. We do email and SMS — the highest-ROI channels in ecommerce — and we do them better than generalists ever could.',
        services: [
          {
            title: 'Email Marketing',
            summary:
              'The channel that turns existing customers into repeat revenue — planned, built, and measured end to end.',
            points: [
              'Campaign calendar planned around your launches',
              'Automated flows — welcome, abandonment, post-purchase, win-back',
              'Segmentation and list health',
              'Deliverability, monitored continuously',
            ],
            href: '/services',
          },
          {
            title: 'SMS Marketing',
            summary:
              'The most immediate channel you own, used for the moments that genuinely warrant it.',
            points: [
              'Compliant list growth',
              'Launch, restock, and time-sensitive sends',
              'Automated SMS alongside email flows',
              'Timing and frequency strategy',
            ],
            href: '/services',
          },
        ],
      }),
      section('home', 'WORK_INDEX', {
        eyebrow: 'Selected work',
        allWorkLabel: 'All work',
        heading: 'See our work.',
        body: 'Real programs for real brands. Here is a look at how focused email and SMS work translates into revenue.',
        limit: 3,
      }),
      section('home', 'PROCESS_STEPS', {
        heading: 'A clear, four-step engagement.',
        body: 'No mystery, no fluff. You always know what we are working on and why.',
        steps: PROCESS_STEPS(),
      }),
      section('home', 'STATEMENT', {
        statement:
          'Full-service agencies spread themselves thin across a dozen channels. We chose the opposite. By focusing only on email and SMS, we go deeper — better strategy, sharper copy, cleaner data, and results generalists can’t match.',
        cta: { label: 'About Kova', href: '/about' },
      }),
      section('home', 'TESTIMONIALS', {
        heading: 'Trusted by the founders who hired us.',
      }),
      section('home', 'FAQ', {
        heading: 'Questions, answered.',
        items: FAQ_ITEMS(),
      }),
      section('home', 'FINAL_CTA', FINAL_CTA()),
    ],
  },
}

/* ------------------------------------------------------------------- About */

const about: PageBlueprint = {
  slug: 'about',
  title: 'About',
  path: '/about',
  seoTitle: 'About',
  seoDescription:
    'Kova Media Group is a specialist email and SMS marketing agency for ecommerce brands. Focused, in-house, and accountable to revenue.',
  content: {
    sections: [
      section('about', 'PAGE_HEADER', {
        eyebrow: 'About',
        title: 'A focused agency for one of your most valuable channels.',
        description:
          'Kova Media Group exists to make email and SMS pull real weight for ecommerce brands. We believe owned channels deserve a specialist, not a checkbox.',
      }),
      // No figures band. See the file header: the four statistics that used to
      // sit here were never sourced, and a band of numbers is worth nothing if
      // the numbers are not.
      section('about', 'VALUES', {
        eyebrow: 'What we believe',
        statement:
          'Retention is where great brands are built. We help ecommerce companies turn subscribers into repeat customers — and treat every send like it matters.',
        items: [
          {
            title: 'Specialists, not generalists',
            body: 'We do email and SMS — nothing else. That focus is why our clients get more from these channels than a full-service agency could deliver.',
          },
          {
            title: 'Revenue over vanity metrics',
            body: 'Opens and clicks are means, not ends. We report on what these channels actually contribute to the business, every single week.',
          },
          {
            title: 'Everything in-house',
            body: 'Strategy, design, copy, and analysis are handled by our own team. Nothing is outsourced, so quality stays consistent and accountable.',
          },
          {
            title: 'A true extension of your team',
            body: 'We learn your brand deeply and communicate clearly. You always know what we are working on and why it matters.',
          },
        ],
      }),
      // Credentials, placed after the argument rather than before it, and
      // shipped empty: the official Shopify and Klaviyo badge artwork is not in
      // the media library yet, and the band renders nothing until it is. No
      // partner status is asserted anywhere until a real badge is uploaded.
      section('about', 'PARTNER_BADGES', { label: '', badges: [] }),
      section('about', 'TESTIMONIALS', {
        heading: 'Trusted by the founders who hired us.',
      }),
      section('about', 'FINAL_CTA', FINAL_CTA()),
    ],
  },
}

/* ---------------------------------------------------------------- Services */

const services: PageBlueprint = {
  slug: 'services',
  title: 'Services',
  path: '/services',
  seoTitle: 'Services',
  seoDescription:
    'Email marketing and SMS marketing for direct-to-consumer ecommerce brands. Two channels, run end to end.',
  content: {
    sections: [
      section('services', 'PAGE_HEADER', {
        eyebrow: 'Services',
        title: 'Two things, done properly.',
        description:
          'We do email marketing and SMS marketing for ecommerce brands. Not ten services — two, run end to end and in-house.',
      }),
      section('services', 'SERVICES_LIST', {
        includesLabel: 'What that includes',
        services: [
          {
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
        ],
      }),
      section('services', 'SERVICES_CLOSING', {
        label: 'How',
        statement:
          'No channel is run in isolation. Campaigns, flows, and SMS are planned together against a single revenue goal — so every message earns its place in the inbox.',
        body: 'Platforms are part of the job, not the offer. We work in Klaviyo, Privy, Postscript, and many more, and we manage whichever one you are on end to end — the account structure, the data, and the deliverability work behind it — because that is what makes both channels actually perform.',
      }),
      section('services', 'FINAL_CTA', FINAL_CTA()),
    ],
  },
}

/* ----------------------------------------------------------------- Process */

const process: PageBlueprint = {
  slug: 'process',
  title: 'Process',
  path: '/process',
  seoTitle: 'Process',
  seoDescription:
    'Our four-step process for building email and SMS programs that compound: Audit, Strategy, Execution, and Optimization.',
  content: {
    sections: [
      section('process', 'PAGE_HEADER', {
        eyebrow: 'Process',
        title: 'A clear, repeatable path from audit to compounding revenue.',
        description:
          'No mystery, no black box. Here is exactly how we take a program from where it is today to a channel you can count on.',
      }),
      section('process', 'PROCESS_DETAIL', {
        steps: PROCESS_STEPS(),
        asideEyebrow: 'What we build',
        asideBody:
          'A typical automation suite recovers revenue around the clock. Here is a simplified view of the flows we design and connect.',
      }),
      section('process', 'FINAL_CTA', FINAL_CTA()),
    ],
  },
}

/* ------------------------------------------------------------- Case studies */

const caseStudies: PageBlueprint = {
  slug: 'case-studies',
  title: 'Case studies',
  path: '/case-studies',
  seoTitle: 'Case Studies',
  seoDescription:
    'Real results from ecommerce brands. See how Kova Media Group turned email and SMS into dependable revenue channels.',
  content: {
    sections: [
      section('case-studies', 'PAGE_HEADER', {
        eyebrow: 'Case Studies',
        title: 'Results that compound, brand by brand.',
        description:
          'A closer look at how we build email and SMS into channels our clients can count on.',
      }),
      section('case-studies', 'CASE_STUDY_LIST', {}),
      section('case-studies', 'FINAL_CTA', FINAL_CTA()),
    ],
  },
}

/* ----------------------------------------------------------------- Contact */

const contact: PageBlueprint = {
  slug: 'contact',
  title: 'Contact',
  path: '/contact',
  seoTitle: 'Contact',
  seoDescription:
    'Book a free strategy call with Kova Media Group. Find out what your email and SMS program is leaving on the table.',
  content: {
    sections: [
      section('contact', 'CONTACT_INTRO', {
        eyebrow: 'Contact',
        headline: 'Let’s grow\nyour owned\nchannels.',
        body: 'Every engagement starts with a free call. Here’s what you can expect.',
        points: [
          'A free, no-pressure look at your email & SMS setup',
          'A clear view of the revenue your program is leaving on the table',
          'Straight answers on whether we’re the right fit — no hard sell',
        ],
        responseNote: 'We reply within one business day',
      }),
    ],
  },
}

/* -------------------------------------------------------------------- Book */

const book: PageBlueprint = {
  slug: 'book',
  title: 'Book a call',
  path: '/book',
  seoTitle: 'Book a Call',
  seoDescription:
    'Book a free 30-minute strategy call with Kova Media Group. We will audit your email and SMS setup and show you what your program is leaving on the table.',
  content: {
    sections: [
      section('book', 'PAGE_HEADER', {
        eyebrow: 'Book a call',
        title: 'Thirty minutes. A real audit.',
        description:
          'Pick a time that suits you. We will look at your account before the call so the conversation starts with specifics, not introductions.',
      }),
      section('book', 'BOOK_DETAILS', {
        points: [
          'A free, no-pressure audit of your email & SMS setup',
          'A clear view of the revenue your program is leaving on the table',
          'Straight answers on whether we are the right fit — no hard sell',
        ],
        writeFirstLabel: 'Prefer to write first?',
      }),
    ],
  },
}

/* -------------------------------------------------------- Repeated fragments */

/**
 * The four engagement steps.
 *
 * A function rather than a shared constant so the home and process blueprints
 * each get their own copy: once seeded they are two independent CMS sections,
 * and an editor changing one must not silently change the other.
 */
function PROCESS_STEPS() {
  return [
    {
      title: 'Audit',
      description:
        'We review your entire setup — account structure, list health, flows, and past performance — and pinpoint exactly what’s working, what’s not, and what to fix first.',
    },
    {
      title: 'Strategy',
      description:
        'We turn the audit into a clear plan: segmentation, a campaign calendar, the flows to build, and the SMS moments worth owning — all tied to revenue goals.',
    },
    {
      title: 'Execution',
      description:
        'We design, write, and ship. Campaigns go out on a consistent calendar and automations are built, tested, and launched — all in-house.',
    },
    {
      title: 'Optimization',
      description:
        'We test, measure, and refine every week. Winning ideas scale, weak ones are cut, and the program compounds quarter over quarter.',
    },
  ]
}

function FINAL_CTA() {
  return {
    heading: 'See what your brand is leaving on the table.',
    body: 'A free call, and a straight read on your email and SMS setup. You’ll walk away with a clear plan to grow that revenue — whether or not we work together.',
    primaryCta: BOOK_CTA,
    secondaryCta: WORK_CTA,
  }
}

/** FAQ answers are rich text, so each one is a single paragraph node. */
function FAQ_ITEMS() {
  const answers: [string, string][] = [
    [
      'Do you only do email and SMS?',
      'Yes. We specialize exclusively in email and SMS marketing for ecommerce. We’re not a full-service agency — that focus is exactly why our clients get better results from these channels.',
    ],
    [
      'What size brands do you work with?',
      'We work best with direct-to-consumer ecommerce brands doing roughly $500K to $20M in annual revenue that already understand the value of retention and want a specialist to run it.',
    ],
    ['Which platforms do you work in?', 'Klaviyo, Privy, Postscript, and many more.'],
    [
      'How quickly will we see results?',
      'Automated flows often begin recovering revenue within the first few weeks. Campaign performance compounds as we test and refine your calendar over the first quarter.',
    ],
    [
      'Is everything done in-house?',
      'Yes. Strategy, design, copy, and analysis are handled by our team — never outsourced. That’s how we keep quality consistent and the work accountable.',
    ],
    [
      'How do we get started?',
      'It starts with a free call. We go through your current email and SMS setup together, and you’ll walk away with a clear picture of what your program is leaving on the table — whether or not we end up working together.',
    ],
  ]

  return answers.map(([question, answer]) => ({
    question,
    answer: [{ type: 'paragraph', children: [{ type: 'text', text: answer }] }],
  }))
}

/* ------------------------------------------------------------------ Exports */

export const PAGE_BLUEPRINTS: PageBlueprint[] = [
  home,
  about,
  services,
  process,
  caseStudies,
  contact,
  book,
]

const BY_SLUG = new Map(PAGE_BLUEPRINTS.map((blueprint) => [blueprint.slug, blueprint]))

export function getBlueprint(slug: string): PageBlueprint | undefined {
  return BY_SLUG.get(slug)
}
