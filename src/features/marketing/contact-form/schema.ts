import { z } from 'zod'

/**
 * Contact form contract. Shared by the client component and the Server Action,
 * so the two cannot drift — but the Action re-validates regardless, because a
 * Server Action is a public HTTP endpoint and the client can be bypassed.
 */

/**
 * Revenue bands, not a free-text number.
 *
 * The band is the qualifying question. These are **annual** figures, matching
 * how the rest of the site frames its ideal client ("roughly $500K to $20M in
 * annual revenue" — see the FAQ in `src/lib/site-data.ts`). A fixed list keeps
 * the answer usable for triage and the control to one tap on mobile.
 */
export const REVENUE_BANDS = [
  'Under $500K',
  '$500K – $2M',
  '$2M – $10M',
  '$10M – $20M',
  '$20M+',
] as const

export type RevenueBand = (typeof REVENUE_BANDS)[number]

/** Minimum time a human takes to fill this in. Anything faster is a script. */
export const MIN_FILL_MS = 2500

export const contactFormSchema = z.object({
  name: z.string().trim().min(2, 'Please enter your name.').max(120),
  email: z.string().trim().toLowerCase().email('Please enter a valid email address.'),
  company: z.string().trim().max(160).optional().or(z.literal('')),
  websiteUrl: z.string().trim().max(200).optional().or(z.literal('')),
  monthlyRevenue: z.enum(REVENUE_BANDS).optional().or(z.literal('')),
  message: z
    .string()
    .trim()
    .min(10, 'A sentence or two about your brand helps us prepare.')
    .max(4000),
  /** The page the form was submitted from. Hidden field, for attribution. */
  source: z.string().max(200).optional().or(z.literal('')),

  /**
   * Honeypot. Named `companyWebsite` rather than something obviously fake so a
   * bot's field-name heuristics fill it in. Any value means "not a human".
   */
  companyWebsite: z.string().max(200).optional().or(z.literal('')),
  /** Epoch ms stamped when the form first rendered, for the timing check. */
  renderedAt: z.coerce.number().int().nonnegative().optional(),
})

export type ContactFormInput = z.infer<typeof contactFormSchema>

export type ContactFieldName = Exclude<
  keyof ContactFormInput,
  'companyWebsite' | 'renderedAt' | 'source'
>
