'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { LogoLink, type LogoAsset } from '@/components/site/logo'
import { ButtonLink } from '@/components/site/ui'

/**
 * Navigation labels and the call to action come from Site settings; everything
 * else about this component — the scroll transition, the active-item spring,
 * the mobile sheet — does not, and is not exposed anywhere.
 */
export function SiteHeader({
  logo,
  siteName,
  navigation,
  ctaLabel,
  ctaHref,
}: {
  logo?: LogoAsset | null
  siteName: string
  navigation: { label: string; href: string }[]
  ctaLabel: string
  ctaHref: string
}) {
  const nav = navigation
  const hasCta = Boolean(ctaLabel.trim() && ctaHref.trim())
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div
        className={cn(
          'transition-all duration-500',
          scrolled
            ? 'border-b border-border bg-background/80 backdrop-blur-xl'
            : 'border-b border-transparent bg-transparent',
        )}
      >
        <div className="mx-auto flex h-16 w-full max-w-[76rem] items-center justify-between px-6 md:px-8">
          <LogoLink asset={logo} siteName={siteName} />

          <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
            {nav.map((item) => {
              const active =
                pathname === item.href || pathname.startsWith(item.href + '/')
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'relative rounded-full px-3.5 py-2 text-sm transition-colors duration-200',
                    active
                      ? 'text-foreground'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {item.label}
                  {active && (
                    <motion.span
                      layoutId="nav-active"
                      className="absolute inset-0 -z-10 rounded-full bg-foreground/[0.05]"
                      transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                    />
                  )}
                </Link>
              )
            })}
          </nav>

          {hasCta && (
            <div className="hidden md:block">
              <ButtonLink href={ctaHref} variant="primary" withArrow>
                {ctaLabel}
              </ButtonLink>
            </div>
          )}

          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-foreground md:hidden"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="border-b border-border bg-background md:hidden"
          >
            <nav
              className="mx-auto flex w-full max-w-[76rem] flex-col gap-1 px-6 py-4"
              aria-label="Mobile"
            >
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  // Closed here rather than in an effect on `pathname`: the
                  // click is the actual event, and reacting to the route
                  // change instead costs an extra render on every navigation.
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-3 text-base text-foreground hover:bg-muted"
                >
                  {item.label}
                </Link>
              ))}
              {hasCta && (
                <div className="pt-2" onClick={() => setOpen(false)}>
                  <ButtonLink
                    href={ctaHref}
                    variant="primary"
                    className="w-full"
                    withArrow
                  >
                    {ctaLabel}
                  </ButtonLink>
                </div>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
