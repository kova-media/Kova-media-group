'use client'

import { motion, useInView, useReducedMotion } from 'motion/react'
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

/* ------------------------------------------------------------------ Automation flow */

/** A step in an automation flow, as content. Its label renders, its icon is picked from the closed set below. */
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
 * The diagram: rows stacked vertically, one icon and one label each, with a
 * connector line between them and the label sitting on the connector's left
 * side.
 *
 * A stepped zig-zag was tried first (label above a connector, icon to its
 * left) and dropped: at a third of its height the icon went missing, and a
 * diagonal on a thin rule is invisible at small sizes. The label now sits as
 * plain text on the connector rule, so the diagram has one frame instead of
 * three per row.
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
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-8% 0px' })
  const reduce = useReducedMotion()
  const still = reduce === true

  return (
    <div ref={ref} className={className}>
      {title && (
        <p className="mb-6 text-[0.8125rem] font-medium tracking-[0.08em] text-foreground/65 uppercase">
          {title}
        </p>
      )}

      <div className="flex flex-col">
        {steps?.map((step, index) => {
          const isLast = index === (steps?.length ?? 0) - 1
          const Icon = FLOW_ICONS[step.icon] ?? MousePointerClick
          return (
            <div key={step.label}>
              <motion.div
                initial={still ? false : { opacity: 0, y: 8 }}
                animate={inView ? { opacity: 1, y: 0 } : undefined}
                transition={{ duration: 0.5, ease }}
                className="flex items-center gap-4 py-3"
              >
                <span
                  className={cn(
                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-[0.8125rem] font-semibold',
                    step.kind === 'trigger' &&
                      'border-brand bg-brand/10 text-brand',
                    step.kind === 'action' &&
                      'border-foreground/15 bg-muted text-foreground',
                    step.kind === 'wait' &&
                      'border-foreground/15 bg-muted text-muted-foreground',
                    step.kind === 'goal' &&
                      'border-brand bg-brand text-primary-foreground',
                  )}
                >
                  {step.kind === 'goal' ? '✓' : <Icon className="h-4 w-4" />}
                </span>
                <span className="text-base leading-snug text-foreground">
                  {step.label}
                </span>
                <span className="ml-auto shrink-0 text-xs font-medium tracking-[0.08em] text-muted-foreground uppercase">
                  {step.badge}
                </span>
              </motion.div>
              {!isLast && (
                <div className="ml-[1.25rem] flex items-center">
                  <span aria-hidden className="h-8 w-px bg-border" />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
