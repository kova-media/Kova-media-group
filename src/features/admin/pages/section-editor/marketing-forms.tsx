'use client'

import { MediaField } from '@/features/admin/media/media-field'
import type { MediaAssetDto } from '@/server/content/types'

import {
  CtaField,
  SelectField,
  NumberField,
  RepeaterField,
  StringListField,
  TextAreaField,
  TextField,
} from './section-fields'

/**
 * The editing screens for the designed marketing bands.
 *
 * Hand-written, not generated from the Zod schema. A generated form produces a
 * key/value editor — `heading`, `body`, `points[0]` — and these are the screens
 * the owner opens every week. Field order, wording and hints are the difference
 * between a CMS someone uses and one they avoid, so they are chosen rather than
 * derived. The schema stays the source of truth for validation either way.
 *
 * Every hint says what the field *does on the page*, in the words someone who
 * has never seen the code would use.
 */

type FormProps = {
  data: Record<string, unknown>
  onChange: (data: Record<string, unknown>) => void
}

/** The image-bearing forms also need the media map and the picker's callback. */
type MediaFormProps = FormProps & {
  media: Map<string, MediaAssetDto>
  registerAsset: (asset: MediaAssetDto) => void
}

const str = (value: unknown): string => (typeof value === 'string' ? value : '')
const arr = <T,>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : [])
const strs = (value: unknown): string[] =>
  arr<unknown>(value).filter((item): item is string => typeof item === 'string')
const cta = (value: unknown) =>
  value && typeof value === 'object'
    ? {
        label: str((value as Record<string, unknown>)['label']),
        href: str((value as Record<string, unknown>)['href']),
      }
    : { label: '', href: '' }

const set = ({ data, onChange }: FormProps, key: string, value: unknown): void =>
  onChange({ ...data, [key]: value })

/* --------------------------------------------------------------- Page header */

export function PageHeaderForm(props: FormProps) {
  const { data } = props
  return (
    <div className="flex flex-col gap-4">
      <TextField
        label="Page label"
        hint="The small word beside the headline that tells a visitor where they are — “About”, “Services”."
        maxLength={40}
        value={str(data['eyebrow'])}
        onChange={(value) => set(props, 'eyebrow', value)}
      />
      <TextAreaField
        label="Headline"
        rows={2}
        maxLength={200}
        hint="The main sentence at the top of the page."
        value={str(data['title'])}
        onChange={(value) => set(props, 'title', value)}
      />
      <TextAreaField
        label="Intro paragraph"
        maxLength={400}
        hint="Optional. Sits under the headline."
        value={str(data['description'])}
        onChange={(value) => set(props, 'description', value)}
      />
    </div>
  )
}

/* ----------------------------------------------------------------- Home hero */

export function HomeHeroForm(props: FormProps) {
  const { data } = props
  return (
    <div className="flex flex-col gap-4">
      <TextAreaField
        label="Headline"
        rows={3}
        maxLength={200}
        hint="Press Enter where you want the headline to break onto a new line. Each line animates in on its own."
        value={str(data['headline'])}
        onChange={(value) => set(props, 'headline', value)}
      />
      <TextAreaField
        label="Supporting paragraph"
        maxLength={400}
        hint="The paragraph under the headline."
        value={str(data['subhead'])}
        onChange={(value) => set(props, 'subhead', value)}
      />
      <CtaField
        label="Main button"
        value={cta(data['primaryCta'])}
        onChange={(value) => set(props, 'primaryCta', value)}
      />
      <CtaField
        label="Second button"
        value={cta(data['secondaryCta'])}
        onChange={(value) => set(props, 'secondaryCta', value)}
      />
      <HeroArtworkFields {...props} />
    </div>
  )
}

/**
 * The words and figures inside the three hero panels.
 *
 * Grouped and labelled by panel, because that is how someone looking at the
 * homepage thinks about them — "the reporting panel", "the email", "the text
 * message" — not as a flat list of twelve strings. The panels themselves, their
 * angles and their choreography stay in code.
 */
