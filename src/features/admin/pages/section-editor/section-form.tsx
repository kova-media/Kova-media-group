'use client'

import type { MediaAssetDto } from '@/server/content/types'
import type { SectionType } from '@/server/content/sections/types'

import { MediaField } from '../../media/media-field'
import {
  BookDetailsForm,
  CaseStudyListForm,
  ClientMarqueeForm,
  ContactIntroForm,
  FinalCtaForm,
  HomeHeroForm,
  MetricsBandForm,
  PageHeaderForm,
  PartnerBadgesForm,
  ProcessDetailForm,
  ProcessStepsForm,
  ServicesClosingForm,
  ServicesListForm,
  ServicesOverviewForm,
  StatementForm,
  TestimonialsForm,
  ValuesForm,
  WorkIndexForm,
} from './marketing-forms'
import { RichTextField } from './rich-text-field'
import {
  LinkField,
  NumberField,
  RepeaterField,
  SelectField,
  TextAreaField,
  TextField,
} from './section-fields'

/**
 * Per-section forms.
 *
 * Hand-written rather than generated from the Zod schema. A generated form
 * would produce a generic key/value editor; these are the screens the owner
 * uses every week, and field grouping, ordering and wording carry real weight.
 * The schema remains the source of truth for *validation* either way.
 */

type FormProps = {
  data: Record<string, unknown>
  onChange: (data: Record<string, unknown>) => void
  media: Map<string, MediaAssetDto>
  /** Adds a newly picked asset to the map so it renders without a refetch. */
  registerAsset: (asset: MediaAssetDto) => void
}

const str = (value: unknown): string => (typeof value === 'string' ? value : '')
const arr = <T,>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : [])
const link = (value: unknown) =>
  value && typeof value === 'object' && 'label' in value
    ? (value as { label: string; href: string })
    : undefined

const METRIC_UNITS = [
  { value: 'PERCENT' as const, label: 'Percent (%)' },
  { value: 'CURRENCY_USD' as const, label: 'US dollars ($)' },
  { value: 'MULTIPLIER' as const, label: 'Multiplier (×)' },
  { value: 'ABSOLUTE' as const, label: 'Plain number' },
]

function EyebrowField({ data, onChange }: Pick<FormProps, 'data' | 'onChange'>) {
  return (
    <TextField
      label="Eyebrow"
      hint="Small label above the heading. Optional."
      maxLength={60}
      value={str(data['eyebrow'])}
      onChange={(value) => onChange({ ...data, eyebrow: value || undefined })}
    />
  )
}

function HeroForm({ data, onChange, media, registerAsset }: FormProps) {
  return (
    <div className="flex flex-col gap-4">
      <EyebrowField data={data} onChange={onChange} />
      <TextAreaField
        label="Headline"
        rows={2}
        maxLength={160}
        value={str(data['headline'])}
        onChange={(value) => onChange({ ...data, headline: value })}
      />
      <TextAreaField
        label="Subhead"
        maxLength={320}
        value={str(data['subhead'])}
        onChange={(value) => onChange({ ...data, subhead: value || undefined })}
      />
      <LinkField
        label="Primary call to action"
        value={link(data['primaryCta'])}
        onChange={(value) => onChange({ ...data, primaryCta: value })}
      />
      <LinkField
        label="Secondary call to action"
        value={link(data['secondaryCta'])}
        onChange={(value) => onChange({ ...data, secondaryCta: value })}
      />
      <MediaField
        label="Image"
        value={data['media'] as { mediaId: string } | undefined}
        media={media}
        registerAsset={registerAsset}
        onChange={(value) => onChange({ ...data, media: value })}
      />
    </div>
  )
}

function LogoStripForm({ data, onChange }: FormProps) {
  return (
    <div className="flex flex-col gap-4">
      <TextField
        label="Caption"
        maxLength={120}
        value={str(data['caption'])}
        onChange={(value) => onChange({ ...data, caption: value || undefined })}
      />
      <p className="text-xs text-ink-500">
        Logos come from the library. Leave the selection empty to show every published
        logo in its configured order.
      </p>
    </div>
  )
}

function ProofMetricsForm({ data, onChange }: FormProps) {
  type Metric = { label: string; value: number; unit: string; timeframe?: string }
  const metrics = arr<Metric>(data['metrics'])

  return (
    <div className="flex flex-col gap-4">
      <EyebrowField data={data} onChange={onChange} />
      <TextField
        label="Heading"
        maxLength={160}
        value={str(data['heading'])}
        onChange={(value) => onChange({ ...data, heading: value || undefined })}
      />
      <RepeaterField<Metric>
        label="Metrics"
        addLabel="Add metric"
        max={6}
        items={metrics}
        createItem={() => ({ label: '', value: 0, unit: 'PERCENT' })}
        onChange={(next) => onChange({ ...data, metrics: next })}
        renderItem={(metric, update) => (
          <div className="flex flex-col gap-3">
            <TextField
              label="Label"
              maxLength={80}
              value={metric.label}
              onChange={(value) => update({ ...metric, label: value })}
            />
            <div className="grid grid-cols-2 gap-3">
              <NumberField
                label="Value"
                value={metric.value}
                onChange={(value) => update({ ...metric, value })}
              />
              <SelectField
                label="Unit"
                value={metric.unit as (typeof METRIC_UNITS)[number]['value']}
                options={METRIC_UNITS}
                onChange={(unit) => update({ ...metric, unit })}
              />
            </div>
            <TextField
              label="Timeframe"
              hint='For example "first 90 days". Optional.'
              maxLength={60}
              value={metric.timeframe ?? ''}
              onChange={(value) => update({ ...metric, timeframe: value || undefined })}
            />
          </div>
        )}
      />
    </div>
  )
}

