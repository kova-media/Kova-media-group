'use client'

import type { SaveState } from './use-page-draft'

/**
 * Autosave status. Conflicts get a `role="alert"` because they need action;
 * routine save states are polite so they do not interrupt typing.
 *
 * The labels say what autosave actually did: it saves a draft. Nothing
 * here is live until the editor publishes it, so the saved states say so
 * plainly instead of the old "All changes saved".
 */
export function SaveIndicator({
  state,
  isLive,
}: {
  state: SaveState
  isLive?: boolean
}) {
  if (state.status === 'conflict' || state.status === 'error') {
    return (
      <p role="alert" className="text-sm text-destructive">
        {state.message}{' '}
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="underline underline-offset-2"
        >
          Reload
        </button>
      </p>
    )
  }

  const savedLabel = isLive
    ? 'Draft saved — live site unchanged'
    : 'Draft saved — not live yet'

  const label = {
    idle: savedLabel,
    dirty: 'Saving draft…',
    saving: 'Saving draft…',
    saved: savedLabel,
  }[state.status]

  return (
    <p aria-live="polite" className="text-sm text-ink-500">
      {label}
    </p>
  )
}
