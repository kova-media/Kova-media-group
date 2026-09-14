'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { ArrowUpRight } from 'lucide-react'

/**
 * Inline booking embed.
 *
 * Cal.com provides an official inline embed that keeps the complete booking
 * flow on the Kova site. This avoids sending a visitor to a separate calendar
 * tab after they have already reached the booking page.
 */
export function BookingEmbed({
  url,
  title,
  fallbackNote,
  fallbackAction,
  notLoadingLabel,
  openInTabLabel,
}: {
  url: string
  title?: string
  fallbackNote?: string
  fallbackAction?: string
  notLoadingLabel?: string
  openInTabLabel?: string
}) {
  const heading = title?.trim() || 'Book a strategy call'
  const containerId = useId().replace(/:/g, '')
  const containerRef = useRef<HTMLDivElement>(null)
  const [embedFailed, setEmbedFailed] = useState(false)
  const isCalCom = /(^|\.)cal\.com$/.test(safeHost(url))

  useEffect(() => {
    if (!isCalCom || !containerRef.current) return

    const calLink = getCalLink(url)
    if (!calLink) {
      setEmbedFailed(true)
      return
    }

    let cancelled = false
    let retryTimer: ReturnType<typeof setTimeout> | undefined

    const mount = () => {
      if (cancelled || !containerRef.current || typeof window === 'undefined') return

      const cal = window.Cal
      if (!cal) {
        retryTimer = setTimeout(mount, 100)
        return
      }

      containerRef.current.replaceChildren()

      try {
        cal('init', { origin: 'https://cal.com' })
        cal('inline', {
          elementOrSelector: `#${containerId}`,
          calLink,
          config: {
            layout: 'month_view',
            useSlotsViewOnSmallScreen: 'true',
          },
        })
      } catch {
        setEmbedFailed(true)
      }
    }

    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[data-kova-cal-embed="true"]',
    )

    if (existingScript) {
      mount()
    } else {
      const script = document.createElement('script')
      script.src = 'https://cal.com/embed.js'
      script.async = true
      script.dataset.kovaCalEmbed = 'true'
      script.onload = mount
      script.onerror = () => setEmbedFailed(true)
      document.head.appendChild(script)
    }

    return () => {
      cancelled = true
      if (retryTimer) clearTimeout(retryTimer)
    }
  }, [containerId, isCalCom, url])

  if (!isCalCom || embedFailed) {
    return (
      <div className="flex flex-col items-start rounded-2xl border border-border bg-card p-8 shadow-[var(--shadow-soft)]">
        <p className="text-lg font-medium text-foreground">{heading}</p>
        {fallbackNote?.trim() && (
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {fallbackNote}
          </p>
        )}
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="group mt-6 inline-flex items-center gap-2 rounded-full bg-cta px-6 py-3 text-[0.95rem] font-medium text-cta-foreground transition-all duration-300 hover:bg-cta-hover"
        >
          {fallbackAction?.trim() || 'Open the calendar'}
          <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </a>
      </div>
    )
  }

  return (
    <div>
      <div
        id={containerId}
        ref={containerRef}
        aria-label={heading}
        className="min-h-[46rem] w-full overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-soft)]"
      />

      <p className="mt-4 text-center text-sm text-muted-foreground">
        {notLoadingLabel?.trim() || 'Calendar not loading?'}{' '}
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-foreground underline decoration-border-strong underline-offset-4 transition-colors hover:decoration-foreground"
        >
          {openInTabLabel?.trim() || 'Open it in a new tab'}
          <ArrowUpRight className="h-3.5 w-3.5" />
        </a>
      </p>
    </div>
  )
}

declare global {
  interface Window {
    Cal?: (
      action: string,
      config?: Record<string, unknown>,
    ) => void
  }
}

function safeHost(url: string): string {
  try {
    return new URL(url).hostname
  } catch {
    return ''
  }
}

function getCalLink(url: string): string {
  try {
    const parsed = new URL(url)
    return parsed.pathname.replace(/^\/+|\/+$/g, '')
  } catch {
    return ''
  }
}
