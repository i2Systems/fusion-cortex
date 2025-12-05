/**
 * Rules & Overrides Section
 * 
 * Main area: Rule list + selected rule builder (Alexa-style).
 * Right panel: Human-readable preview.
 * 
 * AI Note: Support rule patterns like:
 * - IF motion in Zone C THEN set Zones A+B+C to 25%
 * - IF no motion for 30 minutes THEN return to BMS
 * - IF daylight > 120fc THEN dim to minimum
 * 
 * Plain language labels, trigger → condition → action builder.
 */

'use client'

import { SearchIsland } from '@/components/layout/SearchIsland'

export default function RulesPage() {
  return (
    <div className="h-full p-8 relative pb-32">

      {/* Active Rules */}
      <div className="fusion-card mb-6">
        <h2 className="text-lg font-semibold text-[var(--color-text)] mb-4">
          Active Rules
        </h2>
        <div className="space-y-3">
          <div className="p-4 bg-[var(--color-surface-subtle)] rounded-lg border border-[var(--color-border-subtle)]">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <div className="text-sm font-medium text-[var(--color-text)] mb-1">
                  IF motion detected in Zone 2 - Clothing
                </div>
                <div className="text-xs text-[var(--color-text-muted)]">
                  THEN set Zone 2 to 30% for 15 minutes, then return to BMS
                </div>
              </div>
              <span className="text-xs px-2 py-1 rounded bg-[var(--color-success)]/20 text-[var(--color-success)]">
                Active
              </span>
            </div>
            <div className="text-xs text-[var(--color-text-soft)] mt-2">
              Last triggered: 12 minutes ago
            </div>
          </div>
          <div className="p-4 bg-[var(--color-surface-subtle)] rounded-lg border border-[var(--color-border-subtle)]">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <div className="text-sm font-medium text-[var(--color-text)] mb-1">
                  IF daylight level {'>'} 120fc in Zone 7 - Grocery
                </div>
                <div className="text-xs text-[var(--color-text-muted)]">
                  THEN dim fixtures to minimum (10%)
                </div>
              </div>
              <span className="text-xs px-2 py-1 rounded bg-[var(--color-success)]/20 text-[var(--color-success)]">
                Active
              </span>
            </div>
            <div className="text-xs text-[var(--color-text-soft)] mt-2">
              Last triggered: 2 hours ago
            </div>
          </div>
        </div>
      </div>

      {/* Rule Builder */}
      <div className="fusion-card">
        <h2 className="text-lg font-semibold text-[var(--color-text)] mb-4">
          Create New Rule
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-2">
              Trigger
            </label>
            <select className="w-full px-3 py-2 bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] rounded-lg text-sm text-[var(--color-text)]">
              <option>Motion detected</option>
              <option>No motion for duration</option>
              <option>Daylight level</option>
              <option>BMS command</option>
              <option>Time schedule</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-2">
              Condition
            </label>
            <input
              type="text"
              placeholder="e.g., in Zone 3 - Retail"
              className="w-full px-3 py-2 bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] rounded-lg text-sm text-[var(--color-text)]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-2">
              Action
            </label>
            <input
              type="text"
              placeholder="e.g., set Zone 3 to 25% for 30 minutes"
              className="w-full px-3 py-2 bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] rounded-lg text-sm text-[var(--color-text)]"
            />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="override-bms" className="rounded" />
            <label htmlFor="override-bms" className="text-sm text-[var(--color-text-muted)]">
              Override BMS when triggered
            </label>
          </div>
        </div>
      </div>

      {/* Bottom Search Island */}
      <SearchIsland 
        position="bottom" 
        fullWidth={true}
        title="Rules & Overrides"
        subtitle="Create automation rules for lighting control"
      />
    </div>
  )
}

