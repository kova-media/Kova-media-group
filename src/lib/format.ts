/**
 * Presentation formatting. Pure, locale-fixed to en-US so that a server render
 * and a client hydration cannot disagree about a thousands separator.
 */

export type MetricUnit = 'PERCENT' | 'CURRENCY_USD' | 'MULTIPLIER' | 'ABSOLUTE'

const compactCurrency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  notation: 'compact',
  maximumFractionDigits: 1,
})

const plainNumber = new Intl.NumberFormat('en-US')

const compactNumber = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 1,
})

/**
 * A metric as it appears on the page.
 *
 * Percentages carry an explicit `+` because every percentage on this site is a
 * change, and "38%" reads as a share where "+38%" reads as growth. Large
 * currency values compact ("$1.2M") — a proof number is read at a glance, not
 * audited.
 */
export function formatMetric(value: number, unit: MetricUnit): string {
  switch (unit) {
    case 'PERCENT':
      return `${value > 0 ? '+' : ''}${trimZeros(value)}%`
    case 'CURRENCY_USD':
      return Math.abs(value) >= 10_000
        ? compactCurrency.format(value)
        : new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0,
          }).format(value)
    case 'MULTIPLIER':
      return `${trimZeros(value)}×`
    default:
      return Math.abs(value) >= 10_000
        ? compactNumber.format(value)
        : plainNumber.format(value)
  }
}

function trimZeros(value: number): string {
  return Number.isInteger(value) ? String(value) : String(Number(value.toFixed(1)))
}

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
})

const shortDateFormatter = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
})

export function formatDate(value: string | Date): string {
  return dateFormatter.format(typeof value === 'string' ? new Date(value) : value)
}

export function formatShortDate(value: string | Date): string {
  return shortDateFormatter.format(typeof value === 'string' ? new Date(value) : value)
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/** "3 days ago" — for admin lists, where absolute dates add noise. */
export function formatRelative(value: string | Date): string {
  const date = typeof value === 'string' ? new Date(value) : value
  const seconds = Math.round((Date.now() - date.getTime()) / 1000)

  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86_400) return `${Math.floor(seconds / 3600)}h ago`
  if (seconds < 604_800) return `${Math.floor(seconds / 86_400)}d ago`

  return shortDateFormatter.format(date)
}
