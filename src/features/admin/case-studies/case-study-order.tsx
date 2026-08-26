'use client'

import { useOptimistic, useTransition } from 'react'

import { Button } from '@/components/ui/button'
import type { CaseStudyAdminSummary } from '@/server/content/types'

import { reorderCaseStudiesAction } from './actions'

/**
 * Move-up / move-down controls for the case study list.
 *
 * The order set here is the order studies appear on the case study index and,
 * for the featured ones, on the homepage. Featured studies always sort above
 * the rest — that is the query, not something to fight with arrows — so the
 * buttons reorder within the whole list and the effect is visible immediately.
 *
 * Buttons rather than drag-and-drop, matching the section list: the list is
 * short, and a button is keyboard-accessible without any extra work.
 */
export function CaseStudyOrder({
  studies,
}: {
  studies: Pick<CaseStudyAdminSummary, 'id' | 'clientName'>[]
}) {
  const [isPending, startTransition] = useTransition()
  const [order, setOrder] = useOptimistic(studies)

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction
    if (target < 0 || target >= order.length) return

    const next = [...order]
    const [moved] = next.splice(index, 1)
    if (!moved) return
    next.splice(target, 0, moved)

    startTransition(async () => {
      setOrder(next)
      await reorderCaseStudiesAction(next.map((study) => study.id))
    })
  }

  if (order.length < 2) return null

  return (
    <section className="mt-6 rounded-lg border border-border bg-card p-5">
      <h2 className="text-sm font-medium text-ink-950">Order</h2>
      <p className="mt-1 mb-4 text-sm text-ink-500">
        The order studies appear in on the case studies page, and on the homepage for
        the ones marked as featured. Saved as soon as you move something.
      </p>

      <ol className="flex flex-col gap-1.5">
        {order.map((study, index) => (
          <li
            key={study.id}
            className="flex items-center gap-2 rounded-md border border-border px-3 py-2"
          >
            <span className="w-5 font-mono text-xs text-ink-500 tabular-nums">
              {index + 1}
            </span>
            <span className="min-w-0 flex-1 truncate text-sm text-ink-900">
              {study.clientName}
            </span>
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Move ${study.clientName} up`}
              disabled={index === 0 || isPending}
              onClick={() => move(index, -1)}
            >
              ↑
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Move ${study.clientName} down`}
              disabled={index === order.length - 1 || isPending}
              onClick={() => move(index, 1)}
            >
              ↓
            </Button>
          </li>
        ))}
      </ol>
    </section>
  )
}
