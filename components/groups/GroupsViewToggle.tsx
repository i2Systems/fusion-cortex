/**
 * Groups View Toggle Component
 * 
 * Tab toggle for switching between Devices/People/Both views
 */

'use client'

import { Monitor, Users, Layers } from 'lucide-react'

export type GroupsFilterMode = 'devices' | 'people' | 'both'

interface GroupsViewToggleProps {
  currentFilter: GroupsFilterMode
  onFilterChange: (filter: GroupsFilterMode) => void
}

const filterOptions: { id: GroupsFilterMode; label: string; icon: any }[] = [
  { id: 'devices', label: 'Devices', icon: Monitor },
  { id: 'people', label: 'People', icon: Users },
  { id: 'both', label: 'Both', icon: Layers },
]

export function GroupsViewToggle({ currentFilter, onFilterChange }: GroupsViewToggleProps) {
  return (
    <div className="inline-flex items-center bg-[var(--color-surface-glass)] backdrop-blur-xl rounded-lg border border-[var(--color-border-subtle)] p-1 shadow-[var(--shadow-soft)]">
      {filterOptions.map((option) => {
        const Icon = option.icon
        const isActive = currentFilter === option.id

        return (
          <button
            key={option.id}
            onClick={() => onFilterChange(option.id)}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all
              ${isActive
                ? 'bg-[var(--color-primary)] text-[var(--color-text-on-primary)] shadow-[var(--shadow-soft)]'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-subtle)]'
              }
            `}
          >
            <Icon size={14} />
            <span>{option.label}</span>
          </button>
        )
      })}
    </div>
  )
}