function HeroArtworkFields(props: FormProps) {
  const artwork = (props.data['artwork'] ?? {}) as Record<string, unknown>
  const report = (artwork['report'] ?? {}) as Record<string, unknown>
  const email = (artwork['email'] ?? {}) as Record<string, unknown>
  const sms = (artwork['sms'] ?? {}) as Record<string, unknown>

  const setPanel = (panel: string, next: Record<string, unknown>) =>
    set(props, 'artwork', { ...artwork, [panel]: next })

  return (
    <div className="flex flex-col gap-4 rounded-md border border-border p-4">
      <div>
        <p className="text-sm font-medium text-ink-900">Artwork beside the headline</p>
        <p className="mt-1 text-xs text-ink-500">
          The three panels are illustration, not live reporting. Whatever you put here
          is what a visitor reads, so keep it to figures you are comfortable showing.
          Clearing a box hides that line.
        </p>
      </div>

      <fieldset className="flex flex-col gap-3 border-t border-border pt-3">
        <legend className="sr-only">Reporting panel</legend>
        <p className="text-xs font-medium tracking-wide text-ink-600 uppercase">
          Reporting panel
        </p>
        <TextField
          label="Figure label"
          maxLength={40}
          value={str(report['label'])}
          onChange={(value) => setPanel('report', { ...report, label: value })}
        />
        <div className="grid grid-cols-3 gap-3">
          <TextField
            label="Figure"
            hint="Written as shown."
            maxLength={24}
            value={str(report['value'])}
            onChange={(value) => setPanel('report', { ...report, value })}
          />
          <TextField
            label="Change"
            maxLength={16}
            value={str(report['change'])}
            onChange={(value) => setPanel('report', { ...report, change: value })}
          />
          <TextField
            label="Period"
            maxLength={12}
            value={str(report['period'])}
            onChange={(value) => setPanel('report', { ...report, period: value })}
          />
        </div>
        <RepeaterField<Figure>
          label="Summary figures"
          addLabel="Add figure"
          max={3}
          items={arr<Figure>(report['stats'])}
          createItem={() => ({ value: '', label: '' })}
          onChange={(next) => setPanel('report', { ...report, stats: next })}
          renderItem={(figure, update) => (
            <div className="grid grid-cols-2 gap-3">
              <TextField
                label="Figure"
                maxLength={16}
                value={figure.value}
                onChange={(value) => update({ ...figure, value })}
              />
              <TextField
                label="Label"
                maxLength={32}
                value={figure.label}
                onChange={(value) => update({ ...figure, label: value })}
              />
            </div>
          )}
        />
      </fieldset>

      <fieldset className="flex flex-col gap-3 border-t border-border pt-3">
        <legend className="sr-only">Email preview</legend>
        <p className="text-xs font-medium tracking-wide text-ink-600 uppercase">
          Email preview
        </p>
        <TextField
          label="Subject line"
          maxLength={80}
          value={str(email['subject'])}
          onChange={(value) => setPanel('email', { ...email, subject: value })}
        />
        <TextField
          label="From"
          maxLength={60}
          value={str(email['sender'])}
          onChange={(value) => setPanel('email', { ...email, sender: value })}
        />
        <TextField
          label="Button"
          maxLength={40}
          value={str(email['button'])}
          onChange={(value) => setPanel('email', { ...email, button: value })}
        />
      </fieldset>

      <fieldset className="flex flex-col gap-3 border-t border-border pt-3">
        <legend className="sr-only">Text message</legend>
        <p className="text-xs font-medium tracking-wide text-ink-600 uppercase">
          Text message
        </p>
        <TextField
          label="Header"
          maxLength={24}
          value={str(sms['label'])}
          onChange={(value) => setPanel('sms', { ...sms, label: value })}
        />
        <TextAreaField
          label="Message sent"
          rows={2}
          maxLength={200}
          value={str(sms['message'])}
          onChange={(value) => setPanel('sms', { ...sms, message: value })}
        />
        <TextField
          label="Reply received"
          maxLength={80}
          value={str(sms['reply'])}
          onChange={(value) => setPanel('sms', { ...sms, reply: value })}
        />
      </fieldset>
    </div>
  )
}

/* ------------------------------------------------------------ Client marquee */

