'use client'

import { useActionState, useCallback, useMemo, useState, useTransition } from 'react'
import { useFormStatus } from 'react-dom'

import { Button } from '@/components/ui/button'
import { Field, Input, Label, Textarea } from '@/components/ui/field'
import { MediaFormField } from '@/features/admin/media/media-form-field'
import type { MediaAssetDto } from '@/server/content/types'
import type { ActionResult } from '@/server/actions/result'
import type { CaseStudyForEdit } from '@/server/content/case-study-queries'
import {
  DEFAULT_CASE_STUDY_LABELS,
  type CaseStudyBlock,
  type CaseStudyCta,
  type CaseStudyLabels,
  type CaseStudyNarrative,
} from '@/server/content/schemas/case-study'

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
            hint="Leave empty for an engagement where SMS was not run — the block is dropped rather than shown blank."
            value={narrative.sms}
            onChange={(value) => update('sms', value)}
          />

          <ExtraBlocks
            blocks={narrative.blocks}
            onChange={(value) => update('blocks', value)}
          />

          <ResultsEditor
            results={narrative.results}
            onChange={(value) => update('results', value)}
          />

          <Field
            id="resultsPeriod"
            label="Results period"
            hint="The window the figures above cover, e.g. November 2024 – July 2025. Shown under them. Leave blank if there is no stated period."
          >
            {(props) => (
              <Input
                {...props}
                value={narrative.resultsPeriod}
                onChange={(event) => update('resultsPeriod', event.target.value)}
              />
            )}
          </Field>

          <BlockHeadings
            labels={narrative.labels}
            onChange={(value) => update('labels', value)}
          />

          <ClosingCtaFields
            cta={narrative.cta}
            onChange={(value) => update('cta', value)}
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
        {/* Opens the unpublished draft in a new tab, so the editor keeps their
            place. Same rendering path as the live page — what you see here is
            what Publish would ship. */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() =>
            window.open(
              `/api/preview?type=case-study&slug=${encodeURIComponent(study.slug)}`,
              '_blank',
            )
          }
        >
          Preview
        </Button>
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
  hint,
  value,
  onChange,
}: {
  id: string
  label: string
  hint?: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <Field id={id} label={label} hint={hint}>
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

/**
 * Additional labelled blocks.
 *
 * The named fields above cover the shape every Kova engagement has had so far.
 * This is for the one that does not — a heading and a paragraph, added here,
 * with no code change and no new section type.
 */
function ExtraBlocks({
  blocks,
  onChange,
}: {
  blocks: CaseStudyBlock[]
  onChange: (blocks: CaseStudyBlock[]) => void
}) {
  const move = (from: number, to: number) => {
    if (to < 0 || to >= blocks.length) return
    const next = [...blocks]
    const [moved] = next.splice(from, 1)
    if (moved) next.splice(to, 0, moved)
    onChange(next)
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <Label>Extra blocks</Label>
        <Button
          variant="secondary"
          size="sm"
          disabled={blocks.length >= 6}
          onClick={() => onChange([...blocks, { label: '', body: '' }])}
        >
          Add block
        </Button>
      </div>
      <p className="-mt-1 text-xs text-ink-500">
        Shown after the blocks above, in this order. A block needs both a heading and
        text to appear.
      </p>

      {blocks.map((block, index) => (
        <div key={index} className="rounded-md border border-border bg-paper-sunk p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs text-ink-500">#{index + 1}</span>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                aria-label={`Move extra block ${index + 1} up`}
                disabled={index === 0}
                onClick={() => move(index, index - 1)}
              >
                ↑
              </Button>
              <Button
                variant="ghost"
                size="sm"
                aria-label={`Move extra block ${index + 1} down`}
                disabled={index === blocks.length - 1}
                onClick={() => move(index, index + 1)}
              >
                ↓
              </Button>
              <Button
                variant="ghost"
                size="sm"
                aria-label={`Remove extra block ${index + 1}`}
                onClick={() => onChange(blocks.filter((_, i) => i !== index))}
              >
                Remove
              </Button>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Input
              value={block.label}
              aria-label={`Extra block ${index + 1} heading`}
              placeholder="Deliverability"
              maxLength={40}
              onChange={(event) =>
                onChange(
                  blocks.map((item, i) =>
                    i === index ? { ...item, label: event.target.value } : item,
                  ),
                )
              }
            />
            <Textarea
              rows={4}
              value={block.body}
              aria-label={`Extra block ${index + 1} text`}
              onChange={(event) =>
                onChange(
                  blocks.map((item, i) =>
                    i === index ? { ...item, body: event.target.value } : item,
                  ),
                )
              }
            />
          </div>
        </div>
      ))}
    </div>
  )
}

const LABEL_FIELDS: { key: keyof CaseStudyLabels; caption: string }[] = [
  { key: 'background', caption: 'Background block' },
  { key: 'challenge', caption: 'Challenge block' },
  { key: 'design', caption: 'Design block' },
  { key: 'automation', caption: 'Automation block' },
  { key: 'sms', caption: 'SMS block' },
  { key: 'strategy', caption: 'Strategy list' },
  { key: 'next', caption: 'Next-study link' },
]

/** Heading overrides. Blank means "use the wording shown as the placeholder". */
function BlockHeadings({
  labels,
  onChange,
}: {
  labels: CaseStudyLabels
  onChange: (labels: CaseStudyLabels) => void
}) {
  return (
    <fieldset className="rounded-md border border-border p-4">
      <legend className="px-1 text-sm font-medium text-ink-800">Block headings</legend>
      <p className="mb-3 text-xs text-ink-500">
        Optional. Leave a box empty to keep the wording shown in it.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {LABEL_FIELDS.map(({ key, caption }) => (
          <div key={key} className="flex flex-col gap-1.5">
            <Label htmlFor={`label-${key}`}>{caption}</Label>
            <Input
              id={`label-${key}`}
              value={labels[key] ?? ''}
              placeholder={DEFAULT_CASE_STUDY_LABELS[key]}
              maxLength={40}
              onChange={(event) => onChange({ ...labels, [key]: event.target.value })}
            />
          </div>
        ))}
      </div>
    </fieldset>
  )
}

/**
 * The closing band for this study only.
 *
 * Left empty — which is the default — the study uses the site-wide closing copy
 * from Pages → Case studies, so changing it there reaches every study at once.
 */
function ClosingCtaFields({
  cta,
  onChange,
}: {
  cta: CaseStudyCta
  onChange: (cta: CaseStudyCta) => void
}) {
  return (
    <fieldset className="rounded-md border border-border p-4">
      <legend className="px-1 text-sm font-medium text-ink-800">
        Closing call to action
      </legend>
      <p className="mb-3 text-xs text-ink-500">
        Optional. With the headline empty this study shows the site-wide closing band
        from Pages → Case studies.
      </p>
      <div className="flex flex-col gap-3">
        <Field id="cta-heading" label="Headline">
          {(props) => (
            <Input
              {...props}
              value={cta.heading}
              maxLength={200}
              onChange={(event) => onChange({ ...cta, heading: event.target.value })}
            />
          )}
        </Field>
        <Field id="cta-body" label="Paragraph">
          {(props) => (
            <Textarea
              {...props}
              rows={2}
              value={cta.body}
              maxLength={400}
              onChange={(event) => onChange({ ...cta, body: event.target.value })}
            />
          )}
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field id="cta-primary-label" label="Main button text">
            {(props) => (
              <Input
                {...props}
                value={cta.primaryLabel}
                maxLength={60}
                onChange={(event) =>
                  onChange({ ...cta, primaryLabel: event.target.value })
                }
              />
            )}
          </Field>
          <Field id="cta-primary-href" label="Main button link">
            {(props) => (
              <Input
                {...props}
                value={cta.primaryHref}
                placeholder="/book"
                maxLength={300}
                onChange={(event) =>
                  onChange({ ...cta, primaryHref: event.target.value })
                }
              />
            )}
          </Field>
          <Field id="cta-secondary-label" label="Second button text">
            {(props) => (
              <Input
                {...props}
                value={cta.secondaryLabel}
                maxLength={60}
                onChange={(event) =>
                  onChange({ ...cta, secondaryLabel: event.target.value })
                }
              />
            )}
          </Field>
          <Field id="cta-secondary-href" label="Second button link">
            {(props) => (
              <Input
                {...props}
                value={cta.secondaryHref}
                placeholder="/case-studies"
                maxLength={300}
                onChange={(event) =>
                  onChange({ ...cta, secondaryHref: event.target.value })
                }
              />
            )}
          </Field>
        </div>
      </div>
    </fieldset>
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
