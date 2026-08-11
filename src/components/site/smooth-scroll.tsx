'use client'

import { MotionConfig } from 'motion/react'
import { useEffect, useRef } from 'react'

/**
 * Lenis smooth scrolling, plus the site-wide motion policy.
 *
 * The library is imported **dynamically inside the effect**, not at module
 * scope. Smooth scrolling is a refinement, not content: loading ~22kB of it in
 * the critical path delays the thing the visitor actually came for. Deferring
 * it to after hydration costs nothing perceptible — the first few hundred
 * milliseconds of scrolling are native, and then it takes over.
 *
 * Users who prefer reduced motion never download it at all.
 *
 * **`MotionConfig reducedMotion="user"` is a correctness fix, not a nicety.**
 * Framer Motion animates by writing inline styles from requestAnimationFrame,
 * so the `@media (prefers-reduced-motion: reduce)` block in globals.css — which
 * only neuters CSS transitions and animations — never reaches it. Without this,
 * every scroll reveal on the site ignored the preference entirely. Set to
 * `"user"`, Motion skips transform and opacity animations for those users and
 * renders the final state directly, which is exactly the required behaviour:
 * the animation is removed, never merely paused with the content left hidden.
 */
export function SmoothScroll({ children }: { children: React.ReactNode }) {
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    // Respect users who prefer reduced motion — skip smooth scrolling entirely.
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) return

    let cancelled = false
    let destroy: (() => void) | undefined

    void import('lenis').then(({ default: Lenis }) => {
      // The component may have unmounted while the chunk was in flight.
      if (cancelled) return

      const lenis = new Lenis({
        duration: 1.1,
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
      })

      function raf(time: number) {
        lenis.raf(time)
        rafRef.current = requestAnimationFrame(raf)
      }

      rafRef.current = requestAnimationFrame(raf)

      destroy = () => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current)
        lenis.destroy()
      }
    })

    return () => {
      cancelled = true
      destroy?.()
    }
  }, [])

  return <MotionConfig reducedMotion="user">{children}</MotionConfig>
}
