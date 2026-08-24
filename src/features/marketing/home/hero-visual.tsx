'use client'

import { useEffect } from 'react'
import {
  motion,
  animate,
  useMotionValue,
  useTransform,
  useReducedMotion,
  type MotionValue,
} from 'motion/react'

const ease = [0.16, 1, 0.3, 1] as const

/** One full sweep of the programme, in seconds. */
const SWEEP_SECONDS = 14

/**
 * The two channels, and where each one speaks across a customer's lifecycle.
 *
 * These positions are a *shape*, not data. They say "email carries the steady
 * cadence and SMS punctuates it at the moments that are time-sensitive", which
 * is a true statement about how the two channels are used together and is the
 * entire point of the composition. There are no figures here, and there must
 * not be: no revenue, no recipient counts, no rates. The earlier version of
 * this hero invented all three, which is exactly what `docs/DESIGN.md` forbids.
 */
const LANES = [
  { label: 'Email', marks: [0.06, 0.28, 0.44, 0.62, 0.79, 0.94] },
  { label: 'SMS', marks: [0.2, 0.53, 0.88] },
] as const

/** Generic lifecycle stages — industry vocabulary, not claims about a client. */
const STAGES = ['Welcome', 'Browse', 'Cart', 'Purchase', 'Win-back'] as const

/** Label column width + gap. The playhead track is inset by exactly this. */
const TRACK_INSET = '5.25rem'

/**
 * A single message on a lane.
 *
 * Each mark reads the shared sweep position and responds as the playhead
 * reaches it, which is what makes the composition feel like one running system
 * rather than a set of independently looping decorations. The response is a
 * brief brightening and a small scale — no glow, no ring, no bloom.
 */
function Mark({
  progress,
  at,
  still,
}: {
  progress: MotionValue<number>
  at: number
  still: boolean
}) {
  const opacity = useTransform(progress, [at - 0.09, at, at + 0.14], [0.32, 1, 0.32])
  const scale = useTransform(progress, [at - 0.04, at, at + 0.07], [1, 1.9, 1])

  // Rounded, because `0.28 * 100` is `28.000000000000004` and that lands in the
  // markup verbatim.
  const left = `${(at * 100).toFixed(2)}%`

  return (
    <motion.span
      className="absolute top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 bg-brand"
      // Under reduced motion the sweep never runs, and a mark driven by a
      // parked progress value would clamp to its dim resting state — a diagram
      // permanently at one-third strength. Static marks render at full instead.
      style={still ? { left } : { left, opacity, scale }}
      aria-hidden
    />
  )
}

/**
 * The hero composition: a customer lifecycle read as a broadcast score.
 *
 * Why this and not another arrangement of product panels. Kova's work is not a
 * dashboard — a dashboard is what a client logs into afterwards. The work is
 * the programme itself: deciding what goes out, on which channel, at which
 * moment in someone's relationship with a brand. So the visual is that
 * programme, drawn the way a schedule or a score is drawn — two lanes, marks
 * where each channel speaks, a lifecycle running left to right underneath, and
 * a playhead moving through it.
 *
 * It is built from rules and type only. There is no card, no panel, no surface
 * with a border around the whole thing, and nothing is stacked on anything
 * else. Depth would not help here and is absent on purpose: the composition is
 * a schematic, and schematics are flat.
 *
 * Under reduced motion the sweep never starts and the marks render at full
 * strength, so the programme reads as a complete, legible diagram rather than
 * a half-lit one.
 */
export function HeroProgramme() {
  const reduced = useReducedMotion()
  const progress = useMotionValue(0)
  const still = reduced === true

  const playheadLeft = useTransform(progress, [0, 1], ['0%', '100%'])
  const playheadOpacity = useTransform(progress, [0, 0.02, 0.98, 1], [0, 1, 1, 0])

  useEffect(() => {
    if (still) return
    const controls = animate(progress, 1, {
      duration: SWEEP_SECONDS,
      ease: 'linear',
      repeat: Infinity,
      repeatDelay: 0.6,
    })
    return () => controls.stop()
  }, [still, progress])

  return (
    <div className="relative">
      {/* The playhead, spanning both lanes. Inset to match the label column so
          it travels the track and not the labels. */}
      {!still && (
        <div
          className="pointer-events-none absolute top-0 right-0 bottom-10 sm:bottom-12"
          style={{ left: TRACK_INSET }}
          aria-hidden
        >
          <motion.div
            className="absolute top-0 bottom-0 w-px bg-brand"
            style={{ left: playheadLeft, opacity: playheadOpacity }}
          />
        </div>
      )}

      {LANES.map((lane, laneIndex) => (
        <div key={lane.label} className="flex items-center gap-5 py-7 sm:py-9">
          <motion.span
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.35 + laneIndex * 0.12, ease }}
            className="w-16 shrink-0 text-right text-[0.9375rem] font-medium text-foreground"
          >
            {lane.label}
          </motion.span>

          <div className="relative h-px flex-1">
            <motion.span
              className="absolute inset-0 block bg-border-strong"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              style={{ originX: 0 }}
              transition={{ duration: 1.1, delay: 0.3 + laneIndex * 0.12, ease }}
              aria-hidden
            />
            {lane.marks.map((at) => (
              <Mark key={at} progress={progress} at={at} still={still} />
            ))}
          </div>
        </div>
      ))}

      {/* The lifecycle axis. Ticks align to the stage labels, so the two lanes
          above are read against it rather than floating free. */}
      <div className="flex items-start gap-5">
        <span className="w-16 shrink-0" aria-hidden />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.9, delay: 0.9, ease }}
          className="flex-1"
        >
          <div className="h-px w-full bg-border" aria-hidden />
          <div className="flex justify-between">
            {STAGES.map((stage) => (
              <span key={stage} className="flex flex-col items-start last:items-end">
                <span className="h-2 w-px bg-border-strong" aria-hidden />
                <span className="mt-2.5 text-[0.8125rem] font-medium tracking-[0.06em] text-foreground/65 uppercase">
                  {stage}
                </span>
              </span>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
