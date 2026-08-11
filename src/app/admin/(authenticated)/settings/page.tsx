import { SettingsForm } from '@/features/admin/settings/settings-form'
import { AdminPageHeader } from '@/features/admin/shell/admin-shell'
import { getSiteSettingsForEdit } from '@/server/content/settings-queries'
import { getMediaByIdsForAdmin } from '@/server/media/queries'

export const metadata = { title: 'Settings' }

export default async function SettingsPage() {
  const settings = await getSiteSettingsForEdit()

  const ids = [settings.logoId, settings.logoDarkId, settings.defaultSeoImageId].filter(
    (value): value is string => Boolean(value),
  )

  const assets = await getMediaByIdsForAdmin(ids)
  const byId = new Map(assets.map((asset) => [asset.id, asset]))
  const pick = (id: string | null) => (id ? (byId.get(id) ?? null) : null)

  return (
    <>
      <AdminPageHeader
        title="Settings"
        description="Brand, contact details, navigation, and SEO defaults."
      />
      <SettingsForm
        values={{
          siteName: settings.siteName,
          contactEmail: settings.contactEmail,
          bookingUrl: settings.bookingUrl,
          defaultSeoTitle: settings.defaultSeoTitle,
          defaultSeoDescription: settings.defaultSeoDescription,
          tagline: settings.tagline,
          navigation: settings.navigation,
        }}
        media={{
          logo: pick(settings.logoId),
          logoDark: pick(settings.logoDarkId),
          seoImage: pick(settings.defaultSeoImageId),
        }}
      />
    </>
  )
}
