import { notFound } from 'next/navigation'

import { CaseStudyEditor } from '@/features/admin/case-studies/case-study-editor'
import { AdminPageHeader } from '@/features/admin/shell/admin-shell'
import { getCaseStudyForEdit } from '@/server/content/case-study-queries'
import { getMediaByIdsForAdmin } from '@/server/media/queries'

export const metadata = { title: 'Edit case study' }

export default async function EditCaseStudyPage({
  params,
}: PageProps<'/admin/case-studies/[id]'>) {
  const { id } = await params
  const study = await getCaseStudyForEdit(id)

  if (!study) notFound()

  // One read for both images rather than one per field.
  const ids = [study.heroImageId, study.clientLogoId].filter(
    (value): value is string => Boolean(value),
  )
  const assets = await getMediaByIdsForAdmin(ids)
  const byId = new Map(assets.map((asset) => [asset.id, asset]))

  return (
    <>
      <AdminPageHeader
        title={study.clientName}
        description="Edit the story, then publish when it reads right."
      />
      <CaseStudyEditor
        study={study}
        media={{
          hero: study.heroImageId ? (byId.get(study.heroImageId) ?? null) : null,
          logo: study.clientLogoId ? (byId.get(study.clientLogoId) ?? null) : null,
        }}
      />
    </>
  )
}
