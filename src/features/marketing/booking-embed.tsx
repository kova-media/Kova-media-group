'use client'

/**
 * Inline Cal.com booking embed.
 *
 * Cal.com exposes a dedicated embed route on app.cal.com. Using that route
 * directly avoids relying on the SDK to discover and mount an iframe after
 * hydration, which is unnecessarily fragile inside a Next.js client boundary.
 */
export function BookingEmbed({
  url,
  title,
}: {
  url: string
  title?: string
  fallbackNote?: string
  fallbackAction?: string
  notLoadingLabel?: string
  openInTabLabel?: string
}) {
  const heading = title?.trim() || 'Book a strategy call'
  const calLink = getCalLink(url)

  if (!calLink) {
    return null
  }

  const embedUrl = `https://app.cal.com/${calLink}?embed=true&embedType=inline&layout=month_view&theme=light`

  return (
    <div className="w-full overflow-hidden rounded-2xl border border-border bg-background">
      <iframe
        src={embedUrl}
        title={heading}
        className="block h-[720px] w-full border-0"
        loading="eager"
        allow="camera; microphone; fullscreen; payment"
      />
    </div>
  )
}

function getCalLink(url: string): string {
  try {
    const parsed = new URL(url)
    if (!/(^|\.)cal\.com$/.test(parsed.hostname)) return ''
    return parsed.pathname.replace(/^\/+|\/+$/g, '')
  } catch {
    return ''
  }
}
