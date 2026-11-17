'use client'

import { useState, useTransition } from 'react'

import { Button, buttonClasses } from '@/components/ui/button'
import { Textarea } from '@/components/ui/field'
import { formatRelative } from '@/lib/format'
import type { SubmissionStatus } from '@/generated/prisma/enums'
import type { SubmissionSummary } from '@/server/submissions/queries'

import {
  removeSubmission,
  setSubmissionNotes,
  setSubmissionStatus,
} from './actions'

/**
 * The submissions inbox.
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
  emptyMessage = 'No submissions yet.',
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
  emptyMessage?: string
}) {
  const [openId, setOpenId] = useState<string | null>(null)

  if (rows.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border px-4 py-12 text-center text-sm text-ink-500">
        {emptyMessage}
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {rows.map((row) => {
        const extra = detail[row.id]
        return (
          <article
            key={row.id}
            className="rounded-lg border border-border bg-card"
          >
            <button
              type="button"
              onClick={() => setOpenId(openId === row.id ? null : row.id)}
              aria-expanded={openId === row.id}
              className="block w-full rounded-lg px-5 py-4 text-left hover:bg-ink-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink-900"
            >
              <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
                <h2 className="text-sm font-medium text-ink-900">
                  {row.name}
                  {row.companyName ? ` · ${row.companyName}` : ''}
                </h2>
                <span
                  className={`inline-flex shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_CLASS[row.status]}`}
                >
                  {row.status}
                </span>
              </div>
              <p className="mt-1 truncate text-sm text-ink-500">
                {row.email} · {row.revenueRange ?? 'Revenue not given'} ·{' '}
                {formatRelative(row.createdAt)}
              </p>
              <p className="mt-1 truncate text-sm text-ink-700">
                {row.excerpt}
              </p>
            </button>
            {openId === row.id && extra && (
              <ExpandedSubmission
                id={row.id}
                status={row.status}
                email={row.email}
                extra={extra}
              />
            )}
          </article>
        )
      })}
    </div>
  )
}

function ExpandedSubmission({
  id,
  status,
  email,
  extra,
}: {
  id: string
  status: SubmissionStatus
  email: string
  extra: {
    message: string
    websiteUrl: string | null
    adminNotes: string | null
    source: string | null
  }
}) {
  const [isPending, startTransition] = useTransition()
  const [notes, setNotes] = useState(extra.adminNotes ?? '')
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  const updateStatus = (next: SubmissionStatus) =>
    startTransition(async () => {
      await setSubmissionStatus(id, next)
    })

  return (
    <div className="border-t border-border px-5 py-5">
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink-700">
        {extra.message}
      </p>

      <div className="mt-5">
        <a
          href={`mailto:${email}`}
          className={buttonClasses({ variant: 'primary', size: 'sm' })}
        >
          Reply by email
        </a>
      </div>

      <dl className="mt-5 flex flex-col gap-2 text-sm">
        {extra.websiteUrl && (
          <div className="flex gap-2">
            <dt className="shrink-0 font-medium text-ink-900">Website</dt>
            <dd className="min-w-0 break-all text-ink-700">
              {extra.websiteUrl}
            </dd>
          </div>
        )}
        <div className="flex gap-2">
          <dt className="shrink-0 font-medium text-ink-900">Source</dt>
          <dd className="text-ink-700">{extra.source ?? 'Not recorded'}</dd>
        </div>
      </dl>

      <div className="mt-5 flex flex-wrap gap-2">
        {STATUSES.filter((candidate) => candidate !== status).map(
          (candidate) => (
            <Button
              key={candidate}
              type="button"
              variant="secondary"
              size="sm"
              disabled={isPending}
              onClick={() => updateStatus(candidate)}
            >
              Mark {candidate.toLowerCase()}
            </Button>
          ),
        )}
      </div>

      <form
        className="mt-5"
        action={async (formData: FormData) => {
          const value = formData.get('notes')
          await setSubmissionNotes(id, typeof value === 'string' ? value : '')
        }}
      >
        <label
          htmlFor={`notes-${id}`}
          className="text-sm font-medium text-ink-900"
        >
          Admin notes
        </label>
        <Textarea
          id={`notes-${id}`}
          name="notes"
          rows={3}
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Private notes — not sent to the sender."
          className="mt-2"
        />
        <Button
          type="submit"
          variant="primary"
          size="sm"
          disabled={isPending}
          className="mt-2"
        >
          Save notes
        </Button>
      </form>

      <div className="mt-5 border-t border-border pt-5">
        {confirmingDelete ? (
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm text-ink-700">
              Delete this submission? This cannot be undone.
            </p>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={isPending}
              onClick={() =>
                startTransition(async () => {
                  await removeSubmission(id)
                })
              }
            >
              Delete
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={isPending}
              onClick={() => setConfirmingDelete(false)}
            >
              Cancel
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={isPending}
            onClick={() => setConfirmingDelete(true)}
          >
            Delete submission
          </Button>
        )}
      </div>
    </div>
  )
}
