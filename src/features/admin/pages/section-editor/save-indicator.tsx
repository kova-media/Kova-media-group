'use client'

import type { SaveState } from './use-page-draft'

/**
 * Autosave status. Conflicts get a `role="alert"` because they need action;
 * routine save states are polite so they do not interrupt typing.
 */
export function SaveIndicator({ state }: { state: SaveState }) {
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

  const label = {
    idle: 'All changes saved',
    dirty: 'Unsaved changes…',
    saving: 'Saving…',
    saved: 'Saved',
  }[state.status]

  return (
    <p aria-live="polite" className="text-sm text-ink-500">
      {label}
    </p>
  )
}
