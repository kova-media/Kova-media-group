import Link from 'next/link'

import { buttonClasses } from '@/components/ui/button'
import { AdminPageHeader } from '@/features/admin/shell/admin-shell'
import { listResourcesForAdmin } from '@/server/content/resource-queries'
import type { PageStatus } from '@/server/content/types'

export const metadata = { title: 'Resources' }

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

export default async function ResourcesIndex() {
  const rows = await listResourcesForAdmin()

  return (
    <>
      <AdminPageHeader
        title="Resources"
        description="Articles for the resource centre."
        actions={
          <Link href="/admin/resources/new" className={buttonClasses({ size: 'sm' })}>
            New article
          </Link>
        }
      />

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-paper-sunk">
            <tr className="text-left text-ink-600">
              <th className="px-4 py-2.5 font-medium">Title</th>
              <th className="px-4 py-2.5 font-medium">Category</th>
              <th className="px-4 py-2.5 font-medium">Featured</th>
              <th className="px-4 py-2.5 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/resources/${row.id}`}
                    className="font-medium text-ink-900 hover:underline"
                  >
                    {row.title}
                  </Link>
                  <span className="mt-0.5 block max-w-md truncate text-xs text-ink-500">
                    /resources/{row.slug}
                  </span>
                </td>
                <td className="px-4 py-3 text-ink-600">{row.category}</td>
                <td className="px-4 py-3 text-ink-600">
                  {row.isFeatured ? 'Yes' : '—'}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded px-2 py-0.5 text-xs font-medium ${STATUS_CLASS[row.status]}`}
                  >
                    {STATUS_LABEL[row.status]}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {rows.length === 0 && (
          <p className="px-4 py-10 text-center text-sm text-ink-500">
            No articles yet. The resources page falls back to the bundled set until you
            publish one.
          </p>
        )}
      </div>
    </>
  )
}
