'use client'

import { motion, useInView, useReducedMotion } from 'motion/react'
import { useRef } from 'react'
import { cn } from '@/lib/utils'
import { Mail, MessageSquare, TrendingUp, MousePointerClick } from 'lucide-react'

const ease = [0.16, 1, 0.3, 1] as const

/*
 * The hero mockups: an email preview, an SMS thread, and the reporting panel.
 *
 * These are restored from 4621cfd, which is where the composition the hero is
 * built around originally lived. Two things are deliberately different from
 * that version.
 *
 * The labels are readable. The originals set the sender line, the SMS bubbles,
 * and the stat keys at `text-[10px]`/`text-[11px]`, which is small enough that
 * the panels read as texture rather than as an interface. They are now at
 * `text-xs` and up.
 *
 * And they are choreographed rather than independently animated. A `beat`
 * passed down from the hero moves through the composition — the email lights,
 * then the SMS reply lands — so the three panels read as one system doing one
 * thing. See the hero for why that matters.
 *
 * The figures are fixed and do not drift: the revenue counts up once when the
 * panel first comes into view and then holds at its stated value.
 */

/* ---------------------------------------------------------------- Email preview */

export function EmailCard({
  className,
  beat = 0,
}: {
  className?: string
  beat?: number
}) {
  const still = useReducedMotion() === true

  return (
    <div
      className={cn(
        'w-full max-w-[300px] overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-lift)]',
        className,
      )}
    >
      <div className="flex items-center gap-2.5 border-b border-border px-4 py-3">
        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-foreground text-background">
          <Mail className="h-3.5 w-3.5" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-[0.8125rem] font-medium text-foreground">
            Your cart misses you
          </p>
          <p className="truncate text-xs text-muted-foreground">Kova Brand · now</p>
        </div>
      </div>
      <div className="space-y-3 p-4">
        <div className="aspect-[4/3] w-full rounded-lg bg-muted" />
        <div className="h-2.5 w-4/5 rounded-full bg-foreground/85" />
        <div className="space-y-1.5">
          <div className="h-2 w-full rounded-full bg-border-strong" />
          <div className="h-2 w-11/12 rounded-full bg-border-strong" />
          <div className="h-2 w-3/5 rounded-full bg-border-strong" />
        </div>
        {/* The send: the CTA lifts on each beat, a moment before the SMS
            reply lands next door. */}
        <motion.div
          key={still ? 'static' : beat}
          initial={{ scale: 1 }}
          animate={still ? { scale: 1 } : { scale: [1, 1.04, 1] }}
          transition={{ duration: 0.9, ease }}
          className="mt-1 inline-flex h-8 items-center rounded-full bg-brand px-4 text-xs font-medium text-brand-foreground"
        >
          Complete your order
        </motion.div>
      </div>
    </div>
  )
}

/* --------------------------------------------------------------------- SMS card */

export function SmsCard({
  className,
  beat = 0,
}: {
  className?: string
  beat?: number
}) {
  const still = useReducedMotion() === true

  return (
    <div
      className={cn(
        'w-full max-w-[240px] rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-soft)]',
        className,
      )}
    >
      <div className="mb-3 flex items-center gap-2.5">
        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-brand/10 text-brand">
          <MessageSquare className="h-3.5 w-3.5" />
        </span>
        <p className="text-[0.8125rem] font-medium text-foreground">SMS</p>
      </div>
      <div className="space-y-2">
        <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-muted px-3 py-2 text-xs leading-snug text-foreground">
          The drop is live. Early access for you — 2 hours only.
        </div>
        {/* The reply arrives on the beat, just after the email CTA lifts. */}
        <motion.div
          key={still ? 'static' : beat}
          initial={still ? false : { opacity: 0, y: 8, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.55, delay: 0.45, ease }}
          className="ml-auto max-w-[75%] rounded-2xl rounded-tr-sm bg-brand px-3 py-2 text-xs leading-snug text-brand-foreground"
        >
          On my way 🛒
        </motion.div>
      </div>
    </div>
  )
}

/* ----------------------------------------------------------- Analytics dashboard */

const bars = [38, 52, 44, 66, 58, 78, 72, 92]

/**
 * The figure renders at its value immediately and does not count up.
 *
 * A count-up has to start somewhere, and starting at zero means the server
 * renders `$0` and every visitor whose JavaScript is a beat slow sees a zero
 * sitting where the number should be. That is worse than no animation: the one
 * element in the composition that is supposed to read as a result reads as
 * nothing at all. The bars already carry the panel's motion.
 */
const REVENUE = 248910

export function DashboardCard({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '0px 0px -10% 0px' })

  return (
    <div
      ref={ref}
      className={cn(
        'w-full max-w-[380px] rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-lift)]',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium tracking-[0.12em] text-foreground/65 uppercase">
            Attributed revenue
          </p>
          <div className="mt-1.5 flex items-end gap-2">
            <span className="text-3xl font-semibold tracking-tight text-foreground tabular-nums">
              ${REVENUE.toLocaleString('en-US')}
            </span>
            <span className="mb-1 inline-flex items-center gap-1 text-[0.8125rem] font-medium text-brand">
              <TrendingUp className="h-3.5 w-3.5" /> +35%
            </span>
          </div>
        </div>
        <span className="rounded-md bg-muted px-2 py-1 font-mono text-xs text-muted-foreground">
          30d
        </span>
      </div>

      <div className="mt-6 flex h-28 items-end gap-2">
        {bars.map((h, i) => (
          <motion.div
            key={i}
            className="flex-1 rounded-t-sm"
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

      <div className="mt-5 grid grid-cols-3 gap-3 border-t border-border pt-4">
        {[
          { k: 'Open rate', v: '52.4%' },
          { k: 'Click rate', v: '4.9%' },
          { k: 'Flows live', v: '9' },
        ].map((s) => (
          <div key={s.k}>
            <p className="text-base font-semibold text-foreground tabular-nums">
              {s.v}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">{s.k}</p>
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
