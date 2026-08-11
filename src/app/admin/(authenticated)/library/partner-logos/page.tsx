import { PartnerLogoManager } from '@/features/admin/library/partner-logo-manager'
import { AdminPageHeader } from '@/features/admin/shell/admin-shell'
import { listPartnerLogosForAdmin } from '@/server/content/library-queries'

export const metadata = { title: 'Client logos' }

export default async function PartnerLogosPage() {
  const rows = await listPartnerLogosForAdmin()

  return (
    <>
      <AdminPageHeader
        title="Client logos"
        description="Shown in the strip under the homepage hero."
      />
      <PartnerLogoManager rows={rows} />
    </>
  )
}
