'use client'

import { useState, useTransition } from 'react'

import { Button } from '@/components/ui/button'
import { Field, Input, Textarea } from '@/components/ui/field'
import { MediaFormField } from '@/features/admin/media/media-form-field'
import { RichTextField } from '@/features/admin/pages/section-editor/rich-text-field'
import type { ActionResult } from '@/server/actions/result'
import type { ResourceForEdit } from '@/server/content/resource-queries'
import type { RichText } from '@/server/content/schemas/rich-text'
import type { MediaAssetDto } from '@/server/content/types'

import {
  deleteResourceAction,
  publishResourceAction,
  saveResourceBody,
  saveResourceDetails,
  unpublishResourceAction,
} from './actions'

/**
 * The article editor.
 *
 * An article is prose, so the body is one rich-text document rather than the
 * full section catalogue. Offering an editor the choice of dropping a hero or a
 * case study grid into a blog post would be handing them a way to break the
 * design for no editorial gain (ADR-007).
 *
 * It is still stored as a `RICH_TEXT` section in the same content document, so
 * the public side renders it through the same `SectionRenderer` as everything
 * else — one rendering path, no special case.
 */
const BODY_SECTION_ID = 'article-body'

function extractBody(resource: ResourceForEdit): RichText {
  const section = resource.draft.sections.find(
    (candidate) => candidate.type === 'RICH_TEXT',
  )
  const data = (section?.data ?? {}) as { body?: unknown }
  return Array.isArray(data.body) ? (data.body as RichText) : []
}

