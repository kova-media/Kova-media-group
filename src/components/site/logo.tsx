import Image from 'next/image'
import Link from 'next/link'

import { cn } from '@/lib/utils'

/**
 * The Kova mark.
 *
 * **The real logo is an uploaded asset, not code.** Whatever is set as the logo
 * in Site settings renders here; there is deliberately no hand-drawn glyph
 * approximating the identity, because an approximated logo is worse than an
 * honest wordmark and would have to be unpicked later.
 *
 * Until that asset is uploaded this falls back to a plain typographic
 * logotype — the company name, set in the site's own typeface. Dropping the
 * real file in through the admin replaces it everywhere, with no code change.
 */
export type LogoAsset = {
  url: string
  width: number | null
  height: number | null
}

export function Logo({
  asset,
  tone = 'light',
  className,
}: {
  asset?: LogoAsset | null
  tone?: 'light' | 'dark'
  className?: string
}) {
  if (asset) {
    return (
      <Image
        src={asset.url}
        alt="Kova Media Group"
        width={asset.width ?? 160}
        height={asset.height ?? 32}
        priority
        className={cn('h-7 w-auto object-contain', className)}
      />
    )
  }

  return (
    <span
      className={cn(
        'text-[0.95rem] font-semibold tracking-tight',
        tone === 'dark' ? 'text-background' : 'text-foreground',
        className,
      )}
    >
      Kova{' '}
      <span
        className={cn(
          'font-normal',
          tone === 'dark' ? 'text-background/60' : 'text-muted-foreground',
        )}
      >
        Media Group
      </span>
    </span>
  )
}

export function LogoLink({
  asset,
  tone = 'light',
  className,
}: {
  asset?: LogoAsset | null
  tone?: 'light' | 'dark'
  className?: string
}) {
  return (
    <Link
      href="/"
      aria-label="Kova Media Group, home"
      className={cn('group inline-flex items-center gap-2.5 rounded-sm', className)}
    >
      <Logo asset={asset} tone={tone} />
    </Link>
  )
}
