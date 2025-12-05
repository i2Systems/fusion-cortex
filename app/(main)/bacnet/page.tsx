/**
 * BACnet Mapping Section
 * 
 * Main area: Table of Zones ↔ BACnet objects.
 * Right panel: Detailed mapping help/validation for selected row.
 * 
 * AI Note: Simple table with inline editing of BACnet Object IDs.
 * Status column shows Connected / Error / Not Assigned.
 */

'use client'

import { SearchIsland } from '@/components/layout/SearchIsland'

export default function BACnetPage() {
  return (
    <div className="h-full p-8 relative pb-32">

      {/* BACnet Mapping Table */}
      <div className="fusion-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--color-border-subtle)]">
              <th className="text-left py-3 px-4 text-sm font-semibold text-[var(--color-text-muted)]">
                Zone
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-[var(--color-text-muted)]">
                BACnet Object ID
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-[var(--color-text-muted)]">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-[var(--color-border-subtle)] hover:bg-[var(--color-surface-subtle)]">
              <td className="py-3 px-4 text-sm text-[var(--color-text)] font-medium">Zone 1 - Electronics</td>
              <td className="py-3 px-4">
                <input
                  type="text"
                  defaultValue="4001"
                  className="w-full px-2 py-1 bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] rounded text-sm text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)]"
                />
              </td>
              <td className="py-3 px-4">
                <span className="text-xs px-2 py-1 rounded bg-[var(--color-success)]/20 text-[var(--color-success)]">
                  Connected
                </span>
              </td>
            </tr>
            <tr className="border-b border-[var(--color-border-subtle)] hover:bg-[var(--color-surface-subtle)]">
              <td className="py-3 px-4 text-sm text-[var(--color-text)] font-medium">Zone 2 - Clothing</td>
              <td className="py-3 px-4">
                <input
                  type="text"
                  defaultValue="4002"
                  className="w-full px-2 py-1 bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] rounded text-sm text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)]"
                />
              </td>
              <td className="py-3 px-4">
                <span className="text-xs px-2 py-1 rounded bg-[var(--color-success)]/20 text-[var(--color-success)]">
                  Connected
                </span>
              </td>
            </tr>
            <tr className="border-b border-[var(--color-border-subtle)] hover:bg-[var(--color-surface-subtle)]">
              <td className="py-3 px-4 text-sm text-[var(--color-text)] font-medium">Zone 3 - Retail</td>
              <td className="py-3 px-4">
                <input
                  type="text"
                  placeholder="Enter Object ID..."
                  className="w-full px-2 py-1 bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] rounded text-sm text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)]"
                />
              </td>
              <td className="py-3 px-4">
                <span className="text-xs px-2 py-1 rounded bg-[var(--color-surface-subtle)] text-[var(--color-text-muted)]">
                  Not Assigned
                </span>
              </td>
            </tr>
            <tr className="border-b border-[var(--color-border-subtle)] hover:bg-[var(--color-surface-subtle)]">
              <td className="py-3 px-4 text-sm text-[var(--color-text)] font-medium">Zone 7 - Grocery</td>
              <td className="py-3 px-4">
                <input
                  type="text"
                  defaultValue="4007"
                  className="w-full px-2 py-1 bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] rounded text-sm text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)]"
                />
              </td>
              <td className="py-3 px-4">
                <span className="text-xs px-2 py-1 rounded bg-[var(--color-warning)]/20 text-[var(--color-warning)]">
                  Error
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Bottom Search Island */}
      <SearchIsland 
        position="bottom" 
        fullWidth={true}
        title="BACnet Mapping"
        subtitle="Map zones to BACnet objects for BMS integration"
      />
    </div>
  )
}

