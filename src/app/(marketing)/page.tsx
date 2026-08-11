import { Hero } from '@/features/marketing/home/hero'
import { ClientMarquee, MetricsRow, Testimonials, Faq, FinalCta } from '@/features/marketing/sections'
import {
  ServicesPreview,
  FeaturedCaseStudies,
  ProcessPreview,
  AboutPreview,
  ResourcesPreview,
} from '@/features/marketing/home/sections'

export default function HomePage() {
  return (
    <>
      <Hero />
      <ClientMarquee />
      <MetricsRow />
      <ServicesPreview />
      <FeaturedCaseStudies />
      <ProcessPreview />
      <AboutPreview />
      <Testimonials />
      <ResourcesPreview />
      <Faq />
      <FinalCta />
    </>
  )
}
