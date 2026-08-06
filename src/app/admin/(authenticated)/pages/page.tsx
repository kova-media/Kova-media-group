import Link from 'next/link'

import { buttonClasses } from '@/components/ui/button'
import { AdminPageHeader } from '@/features/admin/shell/admin-shell'
import { listPages } from '@/server/content/admin-queries'
import type { PageStatus } from '@/server/content/types'

export const metadata = { title: 'Pages' }

const STATUS_LABEL: Record<PageStatus, string> = {
  DRAFT: 'Draft',
  LIVE: 'Live',
  LIVE_WITH_CHANGES: 'Live · unpublished changes',
  UNPUBLISHED: 'Unpublished',
}

const STATUS_CLASS: Record<PageStatus, string> = {
  DRAFT: 'bg-ink-100 text-ink-700',
  LIVE: 'bg-success/10 text-success',
  LIVE_WITH_CHANGES: 'bg-warning/15 text-ink-800',
  UNPUBLISHED: 'bg-ink-100 text-ink-600',
}

export default async function PagesIndex() {
  const pages = await listPages()

  return (
    <>
      <AdminPageHeader
        title="Pages"
        description="Every page on the site."
        actions={
          <Link href="/admin/pages/new" className={buttonClasses({ size: 'sm' })}>
            New page
          </Link>
        }
      />

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-paper-sunk">
            <tr className="text-left text-ink-600">
              <th className="px-4 py-2.5 font-medium">Title</th>
              <th className="px-4 py-2.5 font-medium">URL</th>
              <th className="px-4 py-2.5 font-medium">Sections</th>
              <th className="px-4 py-2.5 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {pages.map((page) => (
              <tr key={page.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/pages/${page.id}`}
                    className="font-medium text-ink-900 hover:underline"
                  >
                    {page.title}
                  </Link>
                  {page.isSystem && (
                    <span className="ml-2 text-xs text-ink-500">System</span>
                  )}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-ink-600">
                  /{page.slug}
                </td>
                <td className="px-4 py-3 text-ink-600">{page.sectionCount}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded px-2 py-0.5 text-xs font-medium ${STATUS_CLASS[page.status]}`}
                  >
                    {STATUS_LABEL[page.status]}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {pages.length === 0 && (
          <p className="px-4 py-10 text-center text-sm text-ink-500">
            No pages yet. Run the seed or create one.
          </p>
        )}
      </div>
    </>
  )
}
