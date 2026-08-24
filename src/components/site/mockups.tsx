'use client'

import { motion, useInView } from 'motion/react'
import { useRef } from 'react'
import { cn } from '@/lib/utils'
import { Mail, MessageSquare, TrendingUp, MousePointerClick } from 'lucide-react'

const ease = [0.16, 1, 0.3, 1] as const

/*
 * `EmailCard` and `SmsCard` used to live here. They were the two satellites in
 * the hero's rotated 3D stack; when that composition was replaced by a single
 * flat panel they had no remaining caller, so they are gone rather than left as
 * dead exports. Between them they carried three `text-[10px]` labels and the
 * only `bg-gradient-to-br` on the marketing site.
 *
 * What survives are the two artefacts that depict something real: a reporting
 * panel and an automation flow. These are allowed to be bordered surfaces —
 * they are pictures of software, and software has panels. That is different
 * from wrapping prose in a card, which is what the rest of this work removed.
 */

/* ------------------------------------------------------------- Analytics dashboard */

const bars = [38, 52, 44, 66, 58, 78, 72, 92]

export function DashboardCard({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '0px 0px -10% 0px' })

  return (
    <div
      ref={ref}
      className={cn(
        'w-full max-w-[400px] border border-border bg-card p-6 shadow-[var(--shadow-soft)]',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[0.8125rem] font-medium tracking-[0.06em] text-foreground/65 uppercase">
            Attributed revenue
          </p>
          <div className="mt-2 flex items-end gap-2.5">
            <span className="text-3xl font-semibold tracking-tight text-foreground tabular-nums">
              $248,910
            </span>
            <span className="mb-1 inline-flex items-center gap-1 text-sm font-medium text-brand">
              <TrendingUp className="h-3.5 w-3.5" /> +35%
            </span>
          </div>
        </div>
        <span className="font-mono text-xs text-muted-foreground">30d</span>
      </div>

      <div className="mt-7 flex h-32 items-end gap-2">
        {bars.map((h, i) => (
          <motion.div
            key={i}
            className="flex-1"
            style={{
              backgroundColor:
                i === bars.length - 1 ? 'var(--brand)' : 'var(--border-strong)',
            }}
            initial={{ height: 0 }}
            animate={inView ? { height: `${h}%` } : { height: 0 }}
            transition={{ duration: 0.9, delay: i * 0.06, ease }}
          />
        ))}
      </div>

      <div className="mt-6 grid grid-cols-3 gap-4 border-t border-border pt-5">
        {[
          { k: 'Open rate', v: '52.4%' },
          { k: 'Click rate', v: '4.9%' },
          { k: 'Flows live', v: '9' },
        ].map((s) => (
          <div key={s.k}>
            <p className="text-base font-semibold text-foreground tabular-nums">
              {s.v}
            </p>
            <p className="mt-0.5 text-[0.8125rem] text-muted-foreground">{s.k}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

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
