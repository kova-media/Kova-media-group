import { NewResourceForm } from '@/features/admin/resources/new-resource-form'
import { AdminPageHeader } from '@/features/admin/shell/admin-shell'

export const metadata = { title: 'New article' }

export default function NewResourcePage() {
  return (
    <>
      <AdminPageHeader
        title="New article"
        description="The body is written in the editor. Nothing goes live until you publish."
      />
      <NewResourceForm />
    </>
  )
}
