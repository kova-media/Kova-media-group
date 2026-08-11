'use client'

import { useState, useTransition } from 'react'

import { Button } from '@/components/ui/button'
import { Field, Input, Label, Textarea } from '@/components/ui/field'
import { MediaFormField } from '@/features/admin/media/media-form-field'
import type { ActionResult } from '@/server/actions/result'
import type { MediaAssetDto } from '@/server/content/types'

import { saveSiteSettings } from './actions'

export type SettingsFormValues = {
  siteName: string
  contactEmail: string
  bookingUrl: string
  defaultSeoTitle: string
  defaultSeoDescription: string
  tagline: string
  navigation: { label: string; href: string }[]
}

export function SettingsForm({
  values,
  media,
}: {
  values: SettingsFormValues
  media: {
    logo: MediaAssetDto | null
    logoDark: MediaAssetDto | null
    seoImage: MediaAssetDto | null
  }
}) {
  const [state, setState] = useState<ActionResult | null>(null)
  const [isSaving, startSaving] = useTransition()
  const [nav, setNav] = useState(values.navigation)

  const submit = (formData: FormData) => {
    startSaving(async () => setState(await saveSiteSettings(null, formData)))
  }

  const errors = state && !state.ok ? state.fieldErrors : undefined

  return (
    <form action={submit} className="flex flex-col gap-8" noValidate>
      <section className="rounded-lg border border-border bg-card p-6">
        <h2 className="mb-5 text-lg font-medium text-ink-950">Brand</h2>

        <div className="grid gap-5 sm:grid-cols-2">
          <MediaFormField
            name="logoId"
            label="Logo"
            initialAsset={media.logo}
            hint="Shown in the header and footer. SVG or transparent PNG."
          />
          <MediaFormField
            name="logoDarkId"
            label="Logo (dark backgrounds)"
            initialAsset={media.logoDark}
            hint="Optional. Falls back to the logo above."
          />

          <Field id="siteName" label="Site name" error={errors?.siteName?.[0]}>
            {(props) => (
              <Input {...props} name="siteName" defaultValue={values.siteName} />
            )}
          </Field>

          <Field id="tagline" label="Footer tagline" error={errors?.tagline?.[0]}>
            {(props) => (
              <Input {...props} name="tagline" defaultValue={values.tagline} />
            )}
          </Field>
        </div>
      </section>

      <section className="rounded-lg border border-border bg-card p-6">
        <h2 className="mb-5 text-lg font-medium text-ink-950">Contact &amp; booking</h2>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            id="contactEmail"
            label="Contact email"
            hint="Where enquiries are shown and replies are sent."
            error={errors?.contactEmail?.[0]}
          >
            {(props) => (
              <Input
                {...props}
                name="contactEmail"
                type="email"
                defaultValue={values.contactEmail}
              />
            )}
          </Field>

          <Field
            id="bookingUrl"
            label="Booking link"
            hint="The scheduler embedded on /book."
            error={errors?.bookingUrl?.[0]}
          >
            {(props) => (
              <Input {...props} name="bookingUrl" defaultValue={values.bookingUrl} />
            )}
          </Field>
        </div>
      </section>

      <section className="rounded-lg border border-border bg-card p-6">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-medium text-ink-950">Navigation</h2>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setNav([...nav, { label: '', href: '' }])}
          >
            Add link
          </Button>
        </div>

        <div className="flex flex-col gap-3">
          {nav.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className="flex-1">
                <Label htmlFor={`navLabel-${index}`} className="sr-only">
                  Label
                </Label>
                <Input
                  id={`navLabel-${index}`}
                  name="navLabel"
                  placeholder="Label"
                  defaultValue={item.label}
                />
              </div>
              <div className="flex-1">
                <Label htmlFor={`navHref-${index}`} className="sr-only">
                  Path
                </Label>
                <Input
                  id={`navHref-${index}`}
                  name="navHref"
                  placeholder="/services"
                  defaultValue={item.href}
                />
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setNav(nav.filter((_, i) => i !== index))}
              >
                Remove
              </Button>
            </div>
          ))}
          {nav.length === 0 && (
            <p className="text-sm text-ink-500">
              No links configured — the site falls back to its default navigation.
            </p>
          )}
        </div>
      </section>

      <section className="rounded-lg border border-border bg-card p-6">
        <h2 className="mb-5 text-lg font-medium text-ink-950">SEO defaults</h2>

        <div className="flex flex-col gap-5">
          <Field
            id="defaultSeoTitle"
            label="Default title"
            error={errors?.defaultSeoTitle?.[0]}
          >
            {(props) => (
              <Input
                {...props}
                name="defaultSeoTitle"
                defaultValue={values.defaultSeoTitle}
              />
            )}
          </Field>

          <Field
            id="defaultSeoDescription"
            label="Default description"
            error={errors?.defaultSeoDescription?.[0]}
          >
            {(props) => (
              <Textarea
                {...props}
                name="defaultSeoDescription"
                rows={3}
                defaultValue={values.defaultSeoDescription}
              />
            )}
          </Field>

          <MediaFormField
            name="defaultSeoImageId"
            label="Share image"
            initialAsset={media.seoImage}
            hint="Used when a page is shared and has no image of its own."
          />
        </div>
      </section>

      <div className="flex items-center gap-3">
        <Button type="submit" size="lg" disabled={isSaving}>
          {isSaving ? 'Saving…' : 'Save settings'}
        </Button>
        {state?.ok && <span className="text-sm text-success">Saved.</span>}
        {state && !state.ok && (
          <span className="text-sm text-destructive">{state.message}</span>
        )}
      </div>
    </form>
  )
}
