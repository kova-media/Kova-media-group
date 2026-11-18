'use client'

import { motion, useInView } from 'motion/react'
import { useRef } from 'react'
import { cn } from '@/lib/utils'
import { Mail, MessageSquare, TrendingUp, MousePointerClick } from 'lucide-react'

const ease = [0.16, 1, 0.3, 1] as const

/*
 * The automation flow diagram, rendered by the process sections.
 *
 * The hero mockups used to live in this file too — the reporting panel, the
 * email preview and the SMS thread — but they were illustrative example data,
 * and they left with the hero that rendered them.
 */

/* --------------------------------------------------------------- Automation flow */

export type FlowStep = {
  label: string
  kind: 'trigger' | 'action' | 'wait' | 'goal'
  icon: 'none' | 'click' | 'mail' | 'sms' | 'trend'
  badge: string
}

/** Closed set: the admin picks from these, it cannot introduce a new glyph. */
const FLOW_ICONS = {
  none: null,
  click: MousePointerClick,
  mail: Mail,
  sms: MessageSquare,
  trend: TrendingUp,
} as const

/**
 * Each step used to be an icon tile *plus* a separate bordered pill holding the
 * label, inside a rounded card — three nested surfaces to render one word. The
 * label now sits as plain text on the connector rule, so the diagram has one
 * frame instead of three per row.
 */
export function FlowDiagram({
  className,
  title,
  steps,
}: {
  className?: string
  title?: string
  steps?: FlowStep[]
}) {
  const flowNodes = (steps ?? []).filter((step) => step.label?.trim())

  // Nothing to draw is not an empty bordered box on the page. Hooks run first —
  // the early return has to sit below them.
  if (flowNodes.length === 0 && !title?.trim()) return null

  return (
    <div
      className={cn(
        'w-full max-w-[380px] border border-border bg-card p-6 shadow-[var(--shadow-soft)]',
        className,
      )}
    >
      {title?.trim() && (
        <p className="mb-6 text-[0.8125rem] font-medium tracking-[0.06em] text-foreground/65 uppercase">
          {title}
        </p>
      )}
      <div className="flex flex-col">
        {flowNodes.map((node, i) => {
          const Icon = FLOW_ICONS[node.icon] ?? null
          return (
            <div key={`${node.label}-${i}`}>
              <div className="flex items-center gap-4">
                <div
                  className={cn(
                    'flex h-9 w-9 shrink-0 items-center justify-center border text-xs',
                    node.kind === 'trigger' && 'border-brand/40 bg-brand/10 text-brand',
                    node.kind === 'goal' &&
                      'border-foreground/15 bg-foreground text-background',
                    (node.kind === 'action' || node.kind === 'wait') &&
                      'border-border bg-surface text-foreground',
                  )}
                >
                  {Icon ? (
                    <Icon className="h-4 w-4" />
                  ) : (
                    <span className="font-mono">{node.badge}</span>
                  )}
                </div>
                <p className="text-[0.9375rem] font-medium text-foreground">
                  {node.label}
                </p>
              </div>
              {i < flowNodes.length - 1 && (
                <div className="ml-[1.125rem] h-5 w-px bg-border-strong" />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
