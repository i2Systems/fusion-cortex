/**
 * Main Navigation Component
 * 
 * Left-side persistent navigation with minimal icons.
 * Clean, modern, lots of space for main content.
 * 
 * AI Note: Navigation items are defined here. To add new sections,
 * update the navItems array and ensure corresponding routes exist.
 */

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import {
  Home,
  Map,
  Layers,
  Network,
  Settings,
  Search,
  AlertTriangle,
  User,
  Workflow,
  HelpCircle,
  Menu,
  X,
  Download,
  Users,
  Boxes
} from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { useRole } from '@/lib/auth'
import { LoginModal } from '@/components/auth/LoginModal'
import { SettingsModal } from '@/components/settings/SettingsModal'

// Navigation groups with subtle gestalt grouping
const navGroups = [
  // Group 1: Overview
  [
    { href: '/dashboard', label: 'Dashboard', icon: Home },
  ],
  // Group 2: Mapping & Organization
  [
    { href: '/lookup', label: 'Device Lookup', icon: Search },
    { href: '/map', label: 'Locations & Devices', icon: Map },
    { href: '/zones', label: 'Zones', icon: Layers },
    { href: '/groups', label: 'Groups', icon: Boxes },
  ],
  // Group 3: Configuration & Management
  [
    { href: '/people', label: 'People', icon: Users },
    { href: '/bacnet', label: 'BACnet Mapping', icon: Network },
    { href: '/rules', label: 'Rules & Overrides', icon: Workflow },
    { href: '/firmware', label: 'Firmware Updates', icon: Download },
    { href: '/faults', label: 'Faults / Health', icon: AlertTriangle },
  ],
]

export function MainNav() {
  const pathname = usePathname()
  const { user, isAuthenticated } = useAuth()
  const { role } = useRole()
  const [showLogin, setShowLogin] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Filter nav items based on role
  const filterNavItems = (items: typeof navGroups[0]) => {
    return items.filter(item => {
      // Technician cannot see BACnet Mapping, Rules & Overrides, and Firmware Updates
      if (role === 'Technician') {
        return item.href !== '/bacnet' && item.href !== '/rules' && item.href !== '/firmware'
      }
      return true
    })
  }

  const visibleNavGroups = navGroups.map(group => filterNavItems(group)).filter(group => group.length > 0)

  const NavContent = () => (
    <>
      {/* Navigation Items with Gestalt Grouping */}
      <div className="flex-1 flex flex-col items-center py-4">
        {visibleNavGroups.map((group, groupIndex) => (
          <div key={groupIndex} className="flex flex-col items-center gap-2">
            {group.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`
                    w-14 h-14 flex items-center justify-center rounded-lg
                    transition-all duration-200
                    ${isActive
                      ? 'bg-[var(--color-primary-soft)] text-[var(--color-primary)] shadow-[var(--shadow-glow-primary)]'
                      : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface-subtle)] hover:text-[var(--color-primary)] hover:shadow-[var(--shadow-glow-primary)]'
                    }
                  `}
                  title={item.label}
                >
                  <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                </Link>
              )
            })}
            {/* Subtle separator between groups (except last) */}
            {groupIndex < visibleNavGroups.length - 1 && (
              <div className="w-8 h-px bg-[var(--color-border-subtle)] my-1 opacity-30" />
            )}
          </div>
        ))}
      </div>

      {/* Bottom: Library, Profile & Settings */}
      <div className="p-4 flex flex-col items-center gap-2 border-t border-[var(--color-border-subtle)]">
        {/* Library Icon */}
        <Link
          href="/library"
          onClick={() => setMobileMenuOpen(false)}
          className={`
            w-14 h-14 flex items-center justify-center rounded-lg
            transition-all duration-200
            ${pathname === '/library' || pathname?.startsWith('/library')
              ? 'bg-[var(--color-primary-soft)] text-[var(--color-primary)] shadow-[var(--shadow-glow-primary)]'
              : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface-subtle)] hover:text-[var(--color-primary)] hover:shadow-[var(--shadow-glow-primary)]'
            }
          `}
          title="Library"
        >
          <HelpCircle size={22} strokeWidth={pathname === '/library' || pathname?.startsWith('/library') ? 2.5 : 2} />
        </Link>

        {/* Subtle separator */}
        <div className="w-8 h-px bg-[var(--color-border-subtle)] my-1 opacity-30" />

        {/* Profile Icon */}
        <button
          onClick={() => {
            setMobileMenuOpen(false)
            isAuthenticated ? setShowSettings(true) : setShowLogin(true)
          }}
          className="w-14 h-14 flex items-center justify-center rounded-lg text-[var(--color-text-muted)] hover:bg-[var(--color-surface-subtle)] hover:text-[var(--color-text)] transition-all duration-200"
          title={isAuthenticated ? user?.name || 'Profile' : 'Sign In'}
        >
          {isAuthenticated && user ? (
            <div className="w-10 h-10 rounded-full bg-[var(--color-primary)] flex items-center justify-center">
              <span className="text-[var(--color-text-on-primary)] text-sm font-medium">
                {user.name.charAt(0).toUpperCase()}
              </span>
            </div>
          ) : (
            <User size={22} />
          )}
        </button>

        {/* Settings Icon - Always visible */}
        <button
          onClick={() => {
            setMobileMenuOpen(false)
            setShowSettings(true)
          }}
          className="w-14 h-14 flex items-center justify-center rounded-lg text-[var(--color-text-muted)] hover:bg-[var(--color-surface-subtle)] hover:text-[var(--color-text)] transition-all duration-200"
          title="Settings"
        >
          <Settings size={22} />
        </button>
      </div>
    </>
  )

  return (
    <>
      {/* Desktop Navigation - Always visible on md+ */}
      <nav
        className="hidden md:flex flex-col w-20 bg-[var(--color-bg-elevated)] backdrop-blur-xl border-r border-[var(--color-border-subtle)]"
        style={{ zIndex: 'var(--z-nav)' }}
      >
        <NavContent />
      </nav>

      {/* Mobile Hamburger Button - Visible on mobile */}
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="md:hidden fixed top-4 left-4 z-[var(--z-nav)] w-12 h-12 flex items-center justify-center rounded-lg bg-[var(--color-surface)] backdrop-blur-xl border border-[var(--color-border-subtle)] text-[var(--color-text)] hover:bg-[var(--color-surface-subtle)] transition-all shadow-[var(--shadow-soft)]"
        aria-label="Toggle menu"
      >
        {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="md:hidden fixed inset-0 backdrop-blur-sm z-[calc(var(--z-nav)-1)]"
            style={{ backgroundColor: 'var(--color-backdrop)' }}
            onClick={() => setMobileMenuOpen(false)}
          />
          {/* Mobile Menu */}
          <nav
            className="md:hidden fixed top-0 left-0 h-full w-20 bg-[var(--color-bg-elevated)] backdrop-blur-xl border-r border-[var(--color-border-subtle)] z-[var(--z-nav)]"
          >
            <NavContent />
          </nav>
        </>
      )}

      {/* Modals */}
      <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} />
      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </>
  )
}

