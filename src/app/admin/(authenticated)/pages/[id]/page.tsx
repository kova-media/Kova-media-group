import { notFound } from 'next/navigation'

import { SectionEditor } from '@/features/admin/pages/section-editor/section-editor'
import { AdminPageHeader } from '@/features/admin/shell/admin-shell'
import { getPageForEdit } from '@/server/content/admin-queries'
import { sectionCatalogue } from '@/server/content/sections/registry'
import { getMediaByIdsForAdmin } from '@/server/media/queries'

/** Media ids referenced anywhere in the document, so the editor can render
 *  thumbnails without a round trip per field. */
function collectMediaIds(content: { sections: { data: unknown }[] }): string[] {
  const ids = new Set<string>()

  const walk = (value: unknown) => {
    if (!value || typeof value !== 'object') return
    if (Array.isArray(value)) {
      value.forEach(walk)
      return
    }
    for (const [key, nested] of Object.entries(value)) {
      if (key === 'mediaId' && typeof nested === 'string' && nested) ids.add(nested)
      else walk(nested)
    }
  }

  content.sections.forEach((section) => walk(section.data))
  return [...ids]
}

export async function generateMetadata({ params }: PageProps<'/admin/pages/[id]'>) {
  const { id } = await params
  const page = await getPageForEdit(id)
  return { title: page ? page.title : 'Page' }
}

export default async function EditPage({ params }: PageProps<'/admin/pages/[id]'>) {
  const { id } = await params
  const page = await getPageForEdit(id)

  if (!page) notFound()

  const media = await getMediaByIdsForAdmin(collectMediaIds(page.draft.content))

  return (
    <>
      <AdminPageHeader
        title={page.title}
        description={`/${page.slug}${page.hasUnpublishedChanges ? ' · unpublished changes' : ''}`}
      />
      <SectionEditor
        page={page}
        catalogue={[...sectionCatalogue]}
        initialMedia={media}
      />
    </>
  )
}
