'use client'

import { motion, useInView } from 'motion/react'
import { useRef } from 'react'
import { cn } from '@/lib/utils'
import { Mail, MessageSquare, TrendingUp, MousePointerClick } from 'lucide-react'

const ease = [0.16, 1, 0.3, 1] as const

/* ---------------------------------------------------------------- Email preview */

export function EmailCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'w-full max-w-[300px] overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-lift)]',
        className,
      )}
    >
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-foreground text-background">
          <Mail className="h-3.5 w-3.5" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-foreground">
            Your cart misses you
          </p>
          <p className="truncate text-[10px] text-muted-foreground">Kova Brand · now</p>
        </div>
      </div>
      <div className="space-y-3 p-4">
        <div className="aspect-[4/3] w-full rounded-lg bg-gradient-to-br from-muted to-surface" />
        <div className="h-2.5 w-4/5 rounded-full bg-foreground/85" />
        <div className="space-y-1.5">
          <div className="h-2 w-full rounded-full bg-border-strong" />
          <div className="h-2 w-11/12 rounded-full bg-border-strong" />
          <div className="h-2 w-3/5 rounded-full bg-border-strong" />
        </div>
        <div className="mt-1 inline-flex h-8 items-center rounded-full bg-brand px-4 text-[11px] font-medium text-brand-foreground">
          Complete your order
        </div>
      </div>
    </div>
  )
}

/* --------------------------------------------------------------------- SMS card */

export function SmsCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'w-full max-w-[240px] rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-soft)]',
        className,
      )}
    >
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-brand/10 text-brand">
          <MessageSquare className="h-3.5 w-3.5" />
        </span>
        <p className="text-xs font-medium text-foreground">SMS</p>
      </div>
      <div className="space-y-2">
        <div className="max-w-[80%] rounded-2xl rounded-tl-sm bg-muted px-3 py-2 text-[11px] leading-snug text-foreground">
          The drop is live. Early access for you — 2 hours only.
        </div>
        <div className="ml-auto max-w-[70%] rounded-2xl rounded-tr-sm bg-brand px-3 py-2 text-[11px] leading-snug text-brand-foreground">
          On my way 🛒
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------- Analytics dashboard */

const bars = [38, 52, 44, 66, 58, 78, 72, 92]

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
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
            Attributed revenue
          </p>
          <div className="mt-1 flex items-end gap-2">
            <span className="text-2xl font-semibold tracking-tight text-foreground">
              $248,910
            </span>
            <span className="mb-1 inline-flex items-center gap-1 text-xs font-medium text-brand">
              <TrendingUp className="h-3 w-3" /> +35%
            </span>
          </div>
        </div>
        <span className="rounded-md bg-muted px-2 py-1 font-mono text-[10px] text-muted-foreground">
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
            <p className="text-sm font-semibold text-foreground">{s.v}</p>
            <p className="text-[10px] text-muted-foreground">{s.k}</p>
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

export function FlowDiagram({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '0px 0px -15% 0px' })

  return (
    <div
      ref={ref}
      className={cn(
        'w-full max-w-[360px] rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-lift)]',
        className,
      )}
    >
      <p className="mb-4 text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
        Welcome flow
      </p>
      <div className="flex flex-col">
        {flowNodes.map((node, i) => {
          const Icon = node.icon
          return (
            <div key={node.label}>
              <motion.div
                className="flex items-center gap-3"
                initial={{ opacity: 0, x: -12 }}
                animate={inView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.6, delay: i * 0.22, ease }}
              >
                <div
                  className={cn(
                    'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border text-xs',
                    node.kind === 'trigger' && 'border-brand/30 bg-brand/10 text-brand',
                    node.kind === 'goal' &&
                      'border-foreground/15 bg-foreground text-background',
                    (node.kind === 'action' || node.kind === 'wait') &&
                      'border-border bg-muted text-foreground',
                  )}
                >
                  {Icon ? (
                    <Icon className="h-4 w-4" />
                  ) : (
                    <span className="font-mono">2d</span>
                  )}
                </div>
                <div className="flex-1 rounded-lg border border-border bg-background px-3 py-2">
                  <p className="text-xs font-medium text-foreground">{node.label}</p>
                </div>
              </motion.div>
              {i < flowNodes.length - 1 && (
                <motion.div
                  className="ml-[17px] h-5 w-px bg-border-strong"
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
