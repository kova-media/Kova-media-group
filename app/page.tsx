import { Hero } from '@/components/home/hero'
import { ClientMarquee, MetricsRow, Testimonials, Faq, FinalCta } from '@/components/site/sections'
import {
  ServicesPreview,
  FeaturedCaseStudies,
  ProcessPreview,
  AboutPreview,
  ResourcesPreview,
} from '@/components/home/sections'

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