function NarrativeForm({ data, onChange, media, registerAsset }: FormProps) {
  return (
    <div className="flex flex-col gap-4">
      <EyebrowField data={data} onChange={onChange} />
      <TextField
        label="Heading"
        maxLength={200}
        value={str(data['heading'])}
        onChange={(value) => onChange({ ...data, heading: value || undefined })}
      />
      <RichTextField
        label="Body"
        value={data['body']}
        onChange={(value) => onChange({ ...data, body: value })}
      />
      <MediaField
        label="Image"
        value={data['media'] as { mediaId: string } | undefined}
        media={media}
        registerAsset={registerAsset}
        onChange={(value) => onChange({ ...data, media: value })}
      />
      <SelectField
        label="Image position"
        value={(str(data['mediaPosition']) || 'right') as 'left' | 'right' | 'below'}
        options={[
          { value: 'right', label: 'Right' },
          { value: 'left', label: 'Left' },
          { value: 'below', label: 'Below' },
        ]}
        onChange={(value) => onChange({ ...data, mediaPosition: value })}
      />
    </div>
  )
}

function OutcomesForm({ data, onChange, media, registerAsset }: FormProps) {
  type Outcome = { title: string; detail: string }
  const key = 'outcomes' in data ? 'outcomes' : 'points'
  const items = arr<Outcome>(data[key])

  return (
    <div className="flex flex-col gap-4">
      <EyebrowField data={data} onChange={onChange} />
      <TextField
        label="Heading"
        maxLength={200}
        value={str(data['heading'])}
        onChange={(value) => onChange({ ...data, heading: value })}
      />
      <RichTextField
        label="Body"
        value={data['body']}
        onChange={(value) => onChange({ ...data, body: value })}
      />
      <RepeaterField<Outcome>
        label={key === 'outcomes' ? 'Outcomes' : 'Points'}
        addLabel="Add"
        max={6}
        items={items}
        createItem={() => ({ title: '', detail: '' })}
        onChange={(next) => onChange({ ...data, [key]: next })}
        renderItem={(item, update) => (
          <div className="flex flex-col gap-3">
            <TextField
              label="Title"
              maxLength={80}
              value={item.title}
              onChange={(value) => update({ ...item, title: value })}
            />
            <TextAreaField
              label="Detail"
              rows={2}
              maxLength={240}
              value={item.detail}
              onChange={(value) => update({ ...item, detail: value })}
            />
          </div>
        )}
      />
      {'media' in data || key === 'outcomes' ? (
        <MediaField
          label="Image"
          value={data['media'] as { mediaId: string } | undefined}
          media={media}
          registerAsset={registerAsset}
          onChange={(value) => onChange({ ...data, media: value })}
        />
      ) : null}
    </div>
  )
}

function FaqForm({ data, onChange }: FormProps) {
  type Item = { question: string; answer: unknown }
  const items = arr<Item>(data['items'])

  return (
    <div className="flex flex-col gap-4">
      <EyebrowField data={data} onChange={onChange} />
      <TextField
        label="Heading"
        maxLength={160}
        value={str(data['heading'])}
        onChange={(value) => onChange({ ...data, heading: value || undefined })}
      />
      <RepeaterField<Item>
        label="Questions"
        addLabel="Add question"
        max={12}
        items={items}
        createItem={() => ({ question: '', answer: [] })}
        onChange={(next) => onChange({ ...data, items: next })}
        renderItem={(item, update) => (
          <div className="flex flex-col gap-3">
            <TextField
              label="Question"
              maxLength={200}
              value={item.question}
              onChange={(value) => update({ ...item, question: value })}
            />
            <RichTextField
              label="Answer"
              value={item.answer}
              onChange={(value) => update({ ...item, answer: value })}
            />
          </div>
        )}
      />
    </div>
  )
}

