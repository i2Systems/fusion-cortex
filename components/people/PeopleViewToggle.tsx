/**
 * People View Toggle Component
 * 
 * Tabs for switching between Grid and Map views
 */

'use client'

import { Grid3x3, Map } from 'lucide-react'

export type PeopleViewMode = 'grid' | 'map'

interface PeopleViewToggleProps {
  currentView: PeopleViewMode
  onViewChange: (view: PeopleViewMode) => void
}

export function PeopleViewToggle({ currentView, onViewChange }: PeopleViewToggleProps) {
  return (
    <div className="flex items-center gap-1 p-0.5 bg-[var(--color-surface-subtle)] rounded-lg border border-[var(--color-border-subtle)]">
      <button
        onClick={() => onViewChange('grid')}
        className={`
          flex items-center justify-center gap-1.5 px-2 md:px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200
          ${
            currentView === 'grid'
              ? 'bg-[var(--color-primary)] text-[var(--color-text-on-primary)] shadow-[var(--shadow-soft)]'
              : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface)]'
          }
        `}
        title="Grid View"
      >
        <Grid3x3 size={14} />
        <span className="hidden md:inline">Grid</span>
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
