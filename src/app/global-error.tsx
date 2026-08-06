'use client'

/**
 * Replaces the root layout when rendering fails there, so it must supply its
 * own <html> and <body>. Kept dependency-free and inline-styled for that reason.
 */
export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="en">
      <body
        style={{
          fontFamily: 'ui-sans-serif, system-ui, sans-serif',
          display: 'flex',
          minHeight: '100vh',
          alignItems: 'center',
          justifyContent: 'center',
          margin: 0,
          color: '#1f1f1f',
          background: '#fdfdfb',
        }}
      >
        <main style={{ maxWidth: '28rem', padding: '2rem', textAlign: 'center' }}>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 500, margin: 0 }}>
            Something went wrong
          </h1>
          <p style={{ marginTop: '0.75rem', color: '#6b6b6b', fontSize: '0.875rem' }}>
            Please try again in a moment.
          </p>
          <button
            onClick={reset}
            style={{
              marginTop: '1.5rem',
              padding: '0.5rem 1.25rem',
              borderRadius: '0.375rem',
              border: 'none',
              background: '#1f1f1f',
              color: '#fdfdfb',
              fontSize: '0.875rem',
              cursor: 'pointer',
            }}
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  )
}
