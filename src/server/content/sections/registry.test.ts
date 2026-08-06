import { describe, expect, it } from 'vitest'

import { publishSectionSchema, sectionRegistry, sectionSchema } from './registry'
import { SECTION_TYPES } from './types'

describe('section registry', () => {
  it('has a definition for every declared section type', () => {
    for (const type of SECTION_TYPES) {
      expect(sectionRegistry[type], `missing definition for ${type}`).toBeDefined()
      expect(sectionRegistry[type].type).toBe(type)
    }
  })

  it('registers no definition for an undeclared type', () => {
    const declared = new Set<string>(SECTION_TYPES)
    for (const key of Object.keys(sectionRegistry)) {
      expect(declared.has(key), `${key} is registered but not declared`).toBe(true)
    }
  })

  // Defaults are applied when an editor adds a section. If they do not satisfy
  // the schema, the very first save of a new section fails.
  it('has defaults that satisfy their own schema', () => {
    for (const type of SECTION_TYPES) {
      const definition = sectionRegistry[type]
      const result = definition.schema.safeParse(definition.defaults)
      expect(
        result.success,
        `${type} defaults are invalid: ${JSON.stringify(result.error?.issues)}`,
      ).toBe(true)
    }
  })

  it('gives every definition a label and description for the admin', () => {
    for (const type of SECTION_TYPES) {
      expect(sectionRegistry[type].label.length).toBeGreaterThan(0)
      expect(sectionRegistry[type].description.length).toBeGreaterThan(0)
    }
  })
})

describe('sectionSchema', () => {
  it('validates data against the schema for the section type', () => {
    const result = sectionSchema.safeParse({
      id: 'a',
      type: 'HERO',
      isEnabled: true,
      data: { headline: 'Hello' },
    })

    expect(result.success).toBe(true)
  })

  it('rejects data that does not match its type schema', () => {
    const result = sectionSchema.safeParse({
      id: 'a',
      type: 'HERO',
      isEnabled: true,
      // Exceeds the 160-character bound, which applies even while drafting.
      data: { headline: 'x'.repeat(200) },
    })

    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.path).toEqual(['data', 'headline'])
  })

  it('reports the offending field path under data', () => {
    const result = sectionSchema.safeParse({
      id: 'a',
      type: 'HERO',
      isEnabled: true,
      data: { headline: 'ok', media: { altOverride: 'no mediaId' } },
    })

    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.path).toEqual(['data', 'media', 'mediaId'])
  })

  it('rejects an unknown section type without throwing', () => {
    const result = sectionSchema.safeParse({
      id: 'a',
      type: 'NOT_A_REAL_SECTION',
      isEnabled: true,
      data: {},
    })

    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.message).toContain('Unknown section type')
  })
})

describe('draft vs publish validation', () => {
  const halfFinishedHero = {
    id: 'a',
    type: 'HERO',
    isEnabled: true,
    data: { headline: '' },
  }

  // The editor must be able to save a section the moment they add it.
  it('accepts an unfinished section while drafting', () => {
    expect(sectionSchema.safeParse(halfFinishedHero).success).toBe(true)
  })

  it('refuses to publish an unfinished enabled section', () => {
    const result = publishSectionSchema.safeParse(halfFinishedHero)
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.path).toEqual(['data', 'headline'])
  })

  // Otherwise an editor could never park a half-built section and ship the rest.
  it('allows publishing when the unfinished section is disabled', () => {
    const result = publishSectionSchema.safeParse({
      ...halfFinishedHero,
      isEnabled: false,
    })
    expect(result.success).toBe(true)
  })

  it('treats whitespace as empty for required fields', () => {
    const result = publishSectionSchema.safeParse({
      ...halfFinishedHero,
      data: { headline: '   ' },
    })
    expect(result.success).toBe(false)
  })

  it('requires a referenced entity before a feature section can publish', () => {
    const section = {
      id: 'b',
      type: 'CASE_STUDY_FEATURE',
      isEnabled: true,
      data: { caseStudyId: '' },
    }

    expect(sectionSchema.safeParse(section).success).toBe(true)
    expect(publishSectionSchema.safeParse(section).success).toBe(false)
  })
})
