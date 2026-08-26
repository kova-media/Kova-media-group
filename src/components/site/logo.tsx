import Image from 'next/image'
import Link from 'next/link'

import { cn } from '@/lib/utils'

/**
 * The Kova mark.
 *
 * **Nothing here is drawn by hand.** The bundled default is the real Kova Media
 * Group logotype — the teal equalizer mark and the KOVA / MEDIA GROUP
 * wordmark — shipped as an asset rather than reconstructed in code, because an
 * approximated identity is worse than none and would have to be unpicked later.
 * The only processing applied to it is the ink colour of the lettering: the
 * supplied file is white-on-transparent for dark grounds, and the light-ground
 * variant takes the same artwork to the page's foreground ink. The teal is
 * untouched in both.
 *
 * Whatever is set as the logo in Site settings still wins, so replacing the
 * file through the admin replaces it everywhere with no code change.
 */
export type LogoAsset = {
  url: string
  width: number | null
  height: number | null
}

/** The bundled logotype, per ground. Intrinsic size is the artwork's own box. */
const DEFAULT_LOGO: Record<'light' | 'dark', LogoAsset> = {
  light: { url: '/brand/kova-logo.png', width: 267, height: 84 },
  dark: { url: '/brand/kova-logo-on-dark.png', width: 267, height: 84 },
}

export function Logo({
  asset,
  tone = 'light',
  className,
  siteName = 'Kova Media Group',
}: {
  asset?: LogoAsset | null
  tone?: 'light' | 'dark'
  className?: string
  /**
   * From Site settings. The default is the last-resort value for a render that
   * has no chrome to hand; it is never what a configured site shows.
   */
  siteName?: string
}) {
  const logo = asset ?? DEFAULT_LOGO[tone]

  return (
    <Image
      src={logo.url}
      alt={siteName}
      width={logo.width ?? 267}
      height={logo.height ?? 84}
      priority
      /* Tall enough that "MEDIA GROUP" stays legible: at h-7 the sub-line
         collapses to a smudge. */
      className={cn('h-9 w-auto object-contain', className)}
    />
  )
}

export function LogoLink({
  asset,
  tone = 'light',
  className,
  siteName = 'Kova Media Group',
}: {
  asset?: LogoAsset | null
  tone?: 'light' | 'dark'
  className?: string
  siteName?: string
}) {
  return (
    <Link
      href="/"
      aria-label={`${siteName}, home`}
      className={cn('group inline-flex items-center gap-2.5 rounded-sm', className)}
    >
      <Logo asset={asset} tone={tone} siteName={siteName} />
    </Link>
  )
}
