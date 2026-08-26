import Link from 'next/link'

import { AdminPageHeader } from '@/features/admin/shell/admin-shell'
import { requireAdmin } from '@/server/auth/dal'
import { getDashboardStats, listPages } from '@/server/content/admin-queries'
import { listSubmissions } from '@/server/submissions/queries'

export const metadata = { title: 'Dashboard' }

/**
 * The first screen after signing in.
 *
 * Every number here is counted from the database at request time — there is no
 * analytics integration and nothing is estimated. Where there is nothing to
 * report, the card is absent rather than showing a zero dressed up as a metric:
 * an empty "0 enquiries this week" panel is noise, and a dashboard made mostly
 * of noise is the reason nobody reads dashboards.
 *
 * The two panels below the counts are the ones that are actually actionable —
 * work waiting to be published, and people waiting for a reply.
 */
export default async function AdminDashboardPage() {
  const [session, stats, pages, submissions] = await Promise.all([
    requireAdmin(),
    getDashboardStats(),
    listPages(),
    listSubmissions({ status: 'NEW', take: 5 }),
  ])

  const needsPublishing = pages.filter((page) => page.status === 'LIVE_WITH_CHANGES')
  const recent = submissions.items

  const counts = [
    {
      label: 'Pages live',
      value: `${stats.livePages}/${stats.totalPages}`,
      href: '/admin/pages',
    },
    {
      label: 'Case studies live',
      value: String(stats.liveCaseStudies),
      href: '/admin/case-studies',
    },
    {
      label: 'New enquiries',
      value: String(stats.newSubmissions),
      href: '/admin/submissions',
    },
    { label: 'Images', value: String(stats.mediaCount), href: '/admin/media' },
  ]

  return (
    <>
      <AdminPageHeader
        title={`Welcome back, ${session.name.split(' ')[0]}`}
        description="Content, submissions and site settings."
      />

      <div className="flex flex-col gap-5">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {counts.map((card) => (
            <Link
              key={card.label}
              href={card.href}
              className="duration-fast rounded-lg border border-border bg-card px-5 py-4 transition-colors hover:border-ink-300"
            >
              <p className="text-2xl font-medium text-ink-950 tabular-nums">
                {card.value}
              </p>
              <p className="mt-1 text-sm text-ink-500">{card.label}</p>
            </Link>
          ))}
        </div>

        {/* Only when a notification actually failed. A permanently green
            "emails are fine" panel trains you to stop reading it. */}
        {stats.unnotifiedSubmissions > 0 && (
          <p
            role="alert"
            className="rounded-lg border border-warning/40 bg-warning/10 px-5 py-3 text-sm text-ink-800"
          >
            {stats.unnotifiedSubmissions} enquir
            {stats.unnotifiedSubmissions === 1 ? 'y' : 'ies'} arrived but the email
            notification did not send. The{' '}
            {stats.unnotifiedSubmissions === 1 ? 'record is' : 'records are'} safe —{' '}
            <Link href="/admin/submissions" className="underline">
              read {stats.unnotifiedSubmissions === 1 ? 'it' : 'them'} here
            </Link>
            .
          </p>
        )}

        {needsPublishing.length > 0 && (
          <section className="rounded-lg border border-border bg-card">
            <h2 className="border-b border-border px-5 py-3 text-sm font-medium text-ink-950">
              Edited but not published
            </h2>
            <ul>
              {needsPublishing.map((page) => (
                <li key={page.id} className="border-b border-border last:border-0">
                  <Link
                    href={`/admin/pages/${page.id}`}
                    className="duration-fast flex items-center justify-between gap-4 px-5 py-3 transition-colors hover:bg-paper-sunk"
                  >
                    <span className="text-sm text-ink-900">{page.title}</span>
                    <span className="font-mono text-xs text-ink-500">/{page.slug}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {recent.length > 0 && (
          <section className="rounded-lg border border-border bg-card">
            <h2 className="border-b border-border px-5 py-3 text-sm font-medium text-ink-950">
              New enquiries
            </h2>
            <ul>
              {recent.map((submission) => (
                <li
                  key={submission.id}
                  className="border-b border-border last:border-0"
                >
                  <Link
                    href="/admin/submissions"
                    className="duration-fast flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-5 py-3 transition-colors hover:bg-paper-sunk"
                  >
                    <span className="text-sm text-ink-900">{submission.name}</span>
                    {submission.company && (
                      <span className="text-sm text-ink-500">{submission.company}</span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </>
  )
}
