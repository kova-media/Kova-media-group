import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'

import { LoginForm } from '@/features/admin/auth/login-form'

export const metadata: Metadata = {
  title: 'Sign in',
  robots: { index: false, follow: false },
}

async function Form({ searchParams }: Pick<PageProps<'/admin/login'>, 'searchParams'>) {
  const { next } = await searchParams
  return <LoginForm next={typeof next === 'string' ? next : undefined} />
}

export default function LoginPage(props: PageProps<'/admin/login'>) {
  return (
    <main className="flex flex-1 items-center justify-center px-gutter py-16">
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <p className="text-2xs font-medium tracking-wide text-ink-500 uppercase">
            Kova Media Group
          </p>
          <h1 className="mt-2 text-2xl font-medium text-ink-950">Sign in</h1>
        </div>

        <div className="rounded-lg border border-border bg-card p-6 shadow-subtle">
          {/* searchParams is request data; awaiting it here keeps the rest of
              the page in the static shell. */}
          <Suspense fallback={<div className="h-64" aria-hidden />}>
            <Form searchParams={props.searchParams} />
          </Suspense>
        </div>

        <p className="mt-6 text-center text-xs text-ink-500">
          <Link href="/admin/forgot-password" className="underline hover:text-ink-800">
            Forgot your password?
          </Link>
        </p>
      </div>
    </main>
  )
}
