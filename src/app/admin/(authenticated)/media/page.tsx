import { AdminPageHeader } from '@/features/admin/shell/admin-shell'
import { MediaLibrary } from '@/features/admin/media/media-library'
import { listMedia } from '@/server/media/queries'

export const metadata = { title: 'Media' }

export default async function MediaPage() {
  const initial = await listMedia({ take: 60 })

  return (
    <>
      <AdminPageHeader
        title="Media"
        description="Images, logos and email designs used across the site."
      />
      <MediaLibrary initial={initial} />
    </>
  )
}
