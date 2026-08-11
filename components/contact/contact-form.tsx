'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Check, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

const revenueOptions = [
  'Under $500K',
  '$500K – $2M',
  '$2M – $10M',
  '$10M+',
]

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-sm font-medium text-foreground">{label}</span>
      {children}
    </label>
  )
}

const inputClass =
  'w-full rounded-lg border border-border bg-card px-4 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-foreground/40 focus:ring-2 focus:ring-primary/15'

export function ContactForm() {
  const [submitted, setSubmitted] = useState(false)
  const [revenue, setRevenue] = useState(revenueOptions[1])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitted(true)
  }

  return (
    <div className="relative rounded-2xl border border-border bg-card p-7 shadow-sm sm:p-9">
      <AnimatePresence mode="wait">
        {submitted ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center py-12 text-center"
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Check className="h-7 w-7" />
            </span>
            <h3 className="mt-6 text-2xl font-medium tracking-tight">Thanks — we&apos;ll be in touch.</h3>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground text-pretty">
              We&apos;ll review your details and reply within one business day to set up your free
              account audit.
            </p>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            onSubmit={handleSubmit}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col gap-5"
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Name">
                <input required type="text" name="name" placeholder="Jane Doe" className={inputClass} />
              </Field>
              <Field label="Work email">
                <input
                  required
                  type="email"
                  name="email"
                  placeholder="jane@brand.com"
                  className={inputClass}
                />
              </Field>
            </div>

            <Field label="Brand / company">
              <input
                required
                type="text"
                name="company"
                placeholder="Your brand"
                className={inputClass}
              />
            </Field>

            <Field label="Annual revenue">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {revenueOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setRevenue(option)}
                    className={cn(
                      'rounded-lg border px-3 py-2.5 text-xs font-medium transition-colors',
                      revenue === option
                        ? 'border-foreground bg-foreground text-background'
                        : 'border-border bg-card text-muted-foreground hover:border-foreground/30',
                    )}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </Field>

            <Field label="What are you hoping to improve?">
              <textarea
                name="message"
                rows={4}
                placeholder="Tell us a little about your current email & SMS setup…"
                className={cn(inputClass, 'resize-none')}
              />
            </Field>

            <button
              type="submit"
              className="group mt-2 inline-flex items-center justify-center gap-2 rounded-full bg-primary px-7 py-3.5 text-sm font-medium text-primary-foreground transition-all hover:opacity-90"
            >
              Request my free audit
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </button>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  )
}
