'use client'

import { useActionState, useCallback, useMemo, useState, useTransition } from 'react'
import { useFormStatus } from 'react-dom'

import { Button } from '@/components/ui/button'
import { Field, Input, Label, Textarea } from '@/components/ui/field'
import { MediaFormField } from '@/features/admin/media/media-form-field'
import type { MediaAssetDto } from '@/server/content/types'
import type { ActionResult } from '@/server/actions/result'
import type { CaseStudyForEdit } from '@/server/content/case-study-queries'
import type { CaseStudyNarrative } from '@/server/content/schemas/case-study'

import {
  deleteCaseStudyAction,
  publishCaseStudyAction,
  saveCaseStudyDetails,
  saveCaseStudyNarrative,
  unpublishCaseStudyAction,
} from './actions'

/**
 * The case study editor.
 *
 * Two forms, deliberately separate. **Details** (slug, client, images, SEO) are
 * row columns and save atomically through a normal form post. **Narrative** is
 * the JSON document, saved explicitly with optimistic-concurrency checking so
 * two open tabs produce a conflict error rather than a silent clobber.
 *
 * There is no autosave here. A case study is written in long sittings, and a
 * background save that silently fails mid-edit is worse than a button that
 * tells you what happened.
 */
export function CaseStudyEditor({
  study,
  media,
}: {
  study: CaseStudyForEdit
  media: { hero: MediaAssetDto | null; logo: MediaAssetDto | null }
}) {
  const [narrative, setNarrative] = useState<CaseStudyNarrative>(study.narrative)
  const [version, setVersion] = useState(study.draftVersion)
  const [saveState, setSaveState] = useState<
    { kind: 'idle' } | { kind: 'saved' } | { kind: 'error'; message: string }
  >({ kind: 'idle' })
  const [isSaving, startSaving] = useTransition()
  const [publishState, setPublishState] = useState<string | null>(null)
  const [isPublishing, startPublishing] = useTransition()

  const update = useCallback(
    <K extends keyof CaseStudyNarrative>(key: K, value: CaseStudyNarrative[K]) => {
      setNarrative((current) => ({ ...current, [key]: value }))
      setSaveState({ kind: 'idle' })
    },
    [],
  )

  const saveNarrative = () => {
    startSaving(async () => {
      const result = await saveCaseStudyNarrative({
        id: study.id,
        expectedVersion: version,
        narrative,
      })

      if (result.ok) {
        setVersion(result.data.version)
        setSaveState({ kind: 'saved' })
      } else {
        setSaveState({ kind: 'error', message: result.message })
      }
    })
  }

  const publish = () => {
    startPublishing(async () => {
      const result = await publishCaseStudyAction(study.id)
      setPublishState(result.ok ? 'Published.' : result.message)
    })
  }

  const unpublish = () => {
    startPublishing(async () => {
      const result = await unpublishCaseStudyAction(study.id)
      setPublishState(result.ok ? 'Unpublished.' : result.message)
    })
  }

  return (
    <div className="flex flex-col gap-10">
      <StatusBar
        study={study}
        isPublishing={isPublishing}
        onPublish={publish}
        onUnpublish={unpublish}
        message={publishState}
      />

      <DetailsForm study={study} media={media} />

      <section className="rounded-lg border border-border bg-card p-6">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-medium text-ink-950">The story</h2>
            <p className="mt-1 text-sm text-ink-500">
              These blocks render in a fixed order on the case study page.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {saveState.kind === 'saved' && (
              <span className="text-xs text-success">Saved</span>
            )}
            {saveState.kind === 'error' && (
              <span className="text-xs text-destructive">{saveState.message}</span>
            )}
            <Button onClick={saveNarrative} disabled={isSaving} size="sm">
              {isSaving ? 'Saving…' : 'Save story'}
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-5">
          <TextBlock
            id="background"
            label="Background"
            value={narrative.background}
            onChange={(value) => update('background', value)}
          />
          <TextBlock
            id="challenge"
            label="The challenge"
            value={narrative.challenge}
            onChange={(value) => update('challenge', value)}
          />

          <StrategyList
            items={narrative.strategy}
            onChange={(value) => update('strategy', value)}
          />

          <TextBlock
            id="design"
            label="Design"
            value={narrative.design}
            onChange={(value) => update('design', value)}
          />
          <TextBlock
            id="automation"
            label="Automation"
            value={narrative.automation}
            onChange={(value) => update('automation', value)}
          />
          <TextBlock
            id="sms"
            label="SMS"
            value={narrative.sms}
            onChange={(value) => update('sms', value)}
          />

          <ResultsEditor
            results={narrative.results}
            onChange={(value) => update('results', value)}
          />

          <Field
            id="accent"
            label="Accent colour"
            hint="Any CSS colour. Used for this study's figures and card wash."
          >
            {(props) => (
              <div className="flex items-center gap-3">
                <Input
                  {...props}
                  value={narrative.accent}
                  onChange={(event) => update('accent', event.target.value)}
                />
                <span
                  aria-hidden
                  className="size-9 shrink-0 rounded-md border border-border"
                  style={{ backgroundColor: narrative.accent }}
                />
              </div>
            )}
          </Field>
        </div>
      </section>

      <DangerZone id={study.id} clientName={study.clientName} />
    </div>
  )
}