export function ClientMarqueeForm(props: FormProps) {
  const { data } = props
  return (
    <div className="flex flex-col gap-4">
      <TextField
        label="Label above the names"
        hint="Optional. Leave empty to show just the names."
        maxLength={120}
        value={str(data['caption'])}
        onChange={(value) => set(props, 'caption', value)}
      />
      <StringListField
        label="Client names"
        hint="Shown in the scrolling row. The whole band disappears if this is empty."
        addLabel="Add name"
        placeholder="Zilkee"
        max={30}
        maxLength={60}
        items={strs(data['clients'])}
        onChange={(value) => set(props, 'clients', value)}
      />
    </div>
  )
}

/* -------------------------------------------------------------- Figures band */

type Figure = { value: string; label: string }

export function MetricsBandForm(props: FormProps) {
  const { data } = props
  return (
    <div className="flex flex-col gap-4">
      <TextAreaField
        label="Headline"
        rows={2}
        maxLength={200}
        value={str(data['heading'])}
        onChange={(value) => set(props, 'heading', value)}
      />
      <TextAreaField
        label="Supporting paragraph"
        maxLength={400}
        value={str(data['body'])}
        onChange={(value) => set(props, 'body', value)}
      />
      <RepeaterField<Figure>
        label="Figures"
        addLabel="Add figure"
        max={6}
        items={arr<Figure>(data['metrics'])}
        createItem={() => ({ value: '', label: '' })}
        onChange={(next) => set(props, 'metrics', next)}
        renderItem={(figure, update) => (
          <div className="flex flex-col gap-3">
            <TextField
              label="Figure"
              hint="Written exactly as it should appear — “+44.5%”, “$334.7K”, “3x”. The number counts up; the rest stays."
              maxLength={24}
              value={figure.value}
              onChange={(value) => update({ ...figure, value })}
            />
            <TextField
              label="What it measures"
              maxLength={90}
              value={figure.label}
              onChange={(value) => update({ ...figure, label: value })}
            />
          </div>
        )}
      />
      <p className="text-xs text-ink-500">
        With no figures the whole band is hidden — the section is the numbers, so it is
        better absent than empty. Only add figures you can stand behind.
      </p>
    </div>
  )
}

/* --------------------------------------------------------- Services overview */

type OverviewService = {
  title: string
  summary: string
  points: string[]
  href: string
}

export function ServicesOverviewForm(props: FormProps) {
  const { data } = props
  return (
    <div className="flex flex-col gap-4">
      <TextAreaField
        label="Headline"
        rows={2}
        maxLength={200}
        value={str(data['heading'])}
        onChange={(value) => set(props, 'heading', value)}
      />
      <TextAreaField
        label="Supporting paragraph"
        maxLength={400}
        value={str(data['body'])}
        onChange={(value) => set(props, 'body', value)}
      />
      <RepeaterField<OverviewService>
        label="Services"
        addLabel="Add service"
        max={6}
        items={arr<OverviewService>(data['services'])}
        createItem={() => ({ title: '', summary: '', points: [], href: '/services' })}
        onChange={(next) => set(props, 'services', next)}
        renderItem={(service, update) => (
          <div className="flex flex-col gap-3">
            <TextField
              label="Service name"
              maxLength={80}
              value={service.title}
              onChange={(value) => update({ ...service, title: value })}
            />
            <TextAreaField
              label="One-line summary"
              rows={2}
              maxLength={320}
              value={service.summary}
              onChange={(value) => update({ ...service, summary: value })}
            />
            <StringListField
              label="Bullet points"
              hint="Up to four are shown on the homepage."
              addLabel="Add point"
              max={8}
              maxLength={120}
              items={service.points ?? []}
              onChange={(value) => update({ ...service, points: value })}
            />
            <TextField
              label="Links to"
              maxLength={300}
              placeholder="/services"
              value={service.href}
              onChange={(value) => update({ ...service, href: value })}
            />
          </div>
        )}
      />
    </div>
  )
}

/* ---------------------------------------------------------------- Work index */

