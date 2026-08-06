import Image from 'next/image'

import { cn } from '@/lib/utils'

/**
 * Every public image renders through here.
 *
 * Dimensions and the blur placeholder are what actually deliver the CLS budget
 * (ARCHITECTURE.md §12) — they are not optional and are never guessed.
 *
 * The prop shape is declared structurally rather than importing a domain type:
 * this is a presentational primitive and must not depend on the data layer
 * (FOLDER_STRUCTURE.md §10). `MediaAssetDto` satisfies it by structure.
 */
export type ImageAsset = {
  url: string
  alt: string
  width: number | null
  height: number | null
  blurDataURL: string | null
}

export function MediaImage({
  asset,
  altOverride,
  className,
  sizes = '100vw',
  priority = false,
}: {
  asset: ImageAsset | undefined
  altOverride?: string | undefined
  className?: string
  sizes?: string
  priority?: boolean
}) {
  if (!asset) return null

  // An explicit empty string marks a decorative image; it is never omitted.
  const alt = altOverride ?? asset.alt

  if (!asset.width || !asset.height) {
    return (
      <span className={cn('relative block', className)}>
        <Image src={asset.url} alt={alt} fill sizes={sizes} className="object-cover" />
      </span>
    )
  }

  return (
    <Image
      src={asset.url}
      alt={alt}
      width={asset.width}
      height={asset.height}
      sizes={sizes}
      priority={priority}
      className={className}
      {...(asset.blurDataURL
        ? { placeholder: 'blur' as const, blurDataURL: asset.blurDataURL }
        : {})}
    />
  )
}
