'use client'

import { motion, useInView } from 'motion/react'
import { useRef } from 'react'
import { cn } from '@/lib/utils'
import { Mail, MessageSquare, TrendingUp, MousePointerClick } from 'lucide-react'

const ease = [0.16, 1, 0.3, 1] as const

/*
 * This file held four mockups at various points: `EmailCard`, `SmsCard`,
 * `DashboardCard` and `MessageStream`. All four were hero furniture, and all
 * four are gone.
 *
 * `DashboardCard` and `MessageStream` are worth recording rather than quietly
 * deleting, because they were removed for a content reason and not a visual
 * one. Between them they displayed an attributed-revenue figure, a percentage
 * uplift, open and click rates, a live flow count, and two recipient counts —
 * every one of which was invented to make the mockup look convincing. This site
 * removed fabricated testimonials in 57fb9a2 and unverified claims in 4621cfd,
 * and `docs/DESIGN.md` states the rule plainly. Invented numbers in a picture
 * of a product are the same thing as invented numbers in a sentence.
 *
 * What remains is the automation flow, which names steps and no quantities.
 * It is allowed to be a bordered surface: it is a picture of software, and
 * software has panels. That is different from wrapping prose in a card.
 */

/* --------------------------------------------------------------- Automation flow */

const flowNodes = [
  { label: 'Subscribes', icon: MousePointerClick, kind: 'trigger' },
  { label: 'Welcome email', icon: Mail, kind: 'action' },
  { label: 'Wait 2 days', icon: null, kind: 'wait' },
  { label: 'Offer + SMS', icon: MessageSquare, kind: 'action' },
  { label: 'Converts', icon: TrendingUp, kind: 'goal' },
]

/**
 * Each step used to be an icon tile *plus* a separate bordered pill holding the
 * label, inside a rounded card — three nested surfaces to render one word. The
 * label now sits as plain text on the connector rule, so the diagram has one
 * frame instead of three per row.
 */
export function FlowDiagram({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '0px 0px -15% 0px' })

  return (
    <div
      ref={ref}
      className={cn(
        'w-full max-w-[380px] border border-border bg-card p-6 shadow-[var(--shadow-soft)]',
        className,
      )}
    >
      <p className="mb-6 text-[0.8125rem] font-medium tracking-[0.06em] text-foreground/65 uppercase">
        Welcome flow
      </p>
      <div className="flex flex-col">
        {flowNodes.map((node, i) => {
          const Icon = node.icon
          return (
            <div key={node.label}>
              <motion.div
                className="flex items-center gap-4"
                initial={{ opacity: 0, x: -12 }}
                animate={inView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.6, delay: i * 0.22, ease }}
              >
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
                    <span className="font-mono">2d</span>
                  )}
                </div>
                <p className="text-[0.9375rem] font-medium text-foreground">
                  {node.label}
                </p>
              </motion.div>
              {i < flowNodes.length - 1 && (
                <motion.div
                  className="ml-[1.125rem] h-5 w-px bg-border-strong"
                  initial={{ scaleY: 0 }}
                  animate={inView ? { scaleY: 1 } : {}}
                  style={{ originY: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.22 + 0.15, ease }}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
