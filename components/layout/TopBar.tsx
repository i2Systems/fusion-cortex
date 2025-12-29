/**
 * Top App Bar Component
 * 
 * Contains:
 * - Current site/store selector
 * - Environment/tenant switcher (if needed)
 * - Global search (device/serial lookup)
 * - User menu (profile, logout)
 * 
 * AI Note: This is a fixed top bar. Search functionality should
 * integrate with Device Lookup section.
 */

'use client'

import { Search, ChevronDown, User } from 'lucide-react'
import { useState } from 'react'

export function TopBar() {
  const [searchQuery, setSearchQuery] = useState('')
  const [currentSite, setCurrentSite] = useState('Site #1234 - Main St')

  return (
    <header 
      className="h-20 bg-[var(--color-surface)] backdrop-blur-xl border-b border-[var(--color-border-subtle)] flex items-center px-6 gap-6"
      style={{ zIndex: 'var(--z-nav)' }}
    >
      {/* Site Selector */}
      <div className="flex items-center gap-2">
        <button className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-[var(--color-surface-subtle)] transition-colors">
          <span className="text-sm font-medium text-[var(--color-text)]">
            {currentSite}
          </span>
          <ChevronDown size={16} className="text-[var(--color-text-muted)]" />
        </button>
      </div>

      {/* Global Search */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search 
            size={24} 
            className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" 
          />
          <input
            type="text"
            placeholder="Search device ID or serial..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-14 pr-5 py-4 h-[52px] bg-[var(--color-bg-elevated)] border-2 border-[var(--color-border-subtle)] rounded-xl text-lg font-medium text-[var(--color-text)] placeholder:text-[var(--color-text-soft)] placeholder:font-normal focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)] focus:shadow-[var(--shadow-glow-primary)] transition-all"
          />
        </div>
      </div>

      {/* Right side - User menu, etc. */}
      <div className="flex items-center gap-3">
        {/* User Menu - Shows user name if logged in */}
        <div className="flex items-center gap-2">
          {/* User info will be shown in nav, this is just a placeholder */}
        </div>
      </div>
    </header>
  )
}

