export const site = {
  name: 'Kova Media Group',
  shortName: 'Kova',
  email: 'hello@kovamediagroup.com',
  linkedin: 'https://www.linkedin.com/company/kova-media-group',
  tagline: 'Email & SMS marketing that drives revenue.',
}

export const nav = [
  { label: 'Services', href: '/services' },
  { label: 'Case Studies', href: '/case-studies' },
  { label: 'Process', href: '/process' },
  { label: 'About', href: '/about' },
  { label: 'Resources', href: '/resources' },
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

export const services: Service[] = [
  {
    slug: 'email-campaigns',
    title: 'Email Campaign Management',
    summary: 'Campaigns tailored to your voice, your audience, and your calendar.',
    description:
      'A planned send calendar built around launches, promotions, and the moments that matter to your customers. Every campaign is designed, written, and measured in-house.',
    points: ['Strategy & calendar planning', 'Segmentation', 'A/B testing', 'Weekly reporting'],
  },
  {
    slug: 'automated-flows',
    title: 'Automated Email Flows',
    summary: 'Always-on automations that recover revenue while you sleep.',
    description:
      'Welcome, browse and cart abandonment, post-purchase, win-back, and replenishment flows that quietly compound. We build, test, and refine each one against real behavior.',
    points: ['Welcome & lead nurture', 'Abandonment recovery', 'Post-purchase', 'Win-back'],
  },
  {
    slug: 'sms-marketing',
    title: 'SMS Marketing',
    summary: 'Clear, concise texts for drops, deals, and real-time engagement.',
    description:
      'Reach customers instantly with messages that respect their attention. We manage list growth, compliance, timing, and the creative that makes SMS convert.',
    points: ['List growth & compliance', 'Campaign sends', 'Automated SMS flows', 'Timing strategy'],
  },
  {
    slug: 'klaviyo-management',
    title: 'Klaviyo Management',
    summary: 'Certified management of your most valuable owned channel.',
    description:
      'From account architecture to advanced segmentation, we run Klaviyo end to end so your data, flows, and campaigns work as one system.',
    points: ['Account architecture', 'Advanced segmentation', 'Deliverability', 'Integrations'],
  },
  {
    slug: 'sendlane-management',
    title: 'Sendlane Management',
    summary: 'Unified email and SMS on a single platform, managed for you.',
    description:
      'We plan, build, and optimize campaigns and automations in Sendlane, keeping email and SMS working together toward one revenue goal.',
    points: ['Migration & setup', 'Unified automations', 'Reporting', 'Optimization'],
  },
  {
    slug: 'email-design',
    title: 'Email Design',
    summary: 'On-brand emails engineered to render perfectly everywhere.',
    description:
      'Considered layouts and typography that reflect the quality of your product, hand-built to look right across every client and device.',
    points: ['Bespoke templates', 'Modular systems', 'Dark-mode ready', 'Accessible markup'],
  },
  {
    slug: 'email-copywriting',
    title: 'Email Copywriting',
    summary: 'Words that sound like your brand and move customers to act.',
    description:
      'Copy that earns the open and the click without shouting. We write in your voice, backed by testing, not guesswork.',
    points: ['Brand voice', 'Subject-line testing', 'Story-driven sequences', 'Clear calls to action'],
  },
  {
    slug: 'list-growth',
    title: 'List Growth',
    summary: 'Grow a list of buyers, not just subscribers.',
    description:
      'High-intent capture through thoughtful pop-ups, offers, and landing pages that build a subscriber base worth marketing to.',
    points: ['Sign-up strategy', 'On-site capture', 'Lead magnets', 'Quality over volume'],
  },
  {
    slug: 'deliverability',
    title: 'Deliverability',
    summary: 'Reach the inbox, not the promotions tab or spam folder.',
    description:
      'Authentication, list hygiene, and sending reputation managed continuously so the revenue you build actually lands.',
    points: ['SPF, DKIM, DMARC', 'Reputation monitoring', 'List cleaning', 'Warm-up plans'],
  },
  {
    slug: 'reporting-analytics',
    title: 'Reporting & Analytics',
    summary: 'Clear numbers tied to revenue, reviewed every week.',
    description:
      'No vanity metrics. We report on what email and SMS contribute to the business and what we are doing to grow it.',
    points: ['Revenue attribution', 'Cohort analysis', 'Weekly reviews', 'Quarterly strategy'],
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

export const testimonials = [
  {
    quote:
      'Kova treated email like a core part of the business, not a checkbox. Within a few months it became one of our most reliable revenue channels.',
    name: 'Founder',
    role: 'DTC Consumer Brand',
  },
  {
    quote:
      'They understood our brand voice immediately. The emails finally sound like us, and the numbers speak for themselves.',
    name: 'Ecommerce Manager',
    role: 'Family & Lifestyle Brand',
  },
  {
    quote:
      'Clear communication, real strategy, and no fluff. We always know what’s being worked on and why.',
    name: 'Marketing Director',
    role: 'Home Goods Brand',
  },
]

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
    a: 'We manage Klaviyo and Sendlane end to end, and we can advise on migrations between platforms when it makes sense for the business.',
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

export type Resource = {
  slug: string
  title: string
  excerpt: string
  category: string
  readTime: string
  date: string
}

export const resources: Resource[] = [
  {
    slug: 'flows-every-store-needs',
    title: 'The email flows every ecommerce store should have live',
    excerpt:
      'A practical breakdown of the automations that quietly drive the majority of email revenue — and how to prioritize building them.',
    category: 'Automation',
    readTime: '6 min read',
    date: '2026-01-14',
  },
  {
    slug: 'deliverability-fundamentals',
    title: 'Deliverability fundamentals: how to actually reach the inbox',
    excerpt:
      'Authentication, list hygiene, and sending reputation explained without the jargon — plus the mistakes that quietly hurt your sender score.',
    category: 'Deliverability',
    readTime: '8 min read',
    date: '2026-01-02',
  },
  {
    slug: 'segmentation-that-works',
    title: 'Segmentation that works: fewer sends, more revenue',
    excerpt:
      'Why sending less to the right people beats blasting your whole list, and a simple framework to start segmenting today.',
    category: 'Strategy',
    readTime: '5 min read',
    date: '2025-12-18',
  },
  {
    slug: 'sms-without-annoying-customers',
    title: 'Using SMS without annoying your customers',
    excerpt:
      'SMS is the most personal channel you have. Here’s how to grow a compliant list and use it for the moments that genuinely matter.',
    category: 'SMS',
    readTime: '6 min read',
    date: '2025-12-05',
  },
  {
    slug: 'campaign-calendar',
    title: 'How to build a campaign calendar that compounds',
    excerpt:
      'A repeatable planning system for consistent, on-brand sends that build momentum instead of one-off spikes.',
    category: 'Strategy',
    readTime: '7 min read',
    date: '2025-11-20',
  },
  {
    slug: 'welcome-flow-teardown',
    title: 'Anatomy of a welcome flow that converts',
    excerpt:
      'A step-by-step teardown of a high-performing welcome series, from the first email to the moment a subscriber becomes a buyer.',
    category: 'Automation',
    readTime: '9 min read',
    date: '2025-11-06',
  },
]
