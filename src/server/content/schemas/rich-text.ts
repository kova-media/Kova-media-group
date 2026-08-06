import { z } from 'zod'

/**
 * Rich text is a constrained node tree, never HTML (ADR-016).
 *
 * This is a security boundary, not a style preference: `dangerouslySetInnerHTML`
 * would be a stored-XSS vector, and it would invalidate the reasoning in ADR-013
 * that permits `'unsafe-inline'` in the public CSP. It also gives us full
 * typographic control over prose, which the design brief requires anyway.
 *
 * Not imported with `server-only`: the renderer in src/features runs on both
 * sides of the boundary and needs these types.
 */

/** Only these schemes may appear in a link. Notably absent: `javascript:`. */
const SAFE_LINK = /^(https?:\/\/|mailto:|tel:|\/(?!\/))/

export const linkHrefSchema = z
  .string()
  .min(1)
  .refine((value) => SAFE_LINK.test(value), {
    message: 'Links must be https, mailto, tel, or a site-relative path.',
  })

export const textNodeSchema = z.object({
  type: z.literal('text'),
  text: z.string(),
  bold: z.boolean().optional(),
  italic: z.boolean().optional(),
})

export const linkNodeSchema = z.object({
  type: z.literal('link'),
  href: linkHrefSchema,
  newTab: z.boolean().optional(),
  children: z.array(textNodeSchema),
})

export const inlineNodeSchema = z.union([textNodeSchema, linkNodeSchema])

export const paragraphNodeSchema = z.object({
  type: z.literal('paragraph'),
  children: z.array(inlineNodeSchema),
})

export const headingNodeSchema = z.object({
  type: z.literal('heading'),
  // h1 is owned by the page, never by body copy — heading levels must not skip.
  level: z.union([z.literal(2), z.literal(3), z.literal(4)]),
  children: z.array(inlineNodeSchema),
})

export const listNodeSchema = z.object({
  type: z.literal('list'),
  ordered: z.boolean(),
  items: z.array(z.array(inlineNodeSchema)),
})

export const blockquoteNodeSchema = z.object({
  type: z.literal('blockquote'),
  children: z.array(inlineNodeSchema),
})

export const blockNodeSchema = z.discriminatedUnion('type', [
  paragraphNodeSchema,
  headingNodeSchema,
  listNodeSchema,
  blockquoteNodeSchema,
])

export const richTextSchema = z.array(blockNodeSchema)

export type TextNode = z.infer<typeof textNodeSchema>
export type LinkNode = z.infer<typeof linkNodeSchema>
export type InlineNode = z.infer<typeof inlineNodeSchema>
export type BlockNode = z.infer<typeof blockNodeSchema>
export type RichText = z.infer<typeof richTextSchema>

export const emptyRichText: RichText = []

/** Plain-text projection, for meta descriptions and search previews. */
export function richTextToPlainText(nodes: RichText): string {
  const fromInline = (children: InlineNode[]): string =>
    children
      .map((child) => (child.type === 'text' ? child.text : fromInline(child.children)))
      .join('')

  return nodes
    .map((node) =>
      node.type === 'list'
        ? node.items.map(fromInline).join(' ')
        : fromInline(node.children),
    )
    .join('\n\n')
    .trim()
}