export function ResourceEditor({
  resource,
  cover,
}: {
  resource: ResourceForEdit
  cover: MediaAssetDto | null
}) {
  const [body, setBody] = useState<RichText>(() => extractBody(resource))
  const [version, setVersion] = useState(resource.draftVersion)
  const [bodyState, setBodyState] = useState<
    { kind: 'idle' } | { kind: 'saved' } | { kind: 'error'; message: string }
  >({ kind: 'idle' })
  const [isSavingBody, startSavingBody] = useTransition()
  const [publishMessage, setPublishMessage] = useState<string | null>(null)
  const [isPublishing, startPublishing] = useTransition()

  const saveBody = () => {
    startSavingBody(async () => {
      const result = await saveResourceBody({
        id: resource.id,
        expectedVersion: version,
        content: {
          sections: [
            {
              id: BODY_SECTION_ID,
              type: 'RICH_TEXT',
              isEnabled: true,
              data: { body },
            },
          ],
        },
      })

      if (result.ok) {
        setVersion(result.data.version)
        setBodyState({ kind: 'saved' })
      } else {
        setBodyState({ kind: 'error', message: result.message })
      }
    })
  }

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border bg-card px-5 py-4">
        <div>
          <p className="text-sm font-medium text-ink-900">
            {resource.isLive
              ? resource.hasUnpublishedChanges
                ? 'Live · unpublished changes'
                : 'Live'
              : 'Draft'}
          </p>
          <p className="mt-0.5 text-xs text-ink-500">
            {resource.isLive ? (
              <a
                href={`/resources/${resource.slug}`}
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
          {publishMessage && (
            <span className="text-xs text-ink-600">{publishMessage}</span>
          )}
          {resource.isLive && (
            <Button
              variant="secondary"
              size="sm"
              disabled={isPublishing}
              onClick={() =>
                startPublishing(async () => {
                  const result = await unpublishResourceAction(resource.id)
                  setPublishMessage(result.ok ? 'Unpublished.' : result.message)
                })
              }
            >
              Unpublish
            </Button>
          )}
          <Button
            size="sm"
            disabled={isPublishing}
            onClick={() =>
              startPublishing(async () => {
                const result = await publishResourceAction(resource.id)
                setPublishMessage(result.ok ? 'Published.' : result.message)
              })
            }
          >
            {isPublishing ? 'Working…' : resource.isLive ? 'Republish' : 'Publish'}
          </Button>
        </div>
      </div>

      <DetailsForm resource={resource} cover={cover} />

      <section className="rounded-lg border border-border bg-card p-6">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-medium text-ink-950">Article</h2>
            <p className="mt-1 text-sm text-ink-500">
              Markdown-style shorthand: <code># </code> for a heading,
              <code> - </code> for a list item, <code>&gt; </code> for a quote.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {bodyState.kind === 'saved' && (
              <span className="text-xs text-success">Saved</span>
            )}
            {bodyState.kind === 'error' && (
              <span className="text-xs text-destructive">{bodyState.message}</span>
            )}
            <Button size="sm" onClick={saveBody} disabled={isSavingBody}>
              {isSavingBody ? 'Saving…' : 'Save article'}
            </Button>
          </div>
        </div>

        <RichTextField
          label="Body"
          value={body}
          onChange={(value) => {
            setBody(value)
            setBodyState({ kind: 'idle' })
          }}
        />
      </section>

      <DangerZone id={resource.id} title={resource.title} />
    </div>
  )
}

function DetailsForm({
  resource,
  cover,
}: {
  resource: ResourceForEdit
  cover: MediaAssetDto | null
}) {
  const [state, setState] = useState<ActionResult | null>(null)
  const [isSaving, startSaving] = useTransition()

  const submit = (formData: FormData) => {
    startSaving(async () => setState(await saveResourceDetails(null, formData)))
  }

  const errors = state && !state.ok ? state.fieldErrors : undefined

  return (
    <form
      action={submit}
      className="rounded-lg border border-border bg-card p-6"
      noValidate
    >
      <input type="hidden" name="id" value={resource.id} />

      <div className="mb-6 flex items-center justify-between gap-4">
        <h2 className="text-lg font-medium text-ink-950">Details</h2>
        <div className="flex items-center gap-3">
          {state?.ok && <span className="text-xs text-success">Saved</span>}
          {state && !state.ok && (
            <span className="text-xs text-destructive">{state.message}</span>
          )}
          <Button type="submit" size="sm" disabled={isSaving}>
            {isSaving ? 'Saving…' : 'Save details'}
          </Button>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          id="title"
          label="Title"
          error={errors?.title?.[0]}
          className="sm:col-span-2"
        >
          {(props) => <Input {...props} name="title" defaultValue={resource.title} />}
        </Field>

        <Field
          id="slug"
          label="URL slug"
          hint={`/resources/${resource.slug}`}
          error={errors?.slug?.[0]}
        >
          {(props) => <Input {...props} name="slug" defaultValue={resource.slug} />}
        </Field>

        <Field id="category" label="Category" error={errors?.category?.[0]}>
          {(props) => (
            <Input {...props} name="category" defaultValue={resource.category} />
          )}
        </Field>

        <Field
          id="excerpt"
          label="Excerpt"
          hint="Shown on the index card. Required to publish."
          error={errors?.excerpt?.[0]}
          className="sm:col-span-2"
        >
          {(props) => (
            <Textarea
              {...props}
              name="excerpt"
              rows={3}
              defaultValue={resource.excerpt}
            />
          )}
        </Field>

        <Field
          id="readTime"
          label="Read time"
          hint="Authored, not calculated — you know the piece better."
          error={errors?.readTime?.[0]}
        >
          {(props) => (
            <Input {...props} name="readTime" defaultValue={resource.readTime} />
          )}
        </Field>

        <MediaFormField name="coverId" label="Cover image" initialAsset={cover} />

        <div className="sm:col-span-2">
          <label className="flex items-center gap-2.5 text-sm text-ink-800">
            <input
              type="checkbox"
              name="isFeatured"
              defaultChecked={resource.isFeatured}
              className="size-4 rounded border-input accent-accent-600"
            />
            Feature at the top of the resources page
          </label>
        </div>

        <Field id="seoTitle" label="SEO title" error={errors?.seoTitle?.[0]}>
          {(props) => (
            <Input {...props} name="seoTitle" defaultValue={resource.seoTitle} />
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
              defaultValue={resource.seoDescription}
            />
          )}
        </Field>
      </div>
    </form>
  )
}

function DangerZone({ id, title }: { id: string; title: string }) {
  const [confirming, setConfirming] = useState(false)
  const [isDeleting, startDeleting] = useTransition()

  return (
    <section className="rounded-lg border border-destructive/25 bg-destructive/[0.03] p-6">
      <h2 className="text-sm font-medium text-ink-900">Delete this article</h2>
      <p className="mt-1 text-sm text-ink-600">
        Permanently removes “{title}” and its revision history. This cannot be undone.
      </p>

      {confirming ? (
        <div className="mt-4 flex items-center gap-3">
          <Button
            variant="destructive"
            size="sm"
            disabled={isDeleting}
            onClick={() => startDeleting(() => void deleteResourceAction(id))}
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
