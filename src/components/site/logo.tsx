import Link from 'next/link'
import { cn } from '@/lib/utils'

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label="Kova Media Group, home"
      className={cn('group inline-flex items-center gap-2.5', className)}
    >
      <span className="relative flex h-7 w-7 items-center justify-center rounded-md bg-foreground text-background">
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden>
          <path
            d="M7 4v16M7 12l8-8M7 12l8 8"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span className="text-[0.95rem] font-semibold tracking-tight text-foreground">
        Kova <span className="text-muted-foreground font-normal">Media Group</span>
      </span>
    </Link>
  )
}
