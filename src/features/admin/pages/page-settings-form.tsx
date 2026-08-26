'use client'

import { useActionState, useState } from 'react'
import { useFormStatus } from 'react-dom'

import { Button } from '@/components/ui/button'
import { Field, Input, Textarea } from '@/components/ui/field'
import { MediaFormField } from '@/features/admin/media/media-form-field'
import type { ActionResult } from '@/server/actions/result'
import type { PageForEdit } from '@/server/content/admin-queries'
import type { MediaAssetDto } from '@/server/content/types'

import { savePageSettings } from './actions'

/**
 * Page name and search-engine settings.
 *
 * Collapsed by default. Ninety-nine visits out of a hundred are here to change
 * a sentence, and putting the SEO fields above the section list would make the
 * common task the one you scroll past.
 *
 * A system page's URL is fixed: its slug is wired into a real route file, so
 * changing it would 404 the page. The field is shown read-only rather than
 * hidden — "you cannot change this" is more useful than the address vanishing.
 */
export function PageSettingsForm({
  page,
  seoImage,
}: {
  page: PageForEdit
  seoImage: MediaAssetDto | null
}) {
  const [isOpen, setOpen] = useState(false)
  const [state, formAction] = useActionState<ActionResult | null, FormData>(
    savePageSettings,
    null,
  )
  const errors = state && !state.ok ? state.fieldErrors : undefined

  return (
    <section className="rounded-lg border border-border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5">
        <div>
          <h2 className="text-sm font-medium text-ink-950">
            Page name &amp; search settings
          </h2>
          <p className="mt-0.5 text-xs text-ink-500">
            The title in the admin, and how this page appears in Google and when shared.
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          aria-expanded={isOpen}
          onClick={() => setOpen((current) => !current)}
        >
          {isOpen ? 'Close' : 'Edit'}
        </Button>
      </div>

      {isOpen && (
        <form action={formAction} className="border-t border-border p-5" noValidate>
          <input type="hidden" name="pageId" value={page.id} />
          {page.isSystem && <input type="hidden" name="slug" value={page.slug} />}

          <div className="grid gap-5 sm:grid-cols-2">
            <Field id="page-title" label="Page name" error={errors?.title?.[0]}>
              {(props) => <Input {...props} name="title" defaultValue={page.title} />}
            </Field>

            <Field
              id="page-slug"
              label="Web address"
              hint={
                page.isSystem
                  ? 'Fixed — this page has a designed layout of its own.'
                  : 'The part of the URL after the domain.'
              }
              error={errors?.slug?.[0]}
            >
              {(props) =>
                page.isSystem ? (
                  <Input {...props} value={`/${page.slug}`} readOnly disabled />
                ) : (
                  <Input {...props} name="slug" defaultValue={page.slug} />
                )
              }
            </Field>

            <Field
              id="page-seo-title"
              label="Search title"
              hint="Shown as the clickable headline in search results. Leave empty to use the page name."
              error={errors?.seoTitle?.[0]}
              className="sm:col-span-2"
            >
              {(props) => (
                <Input {...props} name="seoTitle" defaultValue={page.seoTitle} />
              )}
            </Field>

            <Field
              id="page-seo-description"
              label="Search description"
              hint="The grey summary underneath. Around 150 characters reads best."
              error={errors?.seoDescription?.[0]}
              className="sm:col-span-2"
            >
              {(props) => (
                <Textarea
                  {...props}
                  name="seoDescription"
                  rows={3}
                  defaultValue={page.seoDescription}
                />
              )}
            </Field>

            <div className="sm:col-span-2">
              <MediaFormField
                name="seoImageId"
                label="Share image"
                initialAsset={seoImage}
                hint="Used when this page is shared on social media. Falls back to the site default."
              />
            </div>

            <div className="sm:col-span-2">
              <label className="flex items-center gap-2.5 text-sm text-ink-800">
                <input
                  type="checkbox"
                  name="seoNoIndex"
                  defaultChecked={page.seoNoIndex}
                  className="size-4 rounded border-input accent-accent-600"
                />
                Hide this page from search engines
              </label>
            </div>
          </div>

          <div className="mt-5 flex items-center gap-3">
            <SaveButton />
            {state?.ok && <span className="text-xs text-success">Saved.</span>}
            {state && !state.ok && (
              <span className="text-xs text-destructive">{state.message}</span>
            )}
          </div>
        </form>
      )}
    </section>
  )
}

function SaveButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? 'Saving…' : 'Save settings'}
    </Button>
  )
}
