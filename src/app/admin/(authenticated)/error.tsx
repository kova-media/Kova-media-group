'use client'

import { Button } from '@/components/ui/button'

/**
 * Admin route error boundary. Shows a designed failure rather than the default,
 * and never surfaces the underlying message — that goes to the server logs.
 */
export default function AdminError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <h1 className="text-xl font-medium text-ink-950">Something went wrong</h1>
      <p className="mt-2 max-w-sm text-sm text-ink-500">
        The page could not be loaded. If this keeps happening, check the server logs.
      </p>
      <Button onClick={reset} className="mt-6">
        Try again
      </Button>
    </div>
  )
}
