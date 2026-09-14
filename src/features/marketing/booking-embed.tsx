'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { ArrowUpRight } from 'lucide-react'

/**
 * Inline Cal.com booking embed.
 *
 * The booking experience stays on the Kova site. Cal.com's current embed SDK
 * is loaded from app.cal.com and mounts the event into the supplied container.
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
    let timeout: ReturnType<typeof setTimeout> | undefined
    let observer: MutationObserver | undefined

    initializeCalLoader()

    const mount = () => {
      if (cancelled || !containerRef.current || !window.Cal) return

      try {
        window.Cal('init', { origin: 'https://cal.com' })
        window.Cal('inline', {
          elementOrSelector: `#${containerId}`,
          calLink,
          config: {
            layout: 'month_view',
            useSlotsViewOnSmallScreen: 'true',
          },
        })
      } catch {
        setEmbedFailed(true)
        return
      }

      observer = new MutationObserver(() => {
        if (containerRef.current?.querySelector('iframe')) {
          if (timeout) clearTimeout(timeout)
          observer?.disconnect()
        }
      })
      observer.observe(containerRef.current, { childList: true, subtree: true })

      timeout = setTimeout(() => {
        if (!containerRef.current?.querySelector('iframe')) {
          setEmbedFailed(true)
        }
      }, 8000)
    }

    // The official loader queues the commands until its SDK is ready, so the
    // mount call can safely happen immediately after the loader is installed.
    mount()

    return () => {
      cancelled = true
      if (timeout) clearTimeout(timeout)
      observer?.disconnect()
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
        className="min-h-[38rem] w-full overflow-hidden rounded-2xl border border-border bg-background"
      />

      {embedFailed && (
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
      )}
    </div>
  )
}

type CalFunction = ((...args: unknown[]) => unknown) & {
  loaded?: boolean
  q?: unknown[]
  ns?: Record<string, CalFunction>
}

declare global {
  interface Window {
    Cal?: CalFunction
  }
}

/** Cal.com's current public embed loader. */
function initializeCalLoader() {
  if (typeof window === 'undefined' || window.Cal) return

  const cal = ((...args: unknown[]) => {
    const current = window.Cal
    if (!current) return

    if (!current.loaded) {
      current.ns = {}
      current.q = current.q || []
      const script = document.createElement('script')
      script.src = 'https://app.cal.com/embed/embed.js'
      script.async = true
      document.head.appendChild(script)
      current.loaded = true
    }

    const instruction = args[0]
    if (instruction === 'init') {
      const api = ((...queuedArgs: unknown[]) => {
        const currentCal = window.Cal
        if (!currentCal) return
        currentCal.q = currentCal.q || []
        currentCal.q.push(queuedArgs)
      }) as CalFunction
      api.q = api.q || []

      const namespace = args[1]
      if (typeof namespace === 'string') {
        current.ns = current.ns || {}
        current.ns[namespace] = current.ns[namespace] || api
        current.ns[namespace].q = current.ns[namespace].q || []
        current.ns[namespace].q.push(args)
        current.q = current.q || []
        current.q.push(['initNamespace', namespace])
      } else {
        current.q = current.q || []
        current.q.push(args)
      }
      return api
    }

    current.q = current.q || []
    current.q.push(args)
  }) as CalFunction

  cal.q = []
  cal.ns = {}
  window.Cal = cal
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
