import { describe, expect, it } from 'vitest'
import { prisma } from '@/db/prisma'
import { richTextSchema } from '@/server/content/schemas/rich-text'
import { fromMarkup, toMarkup } from './rich-text-markup'

const enabled = Boolean(process.env.INTEGRATION_DB && process.env.DATABASE_URL)

describe.skipIf(!enabled)('round trip over the real published content', () => {
  it('preserves every rich-text node on every page', async () => {
    const pages = await prisma.page.findMany()
    const report: string[] = []

    for (const page of pages) {
      const doc = page.publishedContent as {
        sections?: { type: string; data: Record<string, unknown> }[]
      } | null
      for (const section of doc?.sections ?? []) {
        const bodies: unknown[] = []
        if (section.type === 'RICH_TEXT') bodies.push(section.data['body'])
        if (section.type === 'FAQ') {
          for (const item of (section.data['items'] as { answer: unknown }[]) ?? [])
            bodies.push(item.answer)
        }
        for (const body of bodies) {
          const parsed = richTextSchema.safeParse(body)
          if (!parsed.success) continue
          const after = fromMarkup(toMarkup(parsed.data))
          const links = JSON.stringify(parsed.data).split('"type":"link"').length - 1
          report.push(
            `${page.slug}/${section.type}: ${parsed.data.length} blocks, ${links} links`,
          )
          expect(after, `${page.slug} / ${section.type}`).toEqual(parsed.data)
        }
      }
    }

    console.log('\n' + report.join('\n'))
    expect(report.length).toBeGreaterThan(0)
    await prisma.$disconnect()
  })
})
