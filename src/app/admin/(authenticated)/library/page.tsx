import Link from 'next/link'

import { AdminPageHeader } from '@/features/admin/shell/admin-shell'

export const metadata = { title: 'Library' }

/**
 * The content library index.
 *
 * These entities are referenced by id from page sections and resolved at render
 * time, so editing one updates every page showing it without a republish.
 */
const SECTIONS = [
  {
    href: '/admin/library/testimonials',
    title: 'Testimonials',
    description: 'Client quotes shown on the homepage and the about page.',
  },
  {
    href: '/admin/library/partner-logos',
    title: 'Client logos',
    description: 'The logo strip under the homepage hero.',
  },
]

export default function LibraryIndex() {
  return (
    <>
      <AdminPageHeader
        title="Library"
        description="Reusable content. Editing an entry updates everywhere it appears."
      />

      <div className="grid gap-4 sm:grid-cols-2">
        {SECTIONS.map((section) => (
          <Link
            key={section.href}
            href={section.href}
            className="rounded-lg border border-border bg-card p-5 transition-colors hover:border-ink-300"
          >
            <h2 className="text-sm font-medium text-ink-900">{section.title}</h2>
            <p className="mt-1 text-sm text-ink-500">{section.description}</p>
          </Link>
        ))}
      </div>
    </>
  )
}