function StatusBar({
  study,
  isPublishing,
  onPublish,
  onUnpublish,
  message,
}: {
  study: CaseStudyForEdit
  isPublishing: boolean
  onPublish: () => void
  onUnpublish: () => void
  message: string | null
}) {
  const status = study.isLive
    ? study.hasUnpublishedChanges
      ? 'Live · unpublished changes'
      : 'Live'
    : 'Draft'

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border bg-card px-5 py-4">
      <div>
        <p className="text-sm font-medium text-ink-900">{status}</p>
        <p className="mt-0.5 text-xs text-ink-500">
          {study.isLive ? (
            <a
              href={`/case-studies/${study.slug}`}
              target="_blank"
              rel="noreferrer"
              className="hover:underline"
            >
              View on the site ↗
            </a>
          ) : (
            'Not visible on the site yet.'
          )}
        </p>
      </div>

      <div className="flex items-center gap-3">
        {message && <span className="text-xs text-ink-600">{message}</span>}
        {study.isLive && (
          <Button
            variant="secondary"
            size="sm"
            onClick={onUnpublish}
            disabled={isPublishing}
          >
            Unpublish
          </Button>
        )}
        <Button size="sm" onClick={onPublish} disabled={isPublishing}>
          {isPublishing ? 'Working…' : study.isLive ? 'Republish' : 'Publish'}
        </Button>
      </div>
    </div>
  )
}

function DetailsSubmit() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? 'Saving…' : 'Save details'}
    </Button>
  )
}

function DetailsForm({
  study,
  media,
}: {
  study: CaseStudyForEdit
  media: { hero: MediaAssetDto | null; logo: MediaAssetDto | null }
}) {
  const [state, formAction] = useActionState<ActionResult | null, FormData>(
    saveCaseStudyDetails,
    null,
  )
  const errors = state && !state.ok ? state.fieldErrors : undefined

  return (
    <form
      action={formAction}
      className="rounded-lg border border-border bg-card p-6"
      noValidate
    >
      <input type="hidden" name="id" value={study.id} />

      <div className="mb-6 flex items-center justify-between gap-4">
        <h2 className="text-lg font-medium text-ink-950">Details</h2>
        <div className="flex items-center gap-3">
          {state?.ok && <span className="text-xs text-success">Saved</span>}
          {state && !state.ok && (
            <span className="text-xs text-destructive">{state.message}</span>
          )}
          <DetailsSubmit />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="clientName" label="Client name" error={errors?.clientName?.[0]}>
          {(props) => (
            <Input {...props} name="clientName" defaultValue={study.clientName} />
          )}
        </Field>

        <Field
          id="industry"
          label="Category"
          hint="Shown above the client name."
          error={errors?.industry?.[0]}
        >
          {(props) => (
            <Input {...props} name="industry" defaultValue={study.industry} />
          )}
        </Field>

        <Field
          id="slug"
          label="URL slug"
          hint={`/case-studies/${study.slug}`}
          error={errors?.slug?.[0]}
          className="sm:col-span-2"
        >
          {(props) => <Input {...props} name="slug" defaultValue={study.slug} />}
        </Field>

        <Field
          id="headline"
          label="Headline"
          error={errors?.headline?.[0]}
          className="sm:col-span-2"
        >
          {(props) => (
            <Input {...props} name="headline" defaultValue={study.headline} />
          )}
        </Field>

        <Field
          id="summary"
          label="Summary"
          hint="Shown on the index and the homepage card."
          error={errors?.summary?.[0]}
          className="sm:col-span-2"
        >
          {(props) => (
            <Textarea {...props} name="summary" rows={3} defaultValue={study.summary} />
          )}
        </Field>

        <MediaFormField
          name="heroImageId"
          label="Hero image"
          initialAsset={media.hero}
        />
        <MediaFormField
          name="clientLogoId"
          label="Client logo"
          initialAsset={media.logo}
        />

        <div className="sm:col-span-2">
          <label className="flex items-center gap-2.5 text-sm text-ink-800">
            <input
              type="checkbox"
              name="isFeatured"
              defaultChecked={study.isFeatured}
              className="size-4 rounded border-input accent-accent-600"
            />
            Feature on the homepage
          </label>
        </div>

        <Field id="seoTitle" label="SEO title" error={errors?.seoTitle?.[0]}>
          {(props) => (
            <Input {...props} name="seoTitle" defaultValue={study.seoTitle} />
          )}
        </Field>

        <Field
          id="seoDescription"
          label="SEO description"
          error={errors?.seoDescription?.[0]}
        >
          {(props) => (
            <Input
              {...props}
              name="seoDescription"
              defaultValue={study.seoDescription}
            />
          )}
        </Field>
      </div>
    </form>
  )
}

