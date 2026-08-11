import { ImageResponse } from 'next/og'

export const alt = 'Kova Media Group — Email & SMS marketing for ecommerce'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

/**
 * The default share card.
 *
 * Generated rather than designed as a static asset so it stays in step with the
 * brand tokens, and so per-page variants (below) can reuse the same shell.
 *
 * Deliberately typographic: no fetched fonts and no remote images, which keeps
 * generation fast and means a missing asset can never produce a broken card.
 * Satori's default sans is close enough to Geist at this size that the
 * difference is not worth a 200kB font fetch on every generation.
 */
export const NAVY = '#0B1120'
export const TEAL = '#14B8A6'
export const PAPER = '#F8FAFC'
export const MUTED = '#94A3B8'

export function OgShell({
  eyebrow,
  title,
  footer,
}: {
  eyebrow: string
  title: string
  footer?: string
}) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        background: NAVY,
        padding: '72px 80px',
        fontFamily: 'sans-serif',
      }}
    >
      {/* A single teal hairline stands in for the brand mark. It reads as
          deliberate at thumbnail size, where a small logo would not. */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 40, height: 4, background: TEAL, borderRadius: 2 }} />
        <div
          style={{
            color: MUTED,
            fontSize: 22,
            letterSpacing: 4,
            textTransform: 'uppercase',
          }}
        >
          {eyebrow}
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          color: PAPER,
          fontSize: title.length > 70 ? 62 : 76,
          lineHeight: 1.08,
          letterSpacing: -2,
          fontWeight: 600,
          maxWidth: 980,
        }}
      >
        {title}
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          color: MUTED,
          fontSize: 24,
        }}
      >
        <div style={{ display: 'flex', color: PAPER }}>Kova Media Group</div>
        <div style={{ display: 'flex' }}>{footer ?? 'kovamediagroup.com'}</div>
      </div>
    </div>
  )
}

export default function OpengraphImage() {
  return new ImageResponse(
    <OgShell
      eyebrow="Email & SMS"
      title="Email & SMS marketing that drives revenue."
    />,
    size,
  )
}
