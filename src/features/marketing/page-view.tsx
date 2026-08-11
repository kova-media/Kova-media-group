import { SectionRenderer } from '@/features/sections/section-renderer'
import { resolveReferences } from '@/server/content/resolve-references'
import type { PublishedPage } from '@/server/content/types'

/**
 * The one rendering path.
 *
 * Preview and production both come through here with the same shape — the only
 * difference upstream is which column the content was read from. "The preview
 * looked different" is designed out rather than tested for (CMS.md §5).
 *
 * Renders no `<main>`: the marketing layout owns that landmark, and nesting a
 * second one is invalid and confuses screen-reader landmark navigation.
 */
export async function PageView({ page }: { page: PublishedPage }) {
  const refs = await resolveReferences(page.content)

  return <SectionRenderer content={page.content} refs={refs} />
}
