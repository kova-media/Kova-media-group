import 'server-only'

import { DEFAULT_BOOKING_URL, DEFAULT_NAVIGATION } from '@/lib/constants'
import { logger } from '@/lib/logger'

import { getSiteSettings } from './queries'
import { getMediaAssets } from './resolvers'
import {
  parseSiteFooter,
  parseSiteHeader,
  resolveChromeHref,
  type SiteFooterContent,
  type SiteHeaderContent,
} from './schemas/settings'
import type { MediaAssetDto } from './types'

/**
 * Everything the header and footer need, with defaults applied.
 *
 * The chrome must render before Site settings has ever been saved — an empty
 * settings row cannot be allowed to produce a site with no navigation. So the
 * defaults live in code, and the database only ever overrides them.
 *
 * Composed from cached, individually tagged reads, so this is free on a warm
 * cache and updates the moment settings or the logo asset changes.
 */
export type SiteChrome = {
  siteName: string
  navigation: { label: string; href: string }[]
  socialLinks: { label: string; href: string }[]
  bookingUrl: string
  contactEmail: string
  header: Required<SiteHeaderContent>
  /** Footer links already resolved — `mailto:` carries the contact address. */
  footer: Required<SiteFooterContent>
  logo: MediaAssetDto | null
  logoDark: MediaAssetDto | null
}

const FALLBACK_EMAIL = 'damian@kovamediagroup.com'

export async function getSiteChrome(): Promise<SiteChrome> {
  // The header and footer are on every page, so an unreachable database must
  // degrade to the defaults rather than take the whole site down.
  let settings: Awaited<ReturnType<typeof getSiteSettings>> = null
  let media = new Map<string, MediaAssetDto>()

  try {
    settings = await getSiteSettings()

    const logoIds = [settings?.logoId, settings?.logoDarkId].filter(
      (id): id is string => Boolean(id),
    )
    if (logoIds.length) media = await getMediaAssets(logoIds)
  } catch (error) {
    logger.error('Could not read site settings; falling back to defaults', { error })
  }

  const navigation =
    settings?.navigation && settings.navigation.length > 0
      ? settings.navigation
      : [...DEFAULT_NAVIGATION]

  const logo = settings?.logoId ? (media.get(settings.logoId) ?? null) : null
  const logoDark = settings?.logoDarkId
    ? (media.get(settings.logoDarkId) ?? null)
    : null

  // An empty string in the database must not produce an href of "".
  const contactEmail = settings?.contactEmail || FALLBACK_EMAIL
  const footer = parseSiteFooter(settings?.footer)

  return {
    siteName: settings?.siteName ?? 'Kova Media Group',
    navigation,
    socialLinks: settings?.socialLinks ?? [],
    bookingUrl: settings?.bookingUrl?.trim() || DEFAULT_BOOKING_URL,
    contactEmail,
    header: parseSiteHeader(settings?.header),
    footer: {
      ...footer,
      columns: footer.columns.map((column) => ({
        ...column,
        links: column.links.map((link) => ({
          ...link,
          href: resolveChromeHref(link.href, contactEmail),
        })),
      })),
    },
    logo,
    // The dark footer falls back to the light logo rather than to nothing: a
    // slightly wrong logo beats a missing one.
    logoDark: logoDark ?? logo,
  }
}
