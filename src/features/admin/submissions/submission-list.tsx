'use client'

import { useState, useTransition } from 'react'

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/field'
import { formatRelative } from '@/lib/format'
import type { SubmissionStatus } from '@/generated/prisma/enums'
import type { SubmissionSummary } from '@/server/submissions/queries'

import { removeSubmission, setSubmissionNotes, setSubmissionStatus } from './actions'

/**
 * The enquiry inbox.
 *
 * A lead is worked from the list — read it, change its status, jot a note —
 * rather than from a detail page, because the whole record is four fields and
 * a message. Expanding a row in place keeps the queue visible while you work.
 */
const STATUSES: SubmissionStatus[] = [
  'NEW',
  'READ',
  'REPLIED',
  'BOOKED',
  'ARCHIVED',
  'SPAM',
]

const STATUS_CLASS: Record<SubmissionStatus, string> = {
  NEW: 'bg-accent-50 text-accent-700',
  READ: 'bg-ink-100 text-ink-700',
  REPLIED: 'bg-ink-100 text-ink-700',
  BOOKED: 'bg-success/10 text-success',
  ARCHIVED: 'bg-ink-100 text-ink-500',
  SPAM: 'bg-destructive/10 text-destructive',
}

export function SubmissionList({
  rows,
  detail,
}: {
  rows: SubmissionSummary[]
  detail: Record<
    string,
    {
      message: string
      websiteUrl: string | null
      adminNotes: string | null
      source: string | null
    }
  >
}) {
  const [openId, setOpenId] = useState<string | null>(null)

  if (rows.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border px-4 py-12 text-center text-sm text-ink-500">
        No enquiries yet.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {rows.map((row) => {
        const isOpen = openId === row.id
        const extra = detail[row.id]

        return (
          <div key={row.id} className="rounded-lg border border-border bg-card">
            <button
              type="button"
              onClick={() => setOpenId(isOpen ? null : row.id)}
              aria-expanded={isOpen}
              className="flex w-full items-start gap-4 p-5 text-left"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-ink-900">{row.name}</span>
                  {row.company && (
                    <span className="text-sm text-ink-500">· {row.company}</span>
                  )}
                  <span
                    className={`rounded px-2 py-0.5 text-xs font-medium ${STATUS_CLASS[row.status]}`}
                  >
                    {row.status}
                  </span>
                  {!row.notifiedAt && (
                    <span
                      className="rounded bg-warning/15 px-2 py-0.5 text-xs text-ink-800"
                      title="The notification email did not go out. Follow up by hand."
                    >
                      Not emailed
                    </span>
                  )}
                </div>
                <p className="mt-1.5 truncate text-sm text-ink-600">{row.excerpt}</p>
                <p className="mt-1 text-xs text-ink-500">
                  {row.email}
                  {row.monthlyRevenue && ` · ${row.monthlyRevenue}`} ·{' '}
                  {formatRelative(row.createdAt)}
                </p>
              </div>
              <span aria-hidden className="text-ink-400">
                {isOpen ? '−' : '+'}
              </span>
            </button>

            {isOpen && extra && (
              <ExpandedSubmission id={row.id} status={row.status} extra={extra} />
            )}
          </div>
        )
      })}
    </div>
  )
}

function ExpandedSubmission({
  id,
  status,
  extra,
}: {
  id: string
  status: SubmissionStatus
  extra: {
    message: string
    websiteUrl: string | null
    adminNotes: string | null
    source: string | null
  }
}) {
  const [notes, setNotes] = useState(extra.adminNotes ?? '')
  const [isSaving, startSaving] = useTransition()
  const [isDeleting, startDeleting] = useTransition()
  const [confirming, setConfirming] = useState(false)

  return (
    <div className="border-t border-border px-5 py-5">
      <p className="text-sm whitespace-pre-wrap text-ink-800">{extra.message}</p>

      <dl className="mt-4 flex flex-wrap gap-x-8 gap-y-2 text-xs text-ink-500">
        {extra.websiteUrl && (
          <div>
            <dt className="inline">Website: </dt>
            <dd className="inline text-ink-700">{extra.websiteUrl}</dd>
          </div>
        )}
        {extra.source && (
          <div>
            <dt className="inline">Page: </dt>
            <dd className="inline text-ink-700">{extra.source}</dd>
          </div>
        )}
      </dl>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        {STATUSES.map((candidate) => (
          <Button
            key={candidate}
            size="sm"
            variant={candidate === status ? 'primary' : 'secondary'}
            onClick={() => startSaving(() => void setSubmissionStatus(id, candidate))}
            disabled={isSaving}
          >
            {candidate}
          </Button>
        ))}
      </div>

      <div className="mt-5">
        <Textarea
          rows={2}
          value={notes}
          placeholder="Internal notes…"
          aria-label="Internal notes"
          onChange={(event) => setNotes(event.target.value)}
        />
        <div className="mt-2 flex items-center justify-between gap-3">
          <Button
            size="sm"
            variant="secondary"
            disabled={isSaving}
            onClick={() => startSaving(() => void setSubmissionNotes(id, notes))}
          >
            Save note
          </Button>

          {confirming ? (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="destructive"
                disabled={isDeleting}
                onClick={() => startDeleting(() => void removeSubmission(id))}
              >
                {isDeleting ? 'Deleting…' : 'Delete permanently'}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setConfirming(false)}>
                Cancel
              </Button>
            </div>
          ) : (
            <Button size="sm" variant="ghost" onClick={() => setConfirming(true)}>
              Delete
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
