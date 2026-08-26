'use client'

import type { MediaAssetDto } from '@/server/content/types'
import type { SectionType } from '@/server/content/sections/types'

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
import { RepeaterField, TextField } from './section-fields'

/**
 * Per-section forms.
 *
 * Hand-written rather than generated from the Zod schema. A generated form
 * would produce a generic key/value editor; these are the screens the owner
 * uses every week, and field grouping, ordering and wording carry real weight.
 * The schema remains the source of truth for *validation* either way.
 *
 * The designed marketing bands live in `marketing-forms.tsx`. The two below are
 * the only ones left from the original generic catalogue, because they are the
 * only two the FAQ and legal pages use.
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

function FaqForm({ data, onChange }: FormProps) {
  type Item = { question: string; answer: unknown }

  return (
    <div className="flex flex-col gap-4">
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
        items={arr<Item>(data['items'])}
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

function RichTextForm({ data, onChange }: FormProps) {
  return (
    <div className="flex flex-col gap-4">
      <TextField
        label="Heading"
        hint="Optional. Sits above the text."
        maxLength={200}
        value={str(data['heading'])}
        onChange={(value) => onChange({ ...data, heading: value || undefined })}
      />
      <RichTextField
        label="Text"
        value={data['body']}
        onChange={(value) => onChange({ ...data, body: value })}
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
    case 'FAQ':
      return <FaqForm {...props} />
    case 'RICH_TEXT':
      return <RichTextForm {...props} />
  }
}
