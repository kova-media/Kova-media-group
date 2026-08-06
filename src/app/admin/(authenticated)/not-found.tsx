import Link from 'next/link'

export default function AdminNotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <h1 className="text-xl font-medium text-ink-950">Not found</h1>
      <p className="mt-2 text-sm text-ink-500">That admin page does not exist.</p>
      <Link
        href="/admin"
        className="mt-6 text-sm text-ink-900 underline underline-offset-4"
      >
        Back to dashboard
      </Link>
    </div>
  )
}
