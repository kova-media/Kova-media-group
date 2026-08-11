'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'
import { ArrowRight } from 'lucide-react'
import { motion, useInView, useMotionValue, animate } from 'motion/react'
import { useEffect, useRef, useState, type ReactNode } from 'react'

type ButtonLinkProps = {
  href: string
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'ghost'
  className?: string
  withArrow?: boolean
}

export function ButtonLink({
  href,
  children,
  variant = 'primary',
  className,
  withArrow,
}: ButtonLinkProps) {
  const base =
    'group inline-flex items-center justify-center gap-2 rounded-full text-[0.95rem] font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-background'
  /**
   * `primary` is the booking CTA and is teal. It is reserved for the action the
   * whole site exists to produce — two teal buttons competing in one viewport
   * is a bug, not a style choice. Everything else stays neutral.
   */
  const variants = {
    primary:
      'bg-cta text-cta-foreground px-6 py-3 hover:bg-cta-hover hover:shadow-[0_8px_30px_rgba(20,184,166,0.28)]',
    secondary:
      'bg-transparent text-foreground px-6 py-3 border border-border-strong hover:border-foreground hover:bg-foreground/[0.03]',
    ghost: 'text-foreground px-1 py-1 hover:text-brand',
  }
  return (
    <Link href={href} className={cn(base, variants[variant], className)}>
      {children}
      {withArrow && (
        <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
      )}
    </Link>
  )
}

export function Container({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn('mx-auto w-full max-w-[76rem] px-6 md:px-8', className)}>
      {children}
    </div>
  )
}

export function Eyebrow({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 font-mono text-xs tracking-[0.2em] text-muted-foreground uppercase',
        className,
      )}
    >
      <span className="h-1 w-1 rounded-full bg-brand" aria-hidden />
      {children}
    </span>
  )
}

/** Animated number that counts up from 0 when scrolled into view. */
export function CountUp({ value, className }: { value: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '0px 0px -15% 0px' })
  const [display, setDisplay] = useState(value.replace(/[\d.]+/, '0'))
  const mv = useMotionValue(0)

  // Parse the numeric portion and its surrounding prefix/suffix (e.g. "$10M+",
  // "+22%", "2.4x"). A value with no digits at all ("Ongoing") simply renders
  // as itself — `match` is null and the animation never starts.
  const match = value.match(/([^\d]*)([\d.]+)(.*)/)
  const digits = match?.[2] ?? ''
  const prefix = match?.[1] ?? ''
  const target = digits ? parseFloat(digits) : 0
  const suffix = match?.[3] ?? ''
  const decimals = digits.includes('.') ? (digits.split('.')[1]?.length ?? 0) : 0

  useEffect(() => {
    if (!inView) return
    const controls = animate(mv, target, {
      duration: 1.6,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (latest) => {
        setDisplay(`${prefix}${latest.toFixed(decimals)}${suffix}`)
      },
    })
    return () => controls.stop()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, target])

  return (
    <span ref={ref} className={className}>
      {display}
    </span>
  )
}

/** Subtle hover lift for cards. */
export function LiftCard({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <motion.div
      className={className}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  )
}
