import { describe, expect, it } from 'vitest'

import { PAGE_BLUEPRINTS } from './blueprints'
import { publishPageContentSchema, pageContentSchema } from './schemas/page'
import { SECTION_TYPES } from './sections/types'

/**
 * The blueprints are what the public site falls back to and what the seed
 * writes into the database, so a blueprint that does not satisfy the publish
 * schema is a page that cannot be republished from the admin — an editor makes
 * one change and the publish button starts refusing. Catching that here costs
 * nothing; catching it in the admin costs a support conversation.
 */
describe('page blueprints', () => {
  it('covers every designed marketing route', () => {
    expect(PAGE_BLUEPRINTS.map((blueprint) => blueprint.slug).sort()).toEqual([
      'about',
      'book',
      'case-studies',
      'contact',
      'home',
      'process',
      'services',
    ])
  })

  it.each(PAGE_BLUEPRINTS.map((blueprint) => [blueprint.slug, blueprint] as const))(
    '%s validates as a draft document',
    (_slug, blueprint) => {
      const result = pageContentSchema.safeParse(blueprint.content)
      expect(result.success, JSON.stringify(result.error?.issues)).toBe(true)
    },
  )

  it.each(PAGE_BLUEPRINTS.map((blueprint) => [blueprint.slug, blueprint] as const))(
    '%s is publishable as-is',
    (_slug, blueprint) => {
      const result = publishPageContentSchema.safeParse(blueprint.content)
      expect(result.success, JSON.stringify(result.error?.issues)).toBe(true)
    },
  )

  it('uses only registered section types', () => {
    const known = new Set<string>(SECTION_TYPES)

    for (const blueprint of PAGE_BLUEPRINTS) {
      for (const section of blueprint.content.sections) {
        expect(known.has(section.type), `${blueprint.slug}: ${section.type}`).toBe(true)
      }
    }
  })

  it('gives every section a unique id', () => {
    for (const blueprint of PAGE_BLUEPRINTS) {
      const ids = blueprint.content.sections.map((section) => section.id)
      expect(new Set(ids).size, `${blueprint.slug} has duplicate section ids`).toBe(
        ids.length,
      )
    }
  })

  /**
   * The four About-page statistics — $10M+ generated, 35% of revenue from
   * retention, 99% client retention, 100M+ messages delivered — came out of the
   * original v0 generation and were never sourced by Kova. They were removed
   * from the components; this stops them reappearing through the CMS defaults,
   * which is the one place they could plausibly come back.
   */
  it('carries no unsourced agency-wide statistics', () => {
    const about = PAGE_BLUEPRINTS.find((blueprint) => blueprint.slug === 'about')
    const home = PAGE_BLUEPRINTS.find((blueprint) => blueprint.slug === 'home')

    for (const blueprint of [about, home]) {
      expect(blueprint).toBeDefined()
      const serialised = JSON.stringify(blueprint?.content)

      expect(serialised).not.toContain('$10M')
      expect(serialised).not.toContain('100M+')
      expect(serialised).not.toContain('Client retention rate')
      expect(serialised).not.toContain('Messages delivered')

      // And no figures band at all: there is nothing verified to put in one.
      expect(
        blueprint?.content.sections.some((section) => section.type === 'METRICS_BAND'),
      ).toBe(false)
    }
  })
})
