'use client'

import { motion } from 'motion/react'

const easeOut = [0.16, 1, 0.3, 1] as const

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