export function WorkIndexForm(props: FormProps) {
  const { data } = props
  return (
    <div className="flex flex-col gap-4">
      <TextField
        label="Small label"
        hint="Sits on the rule above the headline — “Selected work”."
        maxLength={40}
        value={str(data['eyebrow'])}
        onChange={(value) => set(props, 'eyebrow', value)}
      />
      <TextField
        label="Link to all work"
        hint="The link on the right of that rule. Leave empty to hide it."
        maxLength={40}
        value={str(data['allWorkLabel'])}
        onChange={(value) => set(props, 'allWorkLabel', value)}
      />
      <TextAreaField
        label="Headline"
        rows={2}
        maxLength={200}
        value={str(data['heading'])}
        onChange={(value) => set(props, 'heading', value)}
      />
      <TextAreaField
        label="Supporting paragraph"
        maxLength={400}
        value={str(data['body'])}
        onChange={(value) => set(props, 'body', value)}
      />
      <NumberField
        label="How many to show"
        hint="Between 1 and 6."
        value={typeof data['limit'] === 'number' ? (data['limit'] as number) : 3}
        onChange={(value) => set(props, 'limit', Math.min(6, Math.max(1, value)))}
      />
      <p className="text-xs text-ink-500">
        The studies themselves — names, figures, summaries — are edited under Case
        studies. Which ones appear here is their “Feature on the homepage” setting and
        their order.
      </p>
    </div>
  )
}

/* ------------------------------------------------------------------- Process */

type Step = { title: string; description: string }

function StepsRepeater({
  items,
  onChange,
}: {
  items: Step[]
  onChange: (items: Step[]) => void
}) {
  return (
    <RepeaterField<Step>
      label="Steps"
      addLabel="Add step"
      max={8}
      items={items}
      createItem={() => ({ title: '', description: '' })}
      onChange={onChange}
      renderItem={(step, update) => (
        <div className="flex flex-col gap-3">
          <TextField
            label="Step name"
            maxLength={80}
            value={step.title}
            onChange={(value) => update({ ...step, title: value })}
          />
          <TextAreaField
            label="What happens"
            rows={3}
            maxLength={600}
            value={step.description}
            onChange={(value) => update({ ...step, description: value })}
          />
        </div>
      )}
    />
  )
}

type FlowStepItem = { label: string; kind: string; icon: string; badge: string }

const FLOW_KINDS = [
  { value: 'trigger', label: 'Trigger — what starts it' },
  { value: 'action', label: 'Action — something is sent' },
  { value: 'wait', label: 'Wait — a pause' },
  { value: 'goal', label: 'Goal — the outcome' },
]

const FLOW_ICONS = [
  { value: 'none', label: 'No icon (shows the short label instead)' },
  { value: 'click', label: 'Sign-up' },
  { value: 'mail', label: 'Email' },
  { value: 'sms', label: 'Text message' },
  { value: 'trend', label: 'Result' },
]

/**
 * The automation diagram beside the process steps.
 *
 * Step type and icon are fixed lists, so the diagram can be relabelled and
 * reordered but not restyled — the four tile treatments and five glyphs are the
 * design. The short label is what a step with no icon shows in its tile, which
 * is how "2d" appears on the wait step.
 */
function FlowFields(props: FormProps) {
  const flow = (props.data['flow'] ?? {}) as Record<string, unknown>
  const setFlow = (next: Record<string, unknown>) => set(props, 'flow', next)

  return (
    <div className="flex flex-col gap-4 rounded-md border border-border p-4">
      <div>
        <p className="text-sm font-medium text-ink-900">Automation diagram</p>
        <p className="mt-1 text-xs text-ink-500">
          The illustrated flow beside the steps. Remove every step to hide it.
        </p>
      </div>

      <TextField
        label="Diagram title"
        maxLength={60}
        value={str(flow['title'])}
        onChange={(value) => setFlow({ ...flow, title: value })}
      />

      <RepeaterField<FlowStepItem>
        label="Flow steps"
        addLabel="Add step"
        max={8}
        items={arr<FlowStepItem>(flow['steps'])}
        createItem={() => ({ label: '', kind: 'action', icon: 'none', badge: '' })}
        onChange={(next) => setFlow({ ...flow, steps: next })}
        renderItem={(step, update) => (
          <div className="flex flex-col gap-3">
            <TextField
              label="Label"
              maxLength={60}
              value={step.label}
              onChange={(value) => update({ ...step, label: value })}
            />
            <div className="grid grid-cols-2 gap-3">
              <SelectField
                label="Step type"
                value={step.kind}
                options={FLOW_KINDS}
                onChange={(kind) => update({ ...step, kind })}
              />
              <SelectField
                label="Icon"
                value={step.icon}
                options={FLOW_ICONS}
                onChange={(icon) => update({ ...step, icon })}
              />
            </div>
            {step.icon === 'none' && (
              <TextField
                label="Short label"
                hint="Shown in the tile when there is no icon, e.g. “2d”."
                maxLength={4}
                value={step.badge}
                onChange={(value) => update({ ...step, badge: value })}
              />
            )}
          </div>
        )}
      />
    </div>
  )
}

