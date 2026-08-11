import { TestimonialManager } from '@/features/admin/library/testimonial-manager'
import { AdminPageHeader } from '@/features/admin/shell/admin-shell'
import { listTestimonialsForAdmin } from '@/server/content/library-queries'

export const metadata = { title: 'Testimonials' }

export default async function TestimonialsPage() {
  const rows = await listTestimonialsForAdmin()

  return (
    <>
      <AdminPageHeader
        title="Testimonials"
        description="Order here is the order they appear on the site."
      />
      <TestimonialManager rows={rows} />
    </>
  )
}
