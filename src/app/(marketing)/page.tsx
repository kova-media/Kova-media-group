import { draftMode } from 'next/headers'

import { PageView } from '@/features/marketing/page-view'
import { getDraftPage } from '@/server/content/admin-queries'
import { getPublishedPage } from '@/server/content/queries'

/**
 * The homepage is the product, so it gets its own route rather than falling
 * through the catch-all (ARCHITECTURE.md §4.1.2). Its content still comes from
 * the CMS under the reserved "home" slug.
 */
async function loadHome() {
  const { isEnabled } = await draftMode()
  return isEnabled ? getDraftPage('home') : getPublishedPage('home')
}

export default async function HomePage() {
  const page = await loadHome()

  if (!page || page.content.sections.length === 0) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center px-gutter">
        <div className="w-full max-w-content">
          <p className="text-2xs font-medium tracking-wide text-ink-500 uppercase">
            Kova Media Group
          </p>
          <h1 className="mt-4 text-4xl font-medium text-ink-950 sm:text-5xl">
            Email &amp; SMS marketing that behaves like part of your team.
          </h1>
          <p className="mt-6 text-lg text-ink-600">
            The homepage has not been published yet. Add sections in the admin and
            publish.
          </p>
        </div>
      </main>
    )
  }

  return <PageView page={page} />
}