export function ProcessStepsForm(props: FormProps) {
  const { data } = props
  return (
    <div className="flex flex-col gap-4">
      <TextAreaField
        label="Headline"
        rows={2}
        maxLength={200}
        value={str(data['heading'])}
        onChange={(value) => set(props, 'heading', value)}
      />
      <TextAreaField
        label="Supporting paragraph"
        maxLength={400}
        value={str(data['body'])}
        onChange={(value) => set(props, 'body', value)}
      />
      <StepsRepeater
        items={arr<Step>(data['steps'])}
        onChange={(next) => set(props, 'steps', next)}
      />
      <p className="text-xs text-ink-500">
        Steps are numbered automatically, so reordering them here renumbers them on the
        page.
      </p>
      <FlowFields {...props} />
    </div>
  )
}

export function ProcessDetailForm(props: FormProps) {
  const { data } = props
  return (
    <div className="flex flex-col gap-4">
      <StepsRepeater
        items={arr<Step>(data['steps'])}
        onChange={(next) => set(props, 'steps', next)}
      />
      <TextField
        label="Label above the diagram"
        maxLength={40}
        value={str(data['asideEyebrow'])}
        onChange={(value) => set(props, 'asideEyebrow', value)}
      />
      <TextAreaField
        label="Paragraph above the diagram"
        maxLength={400}
        value={str(data['asideBody'])}
        onChange={(value) => set(props, 'asideBody', value)}
      />
      <FlowFields {...props} />
    </div>
  )
}

/* ----------------------------------------------------------------- Statement */

export function StatementForm(props: FormProps) {
  const { data } = props
  return (
    <div className="flex flex-col gap-4">
      <TextAreaField
        label="Statement"
        rows={5}
        maxLength={800}
        hint="One paragraph, set large and alone on the page."
        value={str(data['statement'])}
        onChange={(value) => set(props, 'statement', value)}
      />
      <CtaField
        label="Button"
        value={cta(data['cta'])}
        onChange={(value) => set(props, 'cta', value)}
      />
    </div>
  )
}

/* -------------------------------------------------------------- Testimonials */

export function TestimonialsForm(props: FormProps) {
  const { data } = props
  return (
    <div className="flex flex-col gap-4">
      <TextAreaField
        label="Headline"
        rows={2}
        maxLength={200}
        value={str(data['heading'])}
        onChange={(value) => set(props, 'heading', value)}
      />
      <p className="text-xs text-ink-500">
        The quotes come from Library → Testimonials, in their configured order. While
        there are none the whole band is hidden, which is deliberate — a quote has to be
        a real one from a real client.
      </p>
    </div>
  )
}

/* ------------------------------------------------------------------ Final CTA */

export function FinalCtaForm(props: FormProps) {
  const { data } = props
  return (
    <div className="flex flex-col gap-4">
      <TextAreaField
        label="Headline"
        rows={2}
        maxLength={200}
        value={str(data['heading'])}
        onChange={(value) => set(props, 'heading', value)}
      />
      <TextAreaField
        label="Supporting paragraph"
        maxLength={400}
        value={str(data['body'])}
        onChange={(value) => set(props, 'body', value)}
      />
      <CtaField
        label="Main button"
        value={cta(data['primaryCta'])}
        onChange={(value) => set(props, 'primaryCta', value)}
      />
      <CtaField
        label="Second button"
        value={cta(data['secondaryCta'])}
        onChange={(value) => set(props, 'secondaryCta', value)}
      />
    </div>
  )
}

/* -------------------------------------------------------------------- Values */

type Value = { title: string; body: string }

