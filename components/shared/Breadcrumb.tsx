/**
 * Breadcrumb Component
 *
 * Renders a navigation breadcrumb trail. Use for:
 * - Focused modals: Site → Device | Zone | Fault (subtle variant)
 * - Page-level: Dashboard → Lookup → Device (default variant)
 *
 * The "subtle" variant is for modal headers: smaller, muted, non-interactive.
 */

'use client'

import { ChevronRight } from 'lucide-react'

export interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
  /** 'subtle' = smaller, muted, for modal headers; 'default' = normal for pages */
  variant?: 'default' | 'subtle'
  /** Optional separator. Default: ChevronRight for default, / for subtle */
  separator?: 'chevron' | 'slash'
  className?: string
}

export function Breadcrumb({
  items,
  variant = 'default',
  separator,
  className = '',
}: BreadcrumbProps) {
  if (!items?.length) return null

  const sep = separator ?? (variant === 'subtle' ? 'slash' : 'chevron')
  const isSubtle = variant === 'subtle'

  return (
    <nav
      aria-label="Breadcrumb"
      className={`
        flex items-center gap-1 flex-wrap
        ${isSubtle ? 'text-[10px] sm:text-[11px] md:text-xs' : 'text-sm'}
        ${isSubtle ? 'text-[var(--color-text-muted)] opacity-75' : 'text-[var(--color-text-muted)]'}
        ${className}
      `}
    >
      {items.map((item, i) => (
        <span key={i} className="contents">
          {i > 0 && (
            <span
              className="flex-shrink-0 mx-0.5 select-none"
              aria-hidden
            >
              {sep === 'chevron' ? (
                <ChevronRight size={isSubtle ? 10 : 12} className="text-[var(--color-text-soft)] opacity-60" />
              ) : (
                <span className="opacity-50">/</span>
              )}
            </span>
          )}
          {item.href ? (
            <a
              href={item.href}
              className="truncate max-w-[8rem] sm:max-w-[10rem] hover:text-[var(--color-primary)] hover:underline"
            >
              {item.label}
            </a>
          ) : (
            <span className="truncate max-w-[8rem] sm:max-w-[10rem]">
              {item.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  )
}
