'use client'

import { motion, type Variants } from 'motion/react'

const easeOut = [0.16, 1, 0.3, 1] as const

/**
 * The wordmark line reveal: each line slides up into its masked slot when the
 * hero mounts, in sequence.
 */
export function RevealLines({
  lines,
  className,
}: {
  lines: string[]
  className?: string
}) {
  const variants: Variants = {
    hidden: { y: '110%' },
    show: (i: number) => ({
      y: '0%',
      transition: { duration: 0.8, delay: 0.1 + i * 0.12, ease: easeOut },
    }),
  }

  return (
    <span className={className}>
      {lines.map((line, i) => (
        <span key={line} className="block overflow-hidden pb-[0.08em] -mb-[0.08em]">
          <motion.span
            className="block will-change-transform"
            variants={variants}
            custom={i}
            initial="hidden"
            animate="show"
          >
            {line}
          </motion.span>
        </span>
      ))}
    </span>
  )
}
