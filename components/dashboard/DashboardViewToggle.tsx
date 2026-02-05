/**
 * Dashboard View Toggle
 *
 * Toggle between Cards (site grid) and Map (floor plan) views.
 */

'use client'

import { LayoutGrid, Map } from 'lucide-react'

export type DashboardViewMode = 'cards' | 'map'

interface DashboardViewToggleProps {
  currentView: DashboardViewMode
  onViewChange: (view: DashboardViewMode) => void
}

export function DashboardViewToggle({ currentView, onViewChange }: DashboardViewToggleProps) {
  return (
    <div className="flex items-center gap-1 p-0.5 bg-[var(--color-surface-subtle)] rounded-lg border border-[var(--color-border-subtle)]">
      <button
        onClick={() => onViewChange('cards')}
        className={`
          flex items-center justify-center gap-1.5 px-2 md:px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200
          ${
            currentView === 'cards'
              ? 'bg-[var(--color-primary)] text-[var(--color-text-on-primary)] shadow-[var(--shadow-soft)]'
              : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface)]'
          }
        `}
        title="Cards View"
      >
        <LayoutGrid size={14} />
        <span className="hidden md:inline">Cards</span>
      </button>
      <button
        onClick={() => onViewChange('map')}
        className={`
          flex items-center justify-center gap-1.5 px-2 md:px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200
          ${
            currentView === 'map'
              ? 'bg-[var(--color-primary)] text-[var(--color-text-on-primary)] shadow-[var(--shadow-soft)]'
              : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface)]'
          }
        `}
        title="Map View"
      >
        <Map size={14} />
        <span className="hidden md:inline">Map</span>
      </button>
    </div>
  )
}
