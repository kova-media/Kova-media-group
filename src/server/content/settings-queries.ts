import 'server-only'

import { prisma } from '@/db/prisma'
import { requireAdmin } from '@/server/auth/dal'
import { DEFAULT_BOOKING_URL, DEFAULT_NAVIGATION } from '@/lib/constants'

import {
  parseSiteFooter,
  parseSiteHeader,
  type SiteFooterContent,
  type SiteHeaderContent,
} from './schemas/settings'

/**
 * Site settings for the admin form. Uncached — reads cookies via
 * `requireAdmin()`, so it must never sit inside a `'use cache'` scope.
 *
 * Defaults are applied here rather than in the form so the editor always sees
 * the values the site is actually using, even before settings have been saved
 * once.
 */
export type SiteSettingsForEdit = {
  siteName: string
  contactEmail: string
  bookingUrl: string
  defaultSeoTitle: string
  defaultSeoDescription: string
  navigation: { label: string; href: string }[]
  header: Required<SiteHeaderContent>
  footer: Required<SiteFooterContent>
  logoId: string | null
  logoDarkId: string | null
  defaultSeoImageId: string | null
}

export async function getSiteSettingsForEdit(): Promise<SiteSettingsForEdit> {
  await requireAdmin()

  const settings = await prisma.siteSettings.findUnique({
    where: { id: 'singleton' },
  })

  const navigation = Array.isArray(settings?.navigation)
    ? (settings.navigation as { label: string; href: string }[])
    : [...DEFAULT_NAVIGATION]

  return {
    siteName: settings?.siteName ?? 'Kova Media Group',
    contactEmail: settings?.contactEmail ?? 'damian@kovamediagroup.com',
    bookingUrl: settings?.bookingUrl ?? DEFAULT_BOOKING_URL,
    defaultSeoTitle: settings?.defaultSeoTitle ?? '',
    defaultSeoDescription: settings?.defaultSeoDescription ?? '',
    navigation,
    // Defaults are applied here rather than in the form, so the editor always
    // sees the values the site is actually using — including before Settings
    // has been saved once.
    header: parseSiteHeader(settings?.header),
    footer: parseSiteFooter(settings?.footer),
    logoId: settings?.logoId ?? null,
    logoDarkId: settings?.logoDarkId ?? null,
    defaultSeoImageId: settings?.defaultSeoImageId ?? null,
  }
}