function CtaForm({ data, onChange }: FormProps) {
  return (
    <div className="flex flex-col gap-4">
      <EyebrowField data={data} onChange={onChange} />
      <TextField
        label="Heading"
        maxLength={200}
        value={str(data['heading'])}
        onChange={(value) => onChange({ ...data, heading: value })}
      />
      <TextAreaField
        label="Body"
        maxLength={320}
        value={str(data['body'])}
        onChange={(value) => onChange({ ...data, body: value || undefined })}
      />
      <LinkField
        label="Primary call to action"
        value={link(data['primaryCta']) ?? { label: '', href: '' }}
        onChange={(value) =>
          onChange({ ...data, primaryCta: value ?? { label: '', href: '' } })
        }
      />
      <LinkField
        label="Secondary call to action"
        value={link(data['secondaryCta'])}
        onChange={(value) => onChange({ ...data, secondaryCta: value })}
      />
    </div>
  )
}

function RichTextForm({ data, onChange }: FormProps) {
  return (
    <div className="flex flex-col gap-4">
      <TextField
        label="Heading"
        maxLength={200}
        value={str(data['heading'])}
        onChange={(value) => onChange({ ...data, heading: value || undefined })}
      />
      <RichTextField
        label="Body"
        value={data['body']}
        onChange={(value) => onChange({ ...data, body: value })}
      />
    </div>
  )
}

/**
 * Sections whose only content is a reference to a library entity. The picker
 * itself lands with the library screens; until then the id is editable directly
 * so the section is never a dead end.
 */
function ReferenceForm({
  data,
  onChange,
  field,
  label,
  hint,
}: FormProps & { field: string; label: string; hint: string }) {
  return (
    <div className="flex flex-col gap-4">
      {'eyebrow' in data && <EyebrowField data={data} onChange={onChange} />}
      <TextField
        label={label}
        hint={hint}
        value={str(data[field])}
        onChange={(value) => onChange({ ...data, [field]: value })}
      />
    </div>
  )
}

export function SectionForm({ type, ...props }: FormProps & { type: SectionType }) {
  switch (type) {
    // ------------------------------------------------------------- Marketing
    case 'PAGE_HEADER':
      return <PageHeaderForm {...props} />
    case 'HOME_HERO':
      return <HomeHeroForm {...props} />
    case 'CLIENT_MARQUEE':
      return <ClientMarqueeForm {...props} />
    case 'METRICS_BAND':
      return <MetricsBandForm {...props} />
    case 'SERVICES_OVERVIEW':
      return <ServicesOverviewForm {...props} />
    case 'WORK_INDEX':
      return <WorkIndexForm {...props} />
    case 'PROCESS_STEPS':
      return <ProcessStepsForm {...props} />
    case 'PROCESS_DETAIL':
      return <ProcessDetailForm {...props} />
    case 'STATEMENT':
      return <StatementForm {...props} />
    case 'TESTIMONIALS':
      return <TestimonialsForm {...props} />
    case 'FINAL_CTA':
      return <FinalCtaForm {...props} />
    case 'VALUES':
      return <ValuesForm {...props} />
    case 'PARTNER_BADGES':
      return <PartnerBadgesForm {...props} />
    case 'SERVICES_LIST':
      return <ServicesListForm {...props} />
    case 'SERVICES_CLOSING':
      return <ServicesClosingForm {...props} />
    case 'CASE_STUDY_LIST':
      return <CaseStudyListForm />
    case 'CONTACT_INTRO':
      return <ContactIntroForm {...props} />
    case 'BOOK_DETAILS':
      return <BookDetailsForm {...props} />

    // --------------------------------------------------------------- Utility
    case 'HERO':
      return <HeroForm {...props} />
    case 'LOGO_STRIP':
      return <LogoStripForm {...props} />
    case 'PROOF_METRICS':
      return <ProofMetricsForm {...props} />
    case 'NARRATIVE':
      return <NarrativeForm {...props} />
    case 'SERVICE_DETAIL':
    case 'PARTNERSHIP':
      return <OutcomesForm {...props} />
    case 'FAQ':
      return <FaqForm {...props} />
    case 'CTA':
      return <CtaForm {...props} />
    case 'RICH_TEXT':
      return <RichTextForm {...props} />
    case 'CASE_STUDY_FEATURE':
      return (
        <ReferenceForm
          {...props}
          field="caseStudyId"
          label="Case study"
          hint="Paste the case study id. A picker arrives with the case study screens."
        />
      )
    case 'TESTIMONIAL_FEATURE':
      return (
        <ReferenceForm
          {...props}
          field="testimonialId"
          label="Testimonial"
          hint="Paste the testimonial id. A picker arrives with the library screens."
        />
      )
    case 'CASE_STUDY_GRID':
    case 'TESTIMONIAL_GRID':
    case 'EMAIL_GALLERY':
      return (
        <div className="flex flex-col gap-4">
          <EyebrowField data={props.data} onChange={props.onChange} />
          <TextField
            label="Heading"
            maxLength={160}
            value={str(props.data['heading'])}
            onChange={(value) =>
              props.onChange({ ...props.data, heading: value || undefined })
            }
          />
          <p className="text-xs text-ink-500">
            Leave the selection empty to show everything published, in its configured
            order.
          </p>
        </div>
      )
    default:
      return (
        <p className="text-sm text-ink-500">This section has no editable fields.</p>
      )
  }
}
