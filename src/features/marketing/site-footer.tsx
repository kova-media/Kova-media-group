import { cacheLife } from 'next/cache'
import Link from 'next/link'
import { LogoLink } from '@/components/site/logo'
import { getSiteChrome } from '@/server/content/site-chrome'

/**
 * The copyright year.
 *
 * Reading the clock directly in the footer would make it — and therefore every
 * page that renders it — impossible to prerender under `cacheComponents`,
 * which is the whole performance strategy. Cached for a day instead: the worst
 * case is a copyright notice a few hours late turning over on 1 January.
 */
async function getCopyrightYear(): Promise<number> {
  'use cache'
  cacheLife('days')

  return new Date().getFullYear()
}

/**
 * The footer.
 *
 * Every word and every link is Site settings content: the description, the
 * columns and their headings, the small print, the closing line. The layout,
 * the type scale and the breakpoints are not, and there is no control for them
 * anywhere in the admin.
 *
 * Columns are rendered from data, so a column can be renamed, reordered,
 * emptied or removed without touching this file — and a column with no links
 * simply does not appear rather than leaving a heading over blank space.
 */
export async function SiteFooter() {
  const [year, chrome] = await Promise.all([getCopyrightYear(), getSiteChrome()])
  const columns = chrome.footer.columns.filter(
    (column) => column.heading.trim() && column.links.length > 0,
  )

  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto w-full max-w-[76rem] px-6 py-16 md:px-8 md:py-20">
        <div className="flex flex-col gap-12 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm">
            <LogoLink asset={chrome.logo} />
            {chrome.footer.description.trim() && (
              <p className="mt-5 text-sm leading-relaxed text-pretty text-muted-foreground">
                {chrome.footer.description}
              </p>
            )}
          </div>

          {columns.length > 0 && (
            <div className="grid grid-cols-2 gap-10 sm:grid-cols-3">
              {columns.map((column) => (
                <div key={column.heading}>
                  <h3 className="text-xs font-medium tracking-[0.16em] text-muted-foreground uppercase">
                    {column.heading}
                  </h3>
                  <ul className="mt-4 space-y-3 text-sm">
                    {column.links
                      .filter((link) => link.label.trim() && link.href.trim())
                      .map((link) => (
                        <li key={`${column.heading}-${link.label}`}>
                          <FooterLink href={link.href}>{link.label}</FooterLink>
                        </li>
                      ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-14 flex flex-col gap-4 border-t border-border pt-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {chrome.siteName}.
            {chrome.footer.note.trim() ? ` ${chrome.footer.note}` : ''}
          </p>
          {chrome.footer.tagline.trim() && (
            <p className="font-mono text-xs tracking-[0.16em] uppercase">
              {chrome.footer.tagline}
            </p>
          )}
        </div>
      </div>
    </footer>
  )
}

/**
 * `next/link` prefetches, which is wrong for `mailto:` and `tel:` and throws
 * away the point of an external link. Internal paths get the router; everything
 * else gets a plain anchor.
 */
function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  const className = 'text-foreground/80 transition-colors hover:text-brand'

  if (href.startsWith('/')) {
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    )
  }

  const isExternal = href.startsWith('https://')

  return (
    <a
      href={href}
      className={className}
      {...(isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
    >
      {children}
    </a>
  )
}
