'use server'

import { revalidatePath, updateTag } from 'next/cache'
import { z } from 'zod'

import { prisma } from '@/db/prisma'
import { ok, parseInput, unexpected, type ActionResult } from '@/server/actions/result'
import { requireAdmin } from '@/server/auth/dal'
import { cacheTags } from '@/server/cache/tags'
import { siteFooterSchema, siteHeaderSchema } from '@/server/content/schemas/settings'

/**
 * Site settings.
 *
 * One row, one form. Navigation is edited as a list of label/href pairs rather
 * than free-form JSON — the owner should never have to know what valid JSON
 * looks like to rename a menu item.
 */
const linkSchema = z.object({
  label: z.string().trim().min(1).max(60),
  href: z.string().trim().min(1).max(200),
})

const settingsSchema = z.object({
  siteName: z.string().trim().min(1, 'A site name is required.').max(120),
  contactEmail: z.string().trim().email('Enter a valid email address.'),
  bookingUrl: z.string().trim().url('Enter a valid URL.').max(300),
  defaultSeoTitle: z.string().trim().min(1, 'An SEO title is required.').max(160),
  defaultSeoDescription: z
    .string()
    .trim()
    .min(1, 'An SEO description is required.')
    .max(320),
  logoId: z.string().trim().max(64),
  logoDarkId: z.string().trim().max(64),
  defaultSeoImageId: z.string().trim().max(64),
  navigation: z.array(linkSchema).max(10),
  header: siteHeaderSchema,
  footer: siteFooterSchema,
})

/**
 * Footer columns arrive as one JSON string.
 *
 * The editor never sees it — the form renders labelled boxes and serialises
 * them on submit. Columns hold a nested list of links, and parallel `getAll()`
 * arrays cannot express two levels of nesting without an index-encoding scheme
 * that is far more fragile than one round trip through JSON. It is validated by
 * `siteFooterSchema` immediately either way.
 */
function parseJson(value: FormDataEntryValue | null): unknown {
  if (typeof value !== 'string' || !value.trim()) return undefined
  try {
    return JSON.parse(value)
  } catch {
    return undefined
  }
}

export async function saveSiteSettings(
  _previous: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin()

  // Navigation arrives as parallel label/href arrays from the repeated fields.
  const labels = formData.getAll('navLabel').map(String)
  const hrefs = formData.getAll('navHref').map(String)
  const navigation = labels
    .map((label, index) => ({ label: label.trim(), href: (hrefs[index] ?? '').trim() }))
    .filter((item) => item.label && item.href)

  const parsed = parseInput(settingsSchema, {
    siteName: formData.get('siteName'),
    contactEmail: formData.get('contactEmail'),
    bookingUrl: formData.get('bookingUrl'),
    defaultSeoTitle: formData.get('defaultSeoTitle'),
    defaultSeoDescription: formData.get('defaultSeoDescription'),
    logoId: formData.get('logoId') ?? '',
    logoDarkId: formData.get('logoDarkId') ?? '',
    defaultSeoImageId: formData.get('defaultSeoImageId') ?? '',
    navigation,
    header: {
      ctaLabel: formData.get('headerCtaLabel') ?? '',
      ctaHref: formData.get('headerCtaHref') ?? '',
    },
    footer: {
      description: formData.get('footerDescription') ?? '',
      tagline: formData.get('footerTagline') ?? '',
      note: formData.get('footerNote') ?? '',
      columns: parseJson(formData.get('footerColumns')) ?? [],
    },
  })

  if (!parsed.ok) return parsed.result

  const data = parsed.data

  try {
    await prisma.siteSettings.update({
      where: { id: 'singleton' },
      data: {
        siteName: data.siteName,
        contactEmail: data.contactEmail,
        bookingUrl: data.bookingUrl,
        defaultSeoTitle: data.defaultSeoTitle,
        defaultSeoDescription: data.defaultSeoDescription,
        defaultSeoImageId: data.defaultSeoImageId || null,
        logoId: data.logoId || null,
        logoDarkId: data.logoDarkId || null,
        navigation: data.navigation,
        header: data.header,
        footer: data.footer,
        // Kova runs no social accounts. Kept empty rather than exposed as an
        // editable list that would only invite dead links.
        socialLinks: [],
      },
    })

    updateTag(cacheTags.settings)
    // Settings drive the header and footer, which appear on every page.
    revalidatePath('/', 'layout')

    return ok()
  } catch (error) {
    return unexpected('saveSiteSettings', error)
  }
}
