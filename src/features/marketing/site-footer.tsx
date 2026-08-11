import { cacheLife } from 'next/cache'
import Link from 'next/link'
import { site, nav } from '@/lib/site-data'
import { Logo } from '@/components/site/logo'

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

export async function SiteFooter() {
  const year = await getCopyrightYear()
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto w-full max-w-[76rem] px-6 py-16 md:px-8 md:py-20">
        <div className="flex flex-col gap-12 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm">
            <Logo />
            <p className="mt-5 text-pretty text-sm leading-relaxed text-muted-foreground">
              A specialist Email &amp; SMS marketing agency for direct-to-consumer ecommerce
              brands. We turn the customers you already have into recurring revenue.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-10 sm:grid-cols-3">
            <div>
              <h3 className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                Company
              </h3>
              <ul className="mt-4 space-y-3 text-sm">
                {nav.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="text-foreground/80 transition-colors hover:text-brand"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                Connect
              </h3>
              <ul className="mt-4 space-y-3 text-sm">
                <li>
                  <a
                    href={`mailto:${site.email}`}
                    className="text-foreground/80 transition-colors hover:text-brand"
                  >
                    Email
                  </a>
                </li>
                <li>
                  <a
                    href={site.linkedin}
                    target="_blank"
                    rel="noreferrer"
                    className="text-foreground/80 transition-colors hover:text-brand"
                  >
                    LinkedIn
                  </a>
                </li>
                <li>
                  <Link
                    href="/contact"
                    className="text-foreground/80 transition-colors hover:text-brand"
                  >
                    Book a call
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                Legal
              </h3>
              <ul className="mt-4 space-y-3 text-sm">
                <li>
                  <Link
                    href="/privacy"
                    className="text-foreground/80 transition-colors hover:text-brand"
                  >
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link
                    href="/terms"
                    className="text-foreground/80 transition-colors hover:text-brand"
                  >
                    Terms
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-4 border-t border-border pt-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {site.name}. All rights reserved.
          </p>
          <p className="font-mono text-xs uppercase tracking-[0.16em]">
            Email &amp; SMS, done right.
          </p>
        </div>
      </div>
    </footer>
  )
}
