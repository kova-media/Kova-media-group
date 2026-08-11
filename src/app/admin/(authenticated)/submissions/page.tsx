import { AdminPageHeader } from '@/features/admin/shell/admin-shell'
import { SubmissionList } from '@/features/admin/submissions/submission-list'
import { getSubmission, listSubmissions } from '@/server/submissions/queries'

export const metadata = { title: 'Enquiries' }

export default async function SubmissionsPage() {
  const { items, counts } = await listSubmissions()

  // The list rows carry an excerpt only; the expanded view needs the full
  // message and notes. Fetched together here rather than per-expand, because
  // the realistic volume is tens of rows and a round trip per click would make
  // triage feel slow.
  const details = await Promise.all(items.map((item) => getSubmission(item.id)))

  const detail = Object.fromEntries(
    details
      .filter((row) => row !== null)
      .map((row) => [
        row.id,
        {
          message: row.message,
          websiteUrl: row.websiteUrl,
          adminNotes: row.adminNotes,
          source: row.source,
        },
      ]),
  )

  return (
    <>
      <AdminPageHeader
        title="Enquiries"
        description={`${counts.NEW} new · ${items.length} shown`}
      />
      <SubmissionList rows={items} detail={detail} />
    </>
  )
}
