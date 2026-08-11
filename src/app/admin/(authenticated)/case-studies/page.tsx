import Link from 'next/link'

import { buttonClasses } from '@/components/ui/button'
import { AdminPageHeader } from '@/features/admin/shell/admin-shell'
import { listCaseStudies } from '@/server/content/admin-queries'
import type { PageStatus } from '@/server/content/types'

export const metadata = { title: 'Case studies' }

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

export default async function CaseStudiesIndex() {
  const studies = await listCaseStudies()

  return (
    <>
      <AdminPageHeader
        title="Case studies"
        description="Client work. Featured studies appear on the homepage."
        actions={
          <Link
            href="/admin/case-studies/new"
            className={buttonClasses({ size: 'sm' })}
          >
            New case study
          </Link>
        }
      />

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-paper-sunk">
            <tr className="text-left text-ink-600">
              <th className="px-4 py-2.5 font-medium">Client</th>
              <th className="px-4 py-2.5 font-medium">URL</th>
              <th className="px-4 py-2.5 font-medium">Featured</th>
              <th className="px-4 py-2.5 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {studies.map((study) => (
              <tr key={study.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/case-studies/${study.id}`}
                    className="font-medium text-ink-900 hover:underline"
                  >
                    {study.clientName}
                  </Link>
                  <span className="mt-0.5 block max-w-md truncate text-xs text-ink-500">
                    {study.headline}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-ink-600">
                  /case-studies/{study.slug}
                </td>
                <td className="px-4 py-3 text-ink-600">
                  {study.isFeatured ? 'Yes' : '—'}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded px-2 py-0.5 text-xs font-medium ${STATUS_CLASS[study.status]}`}
                  >
                    {STATUS_LABEL[study.status]}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {studies.length === 0 && (
          <p className="px-4 py-10 text-center text-sm text-ink-500">
            No case studies yet. Create one to get started.
          </p>
        )}
      </div>
    </>
  )
}
