/**
 * Faults / Health Section
 * 
 * Main: Simple counts and list (missing, duplicates, offline).
 * Right panel: Detailed device info when fault is selected.
 * 
 * AI Note: Summary view with counts, click to see filtered device table.
 */

'use client'

import { SearchIsland } from '@/components/layout/SearchIsland'

export default function FaultsPage() {
  return (
    <div className="h-full p-8 relative pb-32">

      {/* Fault Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="fusion-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-[var(--color-text-muted)]">Missing</span>
            <span className="text-2xl font-bold text-[var(--color-danger)]">78</span>
          </div>
          <div className="text-xs text-[var(--color-text-muted)]">Not responding to discovery</div>
        </div>
        <div className="fusion-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-[var(--color-text-muted)]">Offline</span>
            <span className="text-2xl font-bold text-[var(--color-warning)]">142</span>
          </div>
          <div className="text-xs text-[var(--color-text-muted)]">No signal in last 24h</div>
        </div>
        <div className="fusion-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-[var(--color-text-muted)]">Low Battery</span>
            <span className="text-2xl font-bold text-[var(--color-warning)]">23</span>
          </div>
          <div className="text-xs text-[var(--color-text-muted)]">Below 20% charge</div>
        </div>
      </div>

      {/* Fault List */}
      <div className="fusion-card">
        <h3 className="text-md font-semibold text-[var(--color-text)] mb-4">
          Recent Faults
        </h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between p-3 bg-[var(--color-surface-subtle)] rounded-lg">
            <div>
              <span className="text-sm font-medium text-[var(--color-text)]">MSN-0876</span>
              <span className="text-xs text-[var(--color-text-muted)] ml-2">Missing • Electronics - Display Area</span>
            </div>
            <button className="text-xs text-[var(--color-primary)] hover:underline">
              View Details
            </button>
          </div>
          <div className="flex items-center justify-between p-3 bg-[var(--color-surface-subtle)] rounded-lg">
            <div>
              <span className="text-sm font-medium text-[var(--color-text)]">FLX-1029</span>
              <span className="text-xs text-[var(--color-text-muted)] ml-2">Offline • Produce - Back Wall</span>
            </div>
            <button className="text-xs text-[var(--color-primary)] hover:underline">
              View Details
            </button>
          </div>
          <div className="flex items-center justify-between p-3 bg-[var(--color-surface-subtle)] rounded-lg">
            <div>
              <span className="text-sm font-medium text-[var(--color-text)]">MSN-2156</span>
              <span className="text-xs text-[var(--color-text-muted)] ml-2">Low Battery (12%) • Zone 2 - Clothing</span>
            </div>
            <button className="text-xs text-[var(--color-primary)] hover:underline">
              View Details
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Search Island */}
      <SearchIsland 
        position="bottom" 
        fullWidth={true}
        title="Faults / Health"
        subtitle="Monitor device health and system status"
      />
    </div>
  )
}

