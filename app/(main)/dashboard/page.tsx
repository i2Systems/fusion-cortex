/**
 * Dashboard / Home Page
 * 
 * Landing page with search island at the top.
 * Overview of system status, recent activity, etc.
 * 
 * AI Note: This is the main landing page. Search is in a floating
 * island at the top, similar to macOS Spotlight or modern dashboards.
 */

'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { SearchIsland } from '@/components/layout/SearchIsland'
import { useDevices } from '@/lib/DeviceContext'
import { useZones } from '@/lib/ZoneContext'
import { Droplets } from 'lucide-react'

export default function DashboardPage() {
  const router = useRouter()
  const { devices } = useDevices()
  const { zones } = useZones()
  
  const onlineDevices = devices.filter(d => d.status === 'online').length
  const offlineDevices = devices.filter(d => d.status === 'offline' || d.status === 'missing').length
  const healthPercentage = devices.length > 0 
    ? Math.round((onlineDevices / devices.length) * 100)
    : 100
  const activeZones = zones.length

  // Fault story description for FLX-3158
  const faultDescription = 'Water intrusion detected in fixture housing. Device FLX-3158 shows signs of moisture damage. This is a repeat failure pattern in this location.'

  // Navigation handlers
  const handleFaultClick = () => {
    router.push('/faults')
    // Store device ID in sessionStorage to highlight it on faults page
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('highlightDevice', 'FLX-3158')
    }
  }

  const handleDiscoveryClick = () => {
    router.push('/discovery')
  }

  const handleZoneClick = () => {
    router.push('/zones')
  }

  const handleBACnetClick = () => {
    router.push('/bacnet')
  }

  return (
    <div className="h-full flex flex-col min-h-0 overflow-hidden">
      {/* Top Search Island - In flow */}
      <div className="flex-shrink-0 px-8 pt-4 pb-3">
        <SearchIsland 
          position="top" 
          fullWidth={true}
          title="Dashboard"
          subtitle="Overview of your lighting system"
          placeholder="Search, input a task, or ask a question..."
        />
      </div>

      {/* Dashboard Content */}
      <div className="flex-1 min-h-0 max-w-7xl mx-auto w-full flex flex-col px-8 pb-6 overflow-auto">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 flex-shrink-0">
          <div className="fusion-card">
            <div className="text-sm text-[var(--color-text-muted)] mb-2">Total Devices</div>
            <div className="text-3xl font-bold text-[var(--color-text)]">{devices.length.toLocaleString()}</div>
            <div className="text-xs text-[var(--color-success)] mt-2">Discovered devices</div>
          </div>
          <div className="fusion-card">
            <div className="text-sm text-[var(--color-text-muted)] mb-2">Active Zones</div>
            <div className="text-3xl font-bold text-[var(--color-text)]">{activeZones}</div>
            <div className="text-xs text-[var(--color-text-muted)] mt-2">Configured zones</div>
          </div>
          <div className="fusion-card">
            <div className="text-sm text-[var(--color-text-muted)] mb-2">System Health</div>
            <div className="text-3xl font-bold text-[var(--color-success)]">{healthPercentage}%</div>
            <div className="text-xs text-[var(--color-text-muted)] mt-2">
              {offlineDevices} device{offlineDevices !== 1 ? 's' : ''} offline
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
          <div className="fusion-card">
            <h3 className="text-lg font-semibold text-[var(--color-text)] mb-4">Recent Activity</h3>
            <div className="space-y-3">
              {/* Always show the fault story device FLX-3158 */}
              <button
                onClick={handleFaultClick}
                className="w-full flex items-center gap-3 p-3 bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/30 rounded-lg hover:bg-[var(--color-danger)]/15 hover:border-[var(--color-danger)]/40 transition-all cursor-pointer text-left"
              >
                <div className="p-1.5 rounded bg-[var(--color-danger)]/20 flex-shrink-0">
                  <Droplets size={16} className="text-[var(--color-danger)]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-[var(--color-text)] mb-1">
                    Fault detected: FLX-3158
                  </div>
                  <div className="text-xs text-[var(--color-text-muted)] mb-1 line-clamp-2">
                    {faultDescription || 'Water intrusion detected in fixture housing. Device shows signs of moisture damage. This is a repeat failure pattern in this location.'}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[var(--color-text-soft)]">
                    <span>Grocery - Aisle 5</span>
                    <span>•</span>
                    <span>Zone 7 - Grocery</span>
                    <span>•</span>
                    <span>45 minutes ago</span>
                  </div>
                </div>
              </button>
              <button
                onClick={handleDiscoveryClick}
                className="w-full flex items-center gap-3 p-3 bg-[var(--color-surface-subtle)] rounded-lg hover:bg-[var(--color-surface)] transition-all cursor-pointer text-left"
              >
                <div className="w-2 h-2 rounded-full bg-[var(--color-success)]"></div>
                <div className="flex-1">
                  <div className="text-sm text-[var(--color-text)]">Discovery scan completed - {devices.length.toLocaleString()} devices found</div>
                  <div className="text-xs text-[var(--color-text-muted)]">3 minutes ago</div>
                </div>
              </button>
              {zones.length > 0 && (
                <button
                  onClick={handleZoneClick}
                  className="w-full flex items-center gap-3 p-3 bg-[var(--color-surface-subtle)] rounded-lg hover:bg-[var(--color-surface)] transition-all cursor-pointer text-left"
                >
                  <div className="w-2 h-2 rounded-full bg-[var(--color-primary)]"></div>
                  <div className="flex-1">
                    <div className="text-sm text-[var(--color-text)]">Zone "{zones[0]?.name}" configuration saved</div>
                    <div className="text-xs text-[var(--color-text-muted)]">18 minutes ago</div>
                  </div>
                </button>
              )}
              <button
                onClick={handleBACnetClick}
                className="w-full flex items-center gap-3 p-3 bg-[var(--color-surface-subtle)] rounded-lg hover:bg-[var(--color-surface)] transition-all cursor-pointer text-left"
              >
                <div className="w-2 h-2 rounded-full bg-[var(--color-warning)]"></div>
                <div className="flex-1">
                  <div className="text-sm text-[var(--color-text)]">BACnet mapping updated for {zones.length > 0 ? zones[0]?.name : 'Zone'}</div>
                  <div className="text-xs text-[var(--color-text-muted)]">1 hour ago</div>
                </div>
              </button>
            </div>
          </div>

          <div className="fusion-card">
            <h3 className="text-lg font-semibold text-[var(--color-text)] mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <Link href="/discovery" className="w-full fusion-button fusion-button-primary text-left justify-start block">
                Start Discovery
              </Link>
              <Link href="/zones" className="w-full fusion-button block text-left justify-start" style={{ background: 'var(--color-surface-subtle)', color: 'var(--color-text)' }}>
                Create Zone
              </Link>
              <Link href="/map" className="w-full fusion-button block text-left justify-start" style={{ background: 'var(--color-surface-subtle)', color: 'var(--color-text)' }}>
                View Map
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

