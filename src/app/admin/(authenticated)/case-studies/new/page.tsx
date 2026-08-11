import { NewCaseStudyForm } from '@/features/admin/case-studies/new-case-study-form'
import { AdminPageHeader } from '@/features/admin/shell/admin-shell'

export const metadata = { title: 'New case study' }

export default function NewCaseStudyPage() {
  return (
    <>
      <AdminPageHeader
        title="New case study"
        description="The rest of the content is added in the editor. Nothing goes live until you publish."
      />
      <NewCaseStudyForm />
    </>
  )
}
