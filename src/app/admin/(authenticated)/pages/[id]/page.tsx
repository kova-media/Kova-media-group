import { notFound } from 'next/navigation'

import { PageSettingsForm } from '@/features/admin/pages/page-settings-form'
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

  // The document's images and the page's own share image, in one read.
  const ids = collectMediaIds(page.draft.content)
  if (page.seoImageId) ids.push(page.seoImageId)
  const media = await getMediaByIdsForAdmin(ids)

  return (
    <>
      <AdminPageHeader
        title={page.title}
        description={`/${page.slug}${page.hasUnpublishedChanges ? ' · unpublished changes' : ''}`}
      />
      <div className="flex flex-col gap-4">
        <PageSettingsForm
          page={page}
          seoImage={media.find((asset) => asset.id === page.seoImageId) ?? null}
        />
        <SectionEditor
          page={page}
          catalogue={[...sectionCatalogue]}
          initialMedia={media}
        />
      </div>
    </>
  )
}
