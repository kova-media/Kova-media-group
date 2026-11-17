import Link from 'next/link'

import { Button, buttonClasses } from '@/components/ui/button'
import { Input } from '@/components/ui/field'
import { AdminPageHeader } from '@/features/admin/shell/admin-shell'
import { SubmissionList } from '@/features/admin/submissions/submission-list'
import type { SubmissionStatus } from '@/generated/prisma/enums'
import { getSubmission, listSubmissions } from '@/server/submissions/queries'

export const metadata = { title: 'Submissions' }

const STATUSES: SubmissionStatus[] = [
  'NEW',
  'READ',
  'REPLIED',
  'BOOKED',
  'ARCHIVED',
  'SPAM',
]

const PAGE_SIZE = 20

function inboxHref({
  status,
  search,
  page,
}: {
  status?: SubmissionStatus | undefined
  search?: string | undefined
  page?: number | undefined
}): string {
  const params = new URLSearchParams()
  if (status) params.set('status', status)
  if (search) params.set('q', search)
  if (page && page > 1) params.set('page', String(page))
  const query = params.toString()
  return query ? `/admin/submissions?${query}` : '/admin/submissions'
}

export default async function SubmissionsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; page?: string }>
}) {
  const params = await searchParams
  const status = STATUSES.includes(params.status as SubmissionStatus)
    ? (params.status as SubmissionStatus)
    : undefined
  const search = params.q?.trim() || undefined
  const requestedPage = Number.parseInt(params.page ?? '', 10)
  const firstPage =
    Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1

  let result = await listSubmissions({
    status,
    search,
    take: PAGE_SIZE,
    skip: (firstPage - 1) * PAGE_SIZE,
  })

  // A bookmarked page past the end of a filtered list lands on the last page
  // instead of an empty one.
  const totalPages = Math.max(1, Math.ceil(result.total / PAGE_SIZE))
  let page = firstPage
  if (page > totalPages) {
    page = totalPages
    result = await listSubmissions({
      status,
      search,
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
    })
  }

  const { items, total, counts } = result

  // The list rows carry an excerpt only; the expanded view needs the full
  // message and notes. Only the current page is fetched in full, rather than
  // every row up front.
  const details = await Promise.all(items.map((item) => getSubmission(item.id)))
  const detail = Object.fromEntries(
    details
      .filter((row) => row !== null)
      .map((row) => [
        row.id,
        {
          message: row.message,
          websiteUrl: row.websiteUrl,
          adminNotes: row.adminNotes,
          source: row.source,
        },
      ]),
  )

  const allCount = STATUSES.reduce(
    (sum, candidate) => sum + counts[candidate],
    0,
  )
  const hasFilters = status !== undefined || search !== undefined

  return (
    <>
      <AdminPageHeader
        title="Submissions"
        description={`${counts.NEW} new · ${total} shown`}
      />

      <div className="mb-6 rounded-lg border border-border bg-card p-5">
        <nav
          aria-label="Filter submissions by status"
          className="flex flex-wrap gap-2"
        >
          <Link
            href={inboxHref({ search })}
            aria-current={status === undefined ? 'page' : undefined}
            className={buttonClasses({
              variant: status === undefined ? 'primary' : 'secondary',
              size: 'sm',
            })}
          >
            All · {allCount}
          </Link>
          {STATUSES.map((candidate) => (
            <Link
              key={candidate}
              href={inboxHref({ status: candidate, search })}
              aria-current={status === candidate ? 'page' : undefined}
              className={buttonClasses({
                variant: status === candidate ? 'primary' : 'secondary',
                size: 'sm',
              })}
            >
              {candidate} · {counts[candidate]}
            </Link>
          ))}
        </nav>

        <form
          method="get"
          action="/admin/submissions"
          role="search"
          className="mt-4 flex flex-wrap items-center gap-2"
        >
          <label htmlFor="submission-search" className="sr-only">
            Search submissions
          </label>
          <Input
            id="submission-search"
            name="q"
            type="search"
            defaultValue={search ?? ''}
            placeholder="Search name, email, company or message…"
            className="w-80 max-w-full flex-1"
          />
          {status && <input type="hidden" name="status" value={status} />}
          <Button type="submit">Search</Button>
          {hasFilters && (
            <Link
              href="/admin/submissions"
              className={buttonClasses({ variant: 'secondary' })}
            >
              Clear filters
            </Link>
          )}
        </form>
      </div>

      <SubmissionList
        rows={items}
        detail={detail}
        emptyMessage={
          hasFilters ? 'No submissions match these filters.' : 'No submissions yet.'
        }
      />

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink-500">
          Page {page} of {totalPages} · {total}{' '}
          {total === 1 ? 'submission' : 'submissions'}
        </p>
        <div className="flex gap-2">
          {page > 1 ? (
            <Link
              href={inboxHref({ status, search, page: page - 1 })}
              className={buttonClasses({ variant: 'secondary', size: 'sm' })}
            >
              Previous
            </Link>
          ) : (
            <span
              aria-disabled="true"
              className={buttonClasses({
                variant: 'secondary',
                size: 'sm',
                className: 'pointer-events-none opacity-50',
              })}
            >
              Previous
            </span>
          )}
          {page < totalPages ? (
            <Link
              href={inboxHref({ status, search, page: page + 1 })}
              className={buttonClasses({ variant: 'secondary', size: 'sm' })}
            >
              Next
            </Link>
          ) : (
            <span
              aria-disabled="true"
              className={buttonClasses({
                variant: 'secondary',
                size: 'sm',
                className: 'pointer-events-none opacity-50',
              })}
            >
              Next
            </span>
          )}
        </div>
      </div>
    </>
  )
}