export function ValuesForm(props: FormProps) {
  const { data } = props
  return (
    <div className="flex flex-col gap-4">
      <TextField
        label="Small label"
        maxLength={40}
        value={str(data['eyebrow'])}
        onChange={(value) => set(props, 'eyebrow', value)}
      />
      <TextAreaField
        label="Standing statement"
        rows={4}
        maxLength={600}
        hint="The larger paragraph in the left-hand column."
        value={str(data['statement'])}
        onChange={(value) => set(props, 'statement', value)}
      />
      <RepeaterField<Value>
        label="Beliefs"
        addLabel="Add belief"
        max={8}
        items={arr<Value>(data['items'])}
        createItem={() => ({ title: '', body: '' })}
        onChange={(next) => set(props, 'items', next)}
        renderItem={(item, update) => (
          <div className="flex flex-col gap-3">
            <TextField
              label="Heading"
              maxLength={90}
              value={item.title}
              onChange={(value) => update({ ...item, title: value })}
            />
            <TextAreaField
              label="Body"
              rows={3}
              maxLength={600}
              value={item.body}
              onChange={(value) => update({ ...item, body: value })}
            />
          </div>
        )}
      />
    </div>
  )
}

/* ------------------------------------------------------------ Partner badges */

type Badge = { media?: { mediaId: string }; name: string; href: string }

export function PartnerBadgesForm({ media, registerAsset, ...props }: MediaFormProps) {
  const { data } = props

  return (
    <div className="flex flex-col gap-4">
      <TextField
        label="Label"
        hint="The small heading beside the badges. Optional — leave empty for badges alone."
        maxLength={60}
        value={str(data['label'])}
        onChange={(value) => set(props, 'label', value)}
      />

      <RepeaterField<Badge>
        label="Badges"
        addLabel="Add badge"
        max={4}
        items={arr<Badge>(data['badges'])}
        createItem={() => ({ name: '', href: '' })}
        onChange={(next) => set(props, 'badges', next)}
        renderItem={(badge, update) => (
          <div className="flex flex-col gap-3">
            <TextField
              label="Name"
              hint="Read aloud in place of the image, e.g. “Shopify Partner”."
              maxLength={60}
              value={badge.name}
              onChange={(value) => update({ ...badge, name: value })}
            />
            <MediaField
              label="Badge artwork"
              value={badge.media}
              media={media}
              registerAsset={registerAsset}
              onChange={(value) =>
                update({
                  ...badge,
                  ...(value ? { media: value } : { media: undefined }),
                })
              }
            />
            <TextField
              label="Links to"
              hint="Optional — usually your listing in the partner directory."
              maxLength={300}
              placeholder="https://…"
              value={badge.href}
              onChange={(value) => update({ ...badge, href: value })}
            />
          </div>
        )}
      />

      <p className="text-xs text-ink-500">
        Use the official artwork supplied by each partner programme. A badge with no
        artwork is not shown, and the whole row disappears when none of them have any —
        so nothing claims a partnership until you have uploaded the real badge.
      </p>
    </div>
  )
}

/* ------------------------------------------------------------- Services list */

type DetailedService = {
  title: string
  summary: string
  description: string
  points: string[]
}

export function ServicesListForm(props: FormProps) {
  const { data } = props
  return (
    <div className="flex flex-col gap-4">
      <TextField
        label="Heading above the bullet list"
        hint="Repeated for every service — “What that includes”."
        maxLength={60}
        value={str(data['includesLabel'])}
        onChange={(value) => set(props, 'includesLabel', value)}
      />
      <RepeaterField<DetailedService>
        label="Services"
        addLabel="Add service"
        max={6}
        items={arr<DetailedService>(data['services'])}
        createItem={() => ({ title: '', summary: '', description: '', points: [] })}
        onChange={(next) => set(props, 'services', next)}
        renderItem={(service, update) => (
          <div className="flex flex-col gap-3">
            <TextField
              label="Service name"
              maxLength={80}
              value={service.title}
              onChange={(value) => update({ ...service, title: value })}
            />
            <TextAreaField
              label="One-line summary"
              rows={2}
              maxLength={320}
              hint="The larger sentence directly under the name."
              value={service.summary}
              onChange={(value) => update({ ...service, summary: value })}
            />
            <TextAreaField
              label="Full description"
              rows={5}
              maxLength={1200}
              value={service.description}
              onChange={(value) => update({ ...service, description: value })}
            />
            <StringListField
              label="What it includes"
              addLabel="Add point"
              max={10}
              maxLength={120}
              items={service.points ?? []}
              onChange={(value) => update({ ...service, points: value })}
            />
          </div>
        )}
      />
    </div>
  )
}

