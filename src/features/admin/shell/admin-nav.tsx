'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { cn } from '@/lib/utils'

/**
 * Client component only because it needs the current pathname to mark the
 * active item. Kept as a leaf so the rest of the shell stays server-rendered.
 */
type NavItem = { href: string; label: string; exact?: boolean }

const NAV_ITEMS: readonly NavItem[] = [
  { href: '/admin', label: 'Dashboard', exact: true },
  { href: '/admin/pages', label: 'Pages' },
  { href: '/admin/case-studies', label: 'Case studies' },
  { href: '/admin/library', label: 'Library' },
  { href: '/admin/media', label: 'Media' },
  { href: '/admin/submissions', label: 'Submissions' },
  { href: '/admin/settings', label: 'Settings' },
]

export function AdminNav() {
  const pathname = usePathname()

  return (
    <nav aria-label="Admin" className="flex flex-col gap-0.5 p-3">
      {NAV_ITEMS.map((item) => {
        const isActive = item.exact
          ? pathname === item.href
          : pathname.startsWith(item.href)

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? 'page' : undefined}
            className={cn(
              'duration-fast rounded-md px-3 py-2 text-sm transition-colors',
              isActive
                ? 'bg-ink-100 font-medium text-ink-950'
                : 'text-ink-600 hover:bg-ink-50 hover:text-ink-900',
            )}
          >
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
