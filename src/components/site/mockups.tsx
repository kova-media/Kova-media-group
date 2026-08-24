'use client'

import { motion, useInView, useReducedMotion } from 'motion/react'
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

const BASE_REVENUE = 248910

/**
 * `sends` is how many messages the paired stream has dispatched. The figure and
 * the final bar both respond to it, which is the whole point of the pairing:
 * you watch a campaign go out on the left and the revenue move on the right.
 * The increment is deliberately small — this is a live-looking readout, not a
 * slot machine.
 */
export function DashboardCard({
  className,
  sends = 0,
}: {
  className?: string
  sends?: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '0px 0px -10% 0px' })

  const revenue = BASE_REVENUE + sends * 1240

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
            <motion.span
              key={revenue}
              initial={{ opacity: 0.55 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, ease }}
              className="text-3xl font-semibold tracking-tight text-foreground tabular-nums"
            >
              ${revenue.toLocaleString('en-US')}
            </motion.span>
            <span className="mb-1 inline-flex items-center gap-1 text-sm font-medium text-brand">
              <TrendingUp className="h-3.5 w-3.5" /> +35%
            </span>
          </div>
        </div>
        <span className="inline-flex items-center gap-2 font-mono text-xs text-muted-foreground">
          <span className="relative flex h-1.5 w-1.5" aria-hidden>
            <span className="absolute inline-flex h-full w-full animate-ping bg-brand opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 bg-brand" />
          </span>
          Live
        </span>
      </div>

      <div className="mt-7 flex h-32 items-end gap-2">
        {bars.map((h, i) => {
          const isLast = i === bars.length - 1
          // The final column is the current period, so it grows as sends land.
          const height = isLast ? Math.min(100, h + sends * 1.5) : h
          return (
            <motion.div
              key={i}
              className="flex-1"
              style={{
                backgroundColor: isLast ? 'var(--brand)' : 'var(--border-strong)',
              }}
              initial={{ height: 0 }}
              animate={inView ? { height: `${height}%` } : { height: 0 }}
              transition={{
                duration: isLast ? 0.6 : 0.9,
                delay: inView && !isLast ? i * 0.06 : 0,
                ease,
              }}
            />
          )
        })}
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

/* -------------------------------------------------------------- Message stream */

const STREAM = [
  {
    kind: 'email' as const,
    title: 'Back in stock: the Everyday Tote',
    meta: 'Campaign · 24,910 recipients',
  },
  {
    kind: 'sms' as const,
    title: 'Early access is live — 2 hours only.',
    meta: 'SMS · 8,412 recipients',
  },
  {
    kind: 'email' as const,
    title: 'Your cart misses you',
    meta: 'Flow · abandoned checkout',
  },
]

/**
 * The sending side of the hero composition.
 *
 * The movement here is a teal rail that advances down the list, brightening the
 * row it lands on. That is a deliberate choice over the obvious alternative of
 * cards drifting around: the animation depicts something the product actually
 * does — messages going out on a schedule — so it reads as a live readout
 * rather than as decoration that happens to move. Nothing rotates, nothing
 * scales, and no element is stacked behind another to fake depth.
 *
 * `active` is owned by the hero so this and the revenue panel stay in step;
 * the send lands on the left and the figure moves on the right.
 */
export function MessageStream({
  className,
  active = 0,
}: {
  className?: string
  active?: number
}) {
  return (
    <div
      className={cn(
        'w-full max-w-[340px] border border-border bg-card p-6 shadow-[var(--shadow-soft)]',
        className,
      )}
    >
      <p className="mb-5 text-[0.8125rem] font-medium tracking-[0.06em] text-foreground/65 uppercase">
        Sending now
      </p>

      <div className="relative flex flex-col gap-5 pl-5">
        {/* The rail is a static hairline down the full height. Each row owns
            its own teal segment and cross-fades it in when active, so the mark
            lands exactly on the row rather than at a percentage guessed from
            the container — the rows are not all the same height. */}
        <span className="absolute top-1 bottom-1 left-0 w-px bg-border" aria-hidden />

        {STREAM.map((item, i) => {
          const isActive = i === active
          const Icon = item.kind === 'email' ? Mail : MessageSquare
          return (
            <motion.div
              key={item.title}
              className="relative flex items-start gap-3"
              animate={{ opacity: isActive ? 1 : 0.45 }}
              transition={{ duration: 0.6, ease }}
            >
              <motion.span
                className="absolute -left-5 h-full w-0.5 bg-brand"
                aria-hidden
                animate={{ opacity: isActive ? 1 : 0, scaleY: isActive ? 1 : 0.4 }}
                style={{ originY: 0.5 }}
                transition={{ duration: 0.6, ease }}
              />
              <Icon
                className={cn(
                  'mt-0.5 h-4 w-4 shrink-0 transition-colors duration-500',
                  isActive ? 'text-brand' : 'text-muted-foreground',
                )}
                aria-hidden
              />
              <div className="min-w-0">
                <p className="text-[0.9375rem] leading-snug font-medium text-foreground">
                  {item.title}
                </p>
                <p className="mt-1 text-[0.8125rem] text-muted-foreground">
                  {item.meta}
                </p>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

/**
 * A slow vertical drift. Two of these at different periods give the hero
 * composition its float without anything rotating or scaling. Returns a static
 * object when the visitor has asked for reduced motion, so the panels simply
 * sit still rather than animating at a "disabled" duration.
 */
export function useFloat(period: number, distance = 8) {
  const reduced = useReducedMotion()
  if (reduced) return {}
  return {
    animate: { y: [0, -distance, 0] },
    transition: { duration: period, repeat: Infinity, ease: 'easeInOut' as const },
  }
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
