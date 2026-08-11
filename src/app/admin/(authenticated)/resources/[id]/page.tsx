import { notFound } from 'next/navigation'

import { AdminPageHeader } from '@/features/admin/shell/admin-shell'
import { ResourceEditor } from '@/features/admin/resources/resource-editor'
import { getResourceForEdit } from '@/server/content/resource-queries'
import { getMediaByIdsForAdmin } from '@/server/media/queries'

export const metadata = { title: 'Edit article' }

export default async function EditResourcePage({
  params,
}: PageProps<'/admin/resources/[id]'>) {
  const { id } = await params
  const resource = await getResourceForEdit(id)

  if (!resource) notFound()

  const assets = resource.coverId ? await getMediaByIdsForAdmin([resource.coverId]) : []

  return (
    <>
      <AdminPageHeader
        title={resource.title}
        description="Write the article, then publish when it reads right."
      />
      <ResourceEditor resource={resource} cover={assets[0] ?? null} />
    </>
  )
}
