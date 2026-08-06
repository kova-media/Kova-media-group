import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Conditional class names with Tailwind conflict resolution.
 * Always use this rather than string concatenation, so that a later utility
 * reliably overrides an earlier one.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
