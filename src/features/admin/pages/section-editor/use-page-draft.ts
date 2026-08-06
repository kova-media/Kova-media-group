'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import type { PageContent } from '@/server/content/schemas/page'

import { saveDraft } from '../actions'

export type SaveState =
  | { status: 'idle' }
  | { status: 'dirty' }
  | { status: 'saving' }
  | { status: 'saved'; at: number }
  | { status: 'conflict'; message: string }
  | { status: 'error'; message: string }

const AUTOSAVE_DELAY_MS = 900

/**
 * Owns the draft document and its autosave lifecycle.
 *
 * Autosaving drafts is safe because publishing is the deliberate act
 * (CMS.md §10) — losing an editor's work is not.
 *
 * Conflicts are terminal on purpose. When the server reports that the version
 * moved underneath us, we stop saving and tell the editor to reload rather than
 * silently picking a winner and destroying somebody's edit.
 */
export function usePageDraft(
  pageId: string,
  initial: PageContent,
  initialVersion: number,
) {
  const [content, setContent] = useState<PageContent>(initial)
  const [saveState, setSaveState] = useState<SaveState>({ status: 'idle' })

  const versionRef = useRef(initialVersion)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingRef = useRef<PageContent | null>(null)
  const inFlightRef = useRef(false)
  const blockedRef = useRef(false)

  const flush = useCallback(async () => {
    if (blockedRef.current || inFlightRef.current) return

    inFlightRef.current = true

    // Loops rather than recursing: edits that land mid-save are picked up on the
    // next pass, and a self-referencing callback would be a TDZ hazard.
    while (pendingRef.current && !blockedRef.current) {
      const next = pendingRef.current
      pendingRef.current = null
      setSaveState({ status: 'saving' })

      const result = await saveDraft({
        pageId,
        expectedVersion: versionRef.current,
        content: next,
      })

      if (!result.ok) {
        // Stop autosaving; further writes would clobber the newer version.
        blockedRef.current = true
        setSaveState({ status: 'conflict', message: result.message })
        break
      }

      versionRef.current = result.data.version
    }

    inFlightRef.current = false

    if (!blockedRef.current) {
      setSaveState({ status: 'saved', at: Date.now() })
    }
  }, [pageId])

  const schedule = useCallback(
    (next: PageContent) => {
      if (blockedRef.current) return

      pendingRef.current = next
      setSaveState({ status: 'dirty' })

      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => void flush(), AUTOSAVE_DELAY_MS)
    },
    [flush],
  )

  const update = useCallback(
    (updater: (current: PageContent) => PageContent) => {
      setContent((current) => {
        const next = updater(current)
        schedule(next)
        return next
      })
    },
    [schedule],
  )

  /** Applies a server-side change (add section) that already bumped the version. */
  const applyServerUpdate = useCallback((next: PageContent, version: number) => {
    versionRef.current = version
    pendingRef.current = null
    setContent(next)
    setSaveState({ status: 'saved', at: Date.now() })
  }, [])

  const saveNow = useCallback(async () => {
    if (timerRef.current) clearTimeout(timerRef.current)
    await flush()
  }, [flush])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  // Last line of defence against closing the tab mid-edit. The browser shows
  // its own generic prompt; the message is ignored by every modern browser.
  useEffect(() => {
    const hasUnsaved = saveState.status === 'dirty' || saveState.status === 'saving'
    if (!hasUnsaved) return

    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }

    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [saveState.status])

  return {
    content,
    saveState,
    update,
    applyServerUpdate,
    saveNow,
    getVersion: () => versionRef.current,
    isBlocked: () => blockedRef.current,
  }
}
