import { AdminPageHeader } from '@/features/admin/shell/admin-shell'
import { requireAdmin } from '@/server/auth/dal'

export default async function AdminDashboardPage() {
  const session = await requireAdmin()

  return (
    <>
      <AdminPageHeader
        title={`Welcome back, ${session.name.split(' ')[0]}`}
        description="Content, submissions and site settings."
      />
      <div className="rounded-lg border border-border bg-card p-6">
        <p className="text-sm text-ink-500">
          Dashboard cards arrive with the CMS in Phase 3.
        </p>
      </div>
    </>
  )
}
