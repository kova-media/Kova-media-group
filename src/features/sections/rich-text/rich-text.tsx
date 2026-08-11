import { Fragment } from 'react'

import { cn } from '@/lib/utils'
import type {
  BlockNode,
  InlineNode,
  RichText,
} from '@/server/content/schemas/rich-text'

/**
 * Renders the rich-text node tree as React elements.
 *
 * There is no `dangerouslySetInnerHTML` here and there never will be (ADR-016).
 * Mapping nodes to elements is what makes the public CSP's `'unsafe-inline'`
 * acceptable, and it keeps typography entirely under our control.
 */
function Inline({ nodes }: { nodes: InlineNode[] }) {
  return (
    <>
      {nodes.map((node, index) => {
        if (node.type === 'link') {
          const isExternal = /^https?:\/\//.test(node.href)

          return (
            <a
              key={index}
              href={node.href}
              className="underline decoration-border-strong underline-offset-4 transition-colors hover:decoration-foreground"
              {...(node.newTab || isExternal
                ? { target: '_blank', rel: 'noopener noreferrer' }
                : {})}
            >
              <Inline nodes={node.children} />
            </a>
          )
        }

        let content: React.ReactNode = node.text
        if (node.bold) content = <strong className="font-medium">{content}</strong>
        if (node.italic) content = <em>{content}</em>

        return <Fragment key={index}>{content}</Fragment>
      })}
    </>
  )
}

function Block({ node }: { node: BlockNode }) {
  switch (node.type) {
    case 'heading': {
      const Tag = `h${node.level}` as 'h2' | 'h3' | 'h4'
      const size = { 2: 'text-2xl', 3: 'text-xl', 4: 'text-lg' }[node.level]

      return (
        <Tag className={cn('mt-10 mb-3 font-medium text-foreground first:mt-0', size)}>
          <Inline nodes={node.children} />
        </Tag>
      )
    }

    case 'list': {
      const Tag = node.ordered ? 'ol' : 'ul'

      return (
        <Tag
          className={cn(
            'my-4 flex flex-col gap-2 pl-5 text-foreground/80',
            node.ordered ? 'list-decimal' : 'list-disc',
          )}
        >
          {node.items.map((item, index) => (
            <li key={index}>
              <Inline nodes={item} />
            </li>
          ))}
        </Tag>
      )
    }

    case 'blockquote':
      return (
        <blockquote className="my-6 border-l-2 border-brand pl-5 text-lg text-foreground/85">
          <Inline nodes={node.children} />
        </blockquote>
      )

    default:
      return (
        <p className="my-4 text-foreground/80 first:mt-0 last:mb-0">
          <Inline nodes={node.children} />
        </p>
      )
  }
}

export function RichTextRenderer({
  nodes,
  className,
}: {
  nodes: RichText
  className?: string
}) {
  if (nodes.length === 0) return null

  return (
    <div className={cn('text-base', className)}>
      {nodes.map((node, index) => (
        <Block key={index} node={node} />
      ))}
    </div>
  )
}
