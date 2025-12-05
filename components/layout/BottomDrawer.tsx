/**
 * Bottom Drawer Component
 * 
 * Slide-up drawer for:
 * - Discovery status (last run, issues)
 * - Fault summary
 * - Background tasks (exports, syncs)
 * 
 * AI Note: This should be collapsible and show summary info
 * when collapsed, full details when expanded.
 */

'use client'

import { ChevronUp, ChevronDown } from 'lucide-react'
import { useState } from 'react'

interface BottomDrawerProps {
  children?: React.ReactNode
}

export function BottomDrawer({ children }: BottomDrawerProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div
      className={`
        bg-[var(--color-surface)] backdrop-blur-xl border-t border-[var(--color-border-subtle)] 
        transition-all duration-300 ease-out
        ${isExpanded ? 'h-64' : 'h-12'}
      `}
      style={{ zIndex: 'var(--z-drawer)' }}
    >
      {/* Drawer Header - Always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full h-12 flex items-center justify-between px-6 hover:bg-[var(--color-surface-subtle)] transition-colors"
      >
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-[var(--color-text)]">
            Status
          </span>
          {/* Summary info could go here */}
          <span className="text-xs text-[var(--color-text-muted)]">
            Discovery: 1,998 devices found — 2 missing
          </span>
        </div>
        {isExpanded ? (
          <ChevronDown size={18} className="text-[var(--color-text-muted)]" />
        ) : (
          <ChevronUp size={18} className="text-[var(--color-text-muted)]" />
        )}
      </button>

      {/* Drawer Content - Visible when expanded */}
      {isExpanded && (
        <div className="h-[calc(16rem-3rem)] overflow-auto p-6">
          {children || (
            <div className="text-sm text-[var(--color-text-muted)]">
              No status information available
            </div>
          )}
        </div>
      )}
    </div>
  )
}

