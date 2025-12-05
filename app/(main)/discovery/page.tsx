/**
 * Discovery Section
 * 
 * Wizard-style flow for device discovery.
 * Shows progress, counts, and results (table + map).
 * 
 * AI Note: This is the main discovery interface. Should integrate
 * with tRPC endpoints for starting/stopping discovery and fetching results.
 */

'use client'

import { SearchIsland } from '@/components/layout/SearchIsland'

export default function DiscoveryPage() {
  return (
    <div className="h-full flex flex-col min-h-0 p-8 pb-2">
      <div className="flex-1 min-h-0 overflow-hidden max-w-4xl mx-auto w-full flex flex-col">

        {/* Discovery Controls */}
        <div className="fusion-card mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[var(--color-text)] mb-1">
                Network Discovery
              </h2>
              <p className="text-sm text-[var(--color-text-muted)]">
                Scan for devices on the network
              </p>
            </div>
            <div className="flex gap-3">
              <button className="fusion-button fusion-button-primary">
                Start Discovery
              </button>
              <button className="fusion-button" style={{ background: 'var(--color-surface-subtle)', color: 'var(--color-text)' }}>
                Stop
              </button>
            </div>
          </div>
        </div>

        {/* Discovery Status */}
        <div className="fusion-card">
          <h3 className="text-md font-semibold text-[var(--color-text)] mb-4">
            Discovery Status
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-[var(--color-text-muted)]">Status</span>
                <span className="text-[var(--color-success)]">Idle</span>
              </div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-[var(--color-text-muted)]">Devices Found</span>
                <span className="text-[var(--color-text)]">2,847</span>
              </div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-[var(--color-text-muted)]">Last Run</span>
                <span className="text-[var(--color-text-muted)]">Today at 2:34 PM</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--color-text-muted)]">Duration</span>
                <span className="text-[var(--color-text-muted)]">4m 23s</span>
              </div>
            </div>
          </div>
        </div>

        {/* Results will be shown here when discovery completes */}
      </div>

      {/* Bottom Search Island */}
      <SearchIsland 
        position="bottom" 
        fullWidth={true}
        title="Device Discovery"
        subtitle="Discover and map all lighting devices in your network"
      />
    </div>
  )
}

