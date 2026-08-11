import { Hero } from '@/features/marketing/home/hero'
import {
  ClientMarquee,
  MetricsRow,
  Testimonials,
  Faq,
  FinalCta,
} from '@/features/marketing/sections'
import {
  ServicesPreview,
  FeaturedCaseStudies,
  ProcessPreview,
  AboutPreview,
  ResourcesPreview,
} from '@/features/marketing/home/sections'
import { getFaqItems } from '@/server/content/faq'
import { getCaseStudyList, getTestimonialList } from '@/server/content/site-content'

/**
 * The homepage.
 *
 * The composition is the v0 design and is fixed — the sections and their order
 * are a designed narrative, not a CMS-arranged page. What the CMS controls is
 * the *content* inside them: the case studies, the quotes, the FAQ.
 *
 * Everything is read in parallel from cached, tag-invalidated queries, so a
 * warm cache performs no database work at all.
 */
export default async function HomePage() {
  const [caseStudies, quotes, faqItems] = await Promise.all([
    getCaseStudyList(),
    getTestimonialList(),
    getFaqItems(),
  ])

  return (
    <>
      <Hero />
      <ClientMarquee />
      <MetricsRow />
      <ServicesPreview />
      <FeaturedCaseStudies studies={caseStudies} />
      <ProcessPreview />
      <AboutPreview />
      <Testimonials quotes={quotes} />
      <ResourcesPreview />
      <Faq items={faqItems} />
      <FinalCta />
    </>
  )
}
