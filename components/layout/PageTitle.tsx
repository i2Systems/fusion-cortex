/**
 * Page Title Watermark Component
 * 
 * Subtle title watermark displayed at the top of each page.
 * Provides context without being prominent - like a watermark.
 * 
 * AI Note: This should be placed at the top of page content,
 * styled as a subtle grey watermark that doesn't interfere with content.
 */

'use client'

import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { usePathname, useRouter } from 'next/navigation'
import { useRole } from '@/lib/role'
import { useSite } from '@/lib/SiteContext'
import { useNotifications } from '@/lib/NotificationContext'
import { ChevronDown, Bell } from 'lucide-react'

const pageTitles: Record<string, { primary: string; secondary?: string }> = {
  '/dashboard': { primary: 'Fusion', secondary: 'i2 Cloud' },
  '/map': { primary: 'Fusion', secondary: 'i2 Cloud' },
  '/zones': { primary: 'Fusion', secondary: 'i2 Cloud' },
  '/bacnet': { primary: 'Fusion', secondary: 'i2 Cloud' },
  '/rules': { primary: 'Fusion', secondary: 'i2 Cloud' },
  '/lookup': { primary: 'Fusion', secondary: 'i2 Cloud' },
  '/faults': { primary: 'Fusion', secondary: 'i2 Cloud' },
  '/library': { primary: 'Fusion', secondary: 'i2 Cloud' },
}

export function PageTitle() {
  const pathname = usePathname()
  const router = useRouter()
  const { role } = useRole()
  const { sites, activeSite, setActiveSite } = useSite()
  const { unreadCount } = useNotifications()
  const title = pageTitles[pathname || '/dashboard'] || { primary: 'Fusion', secondary: 'i2 Cloud' }
  const [showSiteDropdown, setShowSiteDropdown] = useState(false)
  const [mounted, setMounted] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({})

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (showSiteDropdown && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setDropdownStyle({
        top: `${rect.bottom + 8}px`,
        right: `${window.innerWidth - rect.right}px`,
      })
    }
  }, [showSiteDropdown])

  return (
    <div className="relative z-0" style={{ background: 'transparent' }}>
      <div className="flex items-center justify-between px-8 pt-6 pb-2">
        {/* Left: Title */}
        <div className="flex items-center gap-2 pointer-events-none">
          <span className="text-base font-semibold text-[var(--color-text-muted)] opacity-60">
            {title.primary}
          </span>
          {title.secondary && (
            <>
              <span className="text-xs text-[var(--color-text-muted)] opacity-40">/</span>
              <span className="text-sm font-medium text-[var(--color-text-muted)] opacity-60">
                {title.secondary}
              </span>
            </>
          )}
          <span className="text-xs text-[var(--color-text-muted)] opacity-40">/</span>
          <span className="text-sm font-medium text-[var(--color-text-muted)] opacity-60">
            {role}
          </span>
        </div>

        {/* Right: Site Selector + Notifications */}
        <div className="flex items-center gap-3 pointer-events-auto">
          {/* Notifications icon */}
          <button
            onClick={() => router.push('/notifications')}
            className="relative p-2 rounded-lg hover:bg-[var(--color-surface-subtle)] transition-colors text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
            title="Notifications"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <>
                {/* Dot indicator */}
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[var(--color-primary)] animate-pulse" />
                {/* Counter badge */}
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[var(--color-primary)] text-[var(--color-text-on-primary)] text-xs flex items-center justify-center font-semibold shadow-[var(--shadow-glow-primary)]">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              </>
            )}
          </button>

          {/* Site Selector */}
          <div className="relative">
          <button 
            ref={buttonRef}
              onClick={() => setShowSiteDropdown(!showSiteDropdown)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-[var(--color-surface-subtle)] transition-colors border border-[var(--color-border-subtle)]"
          >
            <span className="text-sm font-medium text-[var(--color-text)] whitespace-nowrap max-w-[180px] truncate">
                {activeSite?.name || 'Select Site'}
            </span>
            <ChevronDown size={14} className="text-[var(--color-text-muted)] flex-shrink-0" />
          </button>
          
          {/* Dropdown Menu - Portal to body to escape all stacking contexts */}
          {showSiteDropdown && mounted && createPortal(
            <>
              <div 
                className="fixed inset-0 z-[9998]" 
                onClick={() => setShowSiteDropdown(false)}
              />
              <div 
                className="fixed w-64 bg-[var(--color-surface)] backdrop-blur-xl rounded-lg border border-[var(--color-border-subtle)] shadow-[var(--shadow-strong)] overflow-hidden z-[9999]"
                style={dropdownStyle}
              >
                {sites.map((site) => (
                  <button
                    key={site.id}
                    onClick={() => {
                      setActiveSite(site.id)
                      setShowSiteDropdown(false)
                    }}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                      activeSite?.id === site.id
                        ? 'bg-[var(--color-primary-soft)] text-[var(--color-primary)]'
                        : 'text-[var(--color-text)] hover:bg-[var(--color-surface-subtle)]'
                    }`}
                  >
                    {site.name}
                  </button>
                ))}
              </div>
            </>,
            document.body
          )}
          </div>
        </div>
      </div>
    </div>
  )
}

