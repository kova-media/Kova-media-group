'use client'

import { motion, type Variants } from 'motion/react'
import type { ReactNode } from 'react'

const easeOut = [0.16, 1, 0.3, 1] as const

/** Fade + rise in as the element scrolls into view. */
export function Reveal({
  children,
  className,
  delay = 0,
  y = 24,
  as = 'div',
}: {
  children: ReactNode
  className?: string
  delay?: number
  y?: number
  as?: 'div' | 'span' | 'li' | 'section'
}) {
  const MotionTag = motion[as]
  return (
    <MotionTag
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -12% 0px' }}
      transition={{ duration: 0.8, delay, ease: easeOut }}
    >
      {children}
    </MotionTag>
  )
}

const containerVariants: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: easeOut } },
}

/** Wrap a group of <RevealItem> children to stagger their entrance. */
export function RevealGroup({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <motion.div
      className={className}
      variants={containerVariants}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '0px 0px -10% 0px' }}
    >
      {children}
    </motion.div>
  )
}

export function RevealItem({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <motion.div className={className} variants={itemVariants}>
      {children}
    </motion.div>
  )
}

/**
 * Reveal text line by line. Pass an array of lines.
 * `trigger="mount"` animates immediately (use for above-the-fold headings);
 * `trigger="view"` animates when scrolled into view.
 */
export function RevealLines({
  lines,
  className,
  lineClassName,
  delay = 0,
  trigger = 'mount',
}: {
  lines: string[]
  className?: string
  lineClassName?: string
  delay?: number
  trigger?: 'mount' | 'view'
}) {
  const anim =
    trigger === 'mount'
      ? { animate: { y: '0%' } as const }
      : {
          whileInView: { y: '0%' } as const,
          viewport: { once: true, margin: '0px 0px -10% 0px' } as const,
        }
  return (
    <span className={className}>
      {lines.map((line, i) => (
        <span key={i} className="block overflow-hidden pb-[0.08em]">
          <motion.span
            className={lineClassName ?? 'block'}
            initial={{ y: '110%' }}
            {...anim}
            transition={{ duration: 0.9, delay: delay + i * 0.09, ease: easeOut }}
          >
            {line}
          </motion.span>
        </span>
      ))}
    </span>
  )
}
