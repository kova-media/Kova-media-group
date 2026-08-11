import 'server-only'

import { DEFAULT_BOOKING_URL, DEFAULT_NAVIGATION, routes } from '@/lib/constants'

import { getSiteSettings } from './queries'
import { getMediaAssets } from './resolvers'
import type { MediaAssetDto } from './types'

/**
 * Everything the header and footer need, with defaults applied.
 *
 * The chrome must render before Site settings has ever been saved — an empty
 * settings row cannot be allowed to produce a site with no navigation. So the
 * defaults live here in code, and the database only ever overrides them.
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
  tagline: string | null
  logo: MediaAssetDto | null
  logoDark: MediaAssetDto | null
}

const FALLBACK_EMAIL = 'damian@kovamediagroup.com'

export async function getSiteChrome(): Promise<SiteChrome> {
  const settings = await getSiteSettings()

  const logoIds = [settings?.logoId, settings?.logoDarkId].filter((id): id is string =>
    Boolean(id),
  )
  const media = logoIds.length ? await getMediaAssets(logoIds) : new Map()

  const navigation =
    settings?.navigation && settings.navigation.length > 0
      ? settings.navigation
      : [...DEFAULT_NAVIGATION]

  const logo = settings?.logoId ? (media.get(settings.logoId) ?? null) : null
  const logoDark = settings?.logoDarkId
    ? (media.get(settings.logoDarkId) ?? null)
    : null

  return {
    siteName: settings?.siteName ?? 'Kova Media Group',
    navigation,
    socialLinks: settings?.socialLinks ?? [],
    // An empty string in the database must not produce an href of "".
    bookingUrl: settings?.bookingUrl?.trim() || DEFAULT_BOOKING_URL,
    contactEmail: settings?.contactEmail || FALLBACK_EMAIL,
    tagline: settings?.footer.tagline ?? null,
    logo,
    // The dark footer falls back to the light logo rather than to nothing: a
    // slightly wrong logo beats a missing one.
    logoDark: logoDark ?? logo,
  }
}

/** Legal links are structural, not editorial — they are not in Site settings. */
export const LEGAL_LINKS = [
  { label: 'Privacy', href: routes.privacy },
  { label: 'Terms', href: routes.terms },
] as const
