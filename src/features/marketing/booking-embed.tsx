import { ArrowUpRight } from 'lucide-react'

/**
 * The Calendly scheduler.
 *
 * Embedded as a plain `<iframe>` rather than through Calendly's widget script.
 * That is a deliberate trade: the script would need `script-src` opened up to a
 * third-party origin on the public CSP — the one thing that policy exists to
 * prevent — and would ship ~90kB of JavaScript to render what is, in effect, a
 * remote page. The iframe needs only `frame-src`.
 *
 * `?hide_gdpr_banner=1` suppresses Calendly's own consent banner: the embed
 * sets no cookies of ours, and the site carries no analytics that would require
 * consent (ADR-018).
 */
export function BookingEmbed({ url }: { url: string }) {
  const isCalendly = /(^|\.)calendly\.com$/.test(safeHost(url))

  // A booking URL that is not a Calendly link (or is malformed) cannot be
  // framed safely, so it degrades to a prominent link rather than an empty box.
  if (!isCalendly) {
    return (
      <div className="flex flex-col items-start rounded-2xl border border-border bg-card p-8 shadow-[var(--shadow-soft)]">
        <p className="text-lg font-medium text-foreground">Book a strategy call</p>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Choose a time that works for you.
        </p>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="group mt-6 inline-flex items-center gap-2 rounded-full bg-cta px-6 py-3 text-[0.95rem] font-medium text-cta-foreground transition-all duration-300 hover:bg-cta-hover"
        >
          Open the calendar
          <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </a>
      </div>
    )
  }

  const embedUrl = `${url}${url.includes('?') ? '&' : '?'}hide_gdpr_banner=1&background_color=ffffff&text_color=1a1a1a&primary_color=14b8a6`

  return (
    <div>
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-soft)]">
        <iframe
          src={embedUrl}
          title="Book a strategy call with Kova Media Group"
          // Tall enough that Calendly's own layout never scrolls internally on
          // desktop, which is where the embed feels most like part of the page.
          //
          // Deliberately **not** `loading="lazy"`: this page exists to show a
          // calendar, so deferring it only guarantees the visitor waits. Lazy
          // loading also proved unreliable here — the frame sits below the fold
          // on load and the fetch was never triggered at all.
          className="h-[46rem] w-full border-0"
        />
      </div>

      {/*
        The escape hatch. Privacy extensions and strict browser settings block
        third-party frames routinely, and when that happens the embed above
        renders as an empty box with no explanation — a silently lost booking
        on the one page whose entire job is to take one. This link always
        renders, so the conversion path never dead-ends.
      */}
      <p className="mt-4 text-center text-sm text-muted-foreground">
        Calendar not loading?{' '}
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-foreground underline decoration-border-strong underline-offset-4 transition-colors hover:decoration-foreground"
        >
          Open it in a new tab
          <ArrowUpRight className="h-3.5 w-3.5" />
        </a>
      </p>
    </div>
  )
}

function safeHost(url: string): string {
  try {
    return new URL(url).hostname
  } catch {
    return ''
  }
}
