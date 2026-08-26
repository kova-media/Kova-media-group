import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

/**
 * The database is the source of truth for published content.
 *
 * This is the guard for the one regression that would quietly undo the whole
 * system: a component or query gaining a "if the CMS is empty, show this
 * instead" branch. When that happens nothing breaks and no test fails — the
 * site simply keeps showing copy the owner deleted, and the admin looks broken
 * for reasons nobody can find.
 *
 * So the invariant is enforced at the only place it can be: the import graph.
 * Seed data lives under `prisma/`, and nothing under `src/` may import it.
 */
const read = (relative: string) =>
  readFileSync(fileURLToPath(new URL(relative, import.meta.url)), 'utf8')

describe('content source of truth', () => {
  it('keeps seed data out of the application source', () => {
    // `src/lib/site-data.ts` used to hold the case studies, the services, the
    // process steps and the FAQ, and several components read them directly.
    const siteData = read('../../lib/site-data.ts')

    expect(siteData).not.toMatch(/export const caseStudies/)
    expect(siteData).not.toMatch(/export const services/)
    expect(siteData).not.toMatch(/export const process/)
    expect(siteData).not.toMatch(/export const faqs/)
    expect(siteData).not.toMatch(/export const testimonials/)
  })

  it.each([
    ['site-content.ts', '../content/site-content.ts'],
    ['marketing-content.ts', '../content/marketing-content.ts'],
  ])('%s imports no seed data', (_name, path) => {
    const source = read(path)

    // `prisma/seed-case-studies.ts` and `blueprints.ts` are seed input. Reading
    // either one here would reintroduce the fallback this file exists to stop.
    expect(source).not.toMatch(/from '.*seed-case-studies'/)
    expect(source).not.toMatch(/from '.*blueprints'/)
  })

  it('renders marketing pages only from the CMS', () => {
    const source = read('../content/marketing-content.ts')

    // `exists: false` is the shape the routes turn into a 404. If this ever
    // becomes a bundled document again, the assertion below goes with it.
    expect(source).toContain('exists: false')
    expect(source).not.toMatch(/getBlueprint/)
  })
})
