'use client'

import { motion, AnimatePresence } from 'motion/react'
import { Check, ArrowRight } from 'lucide-react'
import { useActionState, useEffect, useRef, useState } from 'react'
import { useFormStatus } from 'react-dom'

import { cn } from '@/lib/utils'
import type { ActionResult } from '@/server/actions/result'

import { submitContactForm, type ContactSubmitResult } from './actions'
import { REVENUE_BANDS } from './schema'

/**
 * The v0 contact form, wired to the real Server Action.
 *
 * The markup, spacing, and motion are preserved from the v0 implementation —
 * the only change is that submitting now persists a `ContactSubmission` and
 * fires the Resend notification instead of flipping local state. Validation
 * errors come back from the action and render inline.
 */
function Field({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string
  htmlFor: string
  error?: string | undefined
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={htmlFor} className="text-sm font-medium text-foreground">
        {label}
      </label>
      {children}
      {error && (
        <p id={`${htmlFor}-error`} className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}

const inputClass =
  'w-full rounded-lg border border-border bg-card px-4 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-foreground/40 focus:ring-2 focus:ring-brand/15 aria-[invalid=true]:border-destructive'

export function ContactForm({ source }: { source?: string }) {
  const [state, formAction] = useActionState<
    ActionResult<ContactSubmitResult> | null,
    FormData
  >(submitContactForm, null)

  const [revenue, setRevenue] = useState<string>('')
  const successRef = useRef<HTMLDivElement>(null)

  // Stamped on mount rather than on the server, so the bot timing check
  // measures how long the visitor had the form — not how long the page sat in
  // a CDN cache.
  //
  // Held in a ref and injected at submit time rather than kept in state: the
  // value is never rendered, so storing it in state would cost a re-render on
  // mount for nothing.
  const mountedAtRef = useRef<number | null>(null)
  useEffect(() => {
    mountedAtRef.current = Date.now()
  }, [])

  const submit = (formData: FormData) => {
    if (mountedAtRef.current !== null) {
      formData.set('renderedAt', String(mountedAtRef.current))
    }
    formAction(formData)
  }

  // Success replaces the form, so focus has to move deliberately or a keyboard
  // user is left on a control that no longer exists.
  useEffect(() => {
    if (state?.ok) successRef.current?.focus()
  }, [state?.ok])

  const fieldErrors = state && !state.ok ? (state.fieldErrors ?? {}) : {}
  const errorFor = (name: string) => fieldErrors[name]?.[0]

  return (
    <div className="relative rounded-2xl border border-border bg-card p-7 shadow-sm sm:p-9">
      <AnimatePresence mode="wait">
        {state?.ok ? (
          <motion.div
            key="success"
            ref={successRef}
            tabIndex={-1}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center py-12 text-center outline-none"
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand/10 text-brand">
              <Check className="h-7 w-7" />
            </span>
            <h3 className="mt-6 text-2xl font-medium tracking-tight">
              Thanks — we&apos;ll be in touch.
            </h3>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-pretty text-muted-foreground">
              We&apos;ll review your details and reply within one business day to set up
              your free call.
            </p>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            action={submit}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col gap-5"
          >
            <input type="hidden" name="source" value={source ?? ''} />
            <input type="hidden" name="monthlyRevenue" value={revenue} />

            {/* Honeypot. Hidden from sight and from assistive technology, and
                excluded from autofill so a password manager cannot fill it in
                on a real visitor's behalf. */}
            <div
              aria-hidden
              className="absolute -left-[9999px] h-px w-px overflow-hidden"
            >
              <label htmlFor="companyWebsite">Company website</label>
              <input
                id="companyWebsite"
                name="companyWebsite"
                type="text"
                tabIndex={-1}
                autoComplete="off"
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Name" htmlFor="name" error={errorFor('name')}>
                <input
                  required
                  id="name"
                  type="text"
                  name="name"
                  autoComplete="name"
                  placeholder="Jane Doe"
                  aria-invalid={Boolean(errorFor('name'))}
                  aria-describedby={errorFor('name') ? 'name-error' : undefined}
                  className={inputClass}
                />
              </Field>
              <Field label="Work email" htmlFor="email" error={errorFor('email')}>
                <input
                  required
                  id="email"
                  type="email"
                  name="email"
                  autoComplete="email"
                  placeholder="jane@brand.com"
                  aria-invalid={Boolean(errorFor('email'))}
                  aria-describedby={errorFor('email') ? 'email-error' : undefined}
                  className={inputClass}
                />
              </Field>
            </div>

            <Field
              label="Brand / company"
              htmlFor="company"
              error={errorFor('company')}
            >
              <input
                id="company"
                type="text"
                name="company"
                autoComplete="organization"
                placeholder="Your brand"
                className={inputClass}
              />
            </Field>

            <fieldset className="flex flex-col gap-2">
              <legend className="mb-2 text-sm font-medium text-foreground">
                Annual revenue
              </legend>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {REVENUE_BANDS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    aria-pressed={revenue === option}
                    onClick={() => setRevenue(revenue === option ? '' : option)}
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
            </fieldset>

            <Field
              label="What are you hoping to improve?"
              htmlFor="message"
              error={errorFor('message')}
            >
              <textarea
                required
                id="message"
                name="message"
                rows={4}
                placeholder="Tell us a little about your current email & SMS setup…"
                aria-invalid={Boolean(errorFor('message'))}
                aria-describedby={errorFor('message') ? 'message-error' : undefined}
                className={cn(inputClass, 'resize-none')}
              />
            </Field>

            {state && !state.ok && (
              <p
                role="alert"
                className="rounded-lg border border-destructive/25 bg-destructive/5 px-4 py-3 text-sm text-destructive"
              >
                {state.message}
              </p>
            )}

            <SubmitButton />
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  )
}

/**
 * Split out so that `useFormStatus` reads the status of the form it sits
 * inside — the hook returns nothing useful when called from the component that
 * renders the `<form>` itself.
 */
function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      className="group mt-2 inline-flex items-center justify-center gap-2 rounded-full bg-cta px-7 py-3.5 text-sm font-medium text-cta-foreground transition-all hover:bg-cta-hover disabled:opacity-60"
    >
      {pending ? 'Sending…' : 'Request my free call'}
      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
    </button>
  )
}
