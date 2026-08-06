import { AdminPageHeader } from '@/features/admin/shell/admin-shell'
import { NewPageForm } from '@/features/admin/pages/new-page-form'

export const metadata = { title: 'New page' }

export default function NewPage() {
  return (
    <>
      <AdminPageHeader
        title="New page"
        description="Create a page, then add sections."
      />
      <div className="max-w-lg rounded-lg border border-border bg-card p-6">
        <NewPageForm />
      </div>
    </>
  )
}
