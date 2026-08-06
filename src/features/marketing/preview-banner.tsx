import { draftMode } from 'next/headers'

/**
 * Persistent indicator that the visitor is looking at unpublished content.
 *
 * Rendered from the marketing layout inside a Suspense boundary — it reads
 * request state, and awaiting it above the boundary would stop the whole public
 * site from prerendering.
 */
export async function PreviewBanner() {
  const { isEnabled } = await draftMode()

  if (!isEnabled) return null

  return (
    <aside
      role="status"
      className="sticky top-0 z-50 flex items-center justify-center gap-4 bg-ink-950 px-4 py-2 text-xs text-paper"
    >
      <span>Preview — showing unpublished changes. Do not share this link.</span>
      <form action="/api/preview/exit" method="POST">
        <button
          type="submit"
          className="underline underline-offset-2 hover:no-underline"
        >
          Exit preview
        </button>
      </form>
    </aside>
  )
}