export function ServicesClosingForm(props: FormProps) {
  const { data } = props
  return (
    <div className="flex flex-col gap-4">
      <TextField
        label="Small label"
        hint="The word in the narrow left column — “How”."
        maxLength={40}
        value={str(data['label'])}
        onChange={(value) => set(props, 'label', value)}
      />
      <TextAreaField
        label="Statement"
        rows={4}
        maxLength={600}
        value={str(data['statement'])}
        onChange={(value) => set(props, 'statement', value)}
      />
      <TextAreaField
        label="Follow-on paragraph"
        rows={5}
        maxLength={900}
        value={str(data['body'])}
        onChange={(value) => set(props, 'body', value)}
      />
    </div>
  )
}

/* ---------------------------------------------------------- Case study index */

export function CaseStudyListForm() {
  return (
    <p className="text-sm text-ink-600">
      This band lists every published case study, in the order set under Case studies.
      There is nothing to write here — edit the studies themselves under{' '}
      <span className="font-medium text-ink-900">Case studies</span>.
    </p>
  )
}

/* ------------------------------------------------------------------- Contact */

export function ContactIntroForm(props: FormProps) {
  const { data } = props
  return (
    <div className="flex flex-col gap-4">
      <TextField
        label="Small label"
        maxLength={40}
        value={str(data['eyebrow'])}
        onChange={(value) => set(props, 'eyebrow', value)}
      />
      <TextAreaField
        label="Headline"
        rows={3}
        maxLength={200}
        hint="Press Enter where the headline should break onto a new line."
        value={str(data['headline'])}
        onChange={(value) => set(props, 'headline', value)}
      />
      <TextAreaField
        label="Supporting paragraph"
        maxLength={400}
        value={str(data['body'])}
        onChange={(value) => set(props, 'body', value)}
      />
      <StringListField
        label="What to expect"
        addLabel="Add point"
        max={6}
        maxLength={200}
        items={strs(data['points'])}
        onChange={(value) => set(props, 'points', value)}
      />
      <TextField
        label="Reply-time note"
        hint="The line beside the clock icon."
        maxLength={120}
        value={str(data['responseNote'])}
        onChange={(value) => set(props, 'responseNote', value)}
      />
      <TextField
        label="Form button"
        hint="The button that sends the enquiry."
        maxLength={60}
        value={str(data['submitLabel'])}
        onChange={(value) => set(props, 'submitLabel', value)}
      />
      <TextField
        label="After sending — heading"
        maxLength={120}
        value={str(data['successHeading'])}
        onChange={(value) => set(props, 'successHeading', value)}
      />
      <TextAreaField
        label="After sending — message"
        maxLength={320}
        value={str(data['successBody'])}
        onChange={(value) => set(props, 'successBody', value)}
      />
      <p className="text-xs text-ink-500">
        The email address shown here is the contact email in Settings. The form&rsquo;s
        own fields are fixed — they are wired to the enquiry inbox and the notification
        email. Leave the three boxes above empty to keep the wording shown on the site
        today.
      </p>
    </div>
  )
}

/* ---------------------------------------------------------------------- Book */

export function BookDetailsForm(props: FormProps) {
  const { data } = props
  return (
    <div className="flex flex-col gap-4">
      <StringListField
        label="What to expect"
        addLabel="Add point"
        max={6}
        maxLength={200}
        items={strs(data['points'])}
        onChange={(value) => set(props, 'points', value)}
      />
      <TextField
        label="Text before the email address"
        maxLength={120}
        value={str(data['writeFirstLabel'])}
        onChange={(value) => set(props, 'writeFirstLabel', value)}
      />
      <p className="text-xs text-ink-500">
        The calendar itself comes from the booking link in Settings, and the email
        address from the contact email there.
      </p>
    </div>
  )
}
