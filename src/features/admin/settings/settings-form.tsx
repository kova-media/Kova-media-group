'use client'

import { useState, useTransition } from 'react'

import { Button } from '@/components/ui/button'
import { Field, Input, Label, Textarea } from '@/components/ui/field'
import { MediaFormField } from '@/features/admin/media/media-form-field'
import type { ActionResult } from '@/server/actions/result'
import type { MediaAssetDto } from '@/server/content/types'

import type {
  SiteFooterContent,
  SiteHeaderContent,
} from '@/server/content/schemas/settings'

import { saveSiteSettings } from './actions'
import { FooterColumnsEditor } from './footer-columns-editor'

export type SettingsFormValues = {
  siteName: string
  contactEmail: string
  bookingUrl: string
  defaultSeoTitle: string
  defaultSeoDescription: string
  navigation: { label: string; href: string }[]
  header: Required<SiteHeaderContent>
  footer: Required<SiteFooterContent>
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

          <Field
            id="siteName"
            label="Site name"
            hint="Used in the copyright line and as the fallback wordmark."
            error={errors?.siteName?.[0]}
          >
            {(props) => (
              <Input {...props} name="siteName" defaultValue={values.siteName} />
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

        <div className="mt-6 grid gap-5 border-t border-border pt-5 sm:grid-cols-2">
          <Field
            id="headerCtaLabel"
            label="Header button text"
            hint="The button at the top right of every page."
          >
            {(props) => (
              <Input
                {...props}
                name="headerCtaLabel"
                defaultValue={values.header.ctaLabel}
              />
            )}
          </Field>

          <Field id="headerCtaHref" label="Header button link">
            {(props) => (
              <Input
                {...props}
                name="headerCtaHref"
                defaultValue={values.header.ctaHref}
              />
            )}
          </Field>
        </div>
      </section>

      <section className="rounded-lg border border-border bg-card p-6">
        <h2 className="mb-5 text-lg font-medium text-ink-950">Footer</h2>

        <div className="flex flex-col gap-5">
          <Field
            id="footerDescription"
            label="Paragraph under the logo"
            error={errors?.footer?.[0]}
          >
            {(props) => (
              <Textarea
                {...props}
                name="footerDescription"
                rows={3}
                defaultValue={values.footer.description}
              />
            )}
          </Field>

          <FooterColumnsEditor columns={values.footer.columns} />

          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              id="footerNote"
              label="After the copyright line"
              hint="Follows “© 2026 Kova Media Group.”"
            >
              {(props) => (
                <Input {...props} name="footerNote" defaultValue={values.footer.note} />
              )}
            </Field>

            <Field
              id="footerTagline"
              label="Closing line"
              hint="The small line at the bottom right of the footer."
            >
              {(props) => (
                <Input
                  {...props}
                  name="footerTagline"
                  defaultValue={values.footer.tagline}
                />
              )}
            </Field>
          </div>
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