function TextBlock({
  id,
  label,
  value,
  onChange,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <Field id={id} label={label}>
      {(props) => (
        <Textarea
          {...props}
          rows={4}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
    </Field>
  )
}

function StrategyList({
  items,
  onChange,
}: {
  items: string[]
  onChange: (items: string[]) => void
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label>Strategy points</Label>
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          <Input
            value={item}
            aria-label={`Strategy point ${index + 1}`}
            onChange={(event) => {
              const next = [...items]
              next[index] = event.target.value
              onChange(next)
            }}
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onChange(items.filter((_, i) => i !== index))}
          >
            Remove
          </Button>
        </div>
      ))}
      <div>
        <Button variant="secondary" size="sm" onClick={() => onChange([...items, ''])}>
          Add point
        </Button>
      </div>
    </div>
  )
}

function ResultsEditor({
  results,
  onChange,
}: {
  results: { value: string; label: string }[]
  onChange: (results: { value: string; label: string }[]) => void
}) {
  const canAdd = useMemo(() => results.length < 6, [results.length])

  return (
    <div className="flex flex-col gap-2">
      <Label>Headline results</Label>
      <p className="-mt-1 mb-1 text-xs text-ink-500">
        Values are shown as written — “3x”, “+22%”, “40%+”. The number animates; the
        qualifier stays.
      </p>
      {results.map((result, index) => (
        <div key={index} className="flex items-start gap-2">
          <Input
            value={result.value}
            aria-label={`Result ${index + 1} value`}
            placeholder="3x"
            className="w-28 shrink-0"
            onChange={(event) => {
              const next = [...results]
              next[index] = { ...result, value: event.target.value }
              onChange(next)
            }}
          />
          <Input
            value={result.label}
            aria-label={`Result ${index + 1} label`}
            placeholder="Increase in email revenue"
            onChange={(event) => {
              const next = [...results]
              next[index] = { ...result, label: event.target.value }
              onChange(next)
            }}
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onChange(results.filter((_, i) => i !== index))}
          >
            Remove
          </Button>
        </div>
      ))}
      {canAdd && (
        <div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onChange([...results, { value: '', label: '' }])}
          >
            Add result
          </Button>
        </div>
      )}
    </div>
  )
}

function DangerZone({ id, clientName }: { id: string; clientName: string }) {
  const [confirming, setConfirming] = useState(false)
  const [isDeleting, startDeleting] = useTransition()

  return (
    <section className="rounded-lg border border-destructive/25 bg-destructive/[0.03] p-6">
      <h2 className="text-sm font-medium text-ink-900">Delete this case study</h2>
      <p className="mt-1 text-sm text-ink-600">
        Permanently removes “{clientName}” and its revision history. This cannot be
        undone.
      </p>

      {confirming ? (
        <div className="mt-4 flex items-center gap-3">
          <Button
            variant="destructive"
            size="sm"
            disabled={isDeleting}
            onClick={() => startDeleting(() => void deleteCaseStudyAction(id))}
          >
            {isDeleting ? 'Deleting…' : 'Yes, delete permanently'}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setConfirming(false)}>
            Cancel
          </Button>
        </div>
      ) : (
        <Button
          variant="secondary"
          size="sm"
          className="mt-4"
          onClick={() => setConfirming(true)}
        >
          Delete
        </Button>
      )}
    </section>
  )
}
