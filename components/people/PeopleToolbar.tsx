/**
 * People Toolbar Component
 * 
 * Simplified toolbar for people map interactions
 */

'use client'

import { MousePointer2, Move, UserPlus } from 'lucide-react'

export type PeopleToolMode = 'select' | 'move'

interface PeopleToolbarProps {
  mode: PeopleToolMode
  onModeChange: (mode: PeopleToolMode) => void
  selectedCount?: number
}

interface ToolOption {
  id: PeopleToolMode
  label: string
  icon: any
  description: string
}

const toolOptions: ToolOption[] = [
  {
    id: 'select',
    label: 'Select',
    icon: MousePointer2,
    description: 'Click to select people',
  },
  {
    id: 'move',
    label: 'Move',
    icon: Move,
    description: 'Drag people to reposition them',
  },
]

export function PeopleToolbar({
  mode,
  onModeChange,
  selectedCount = 0,
}: PeopleToolbarProps) {
  return (
    <div className="pointer-events-auto flex items-center gap-1 bg-[var(--color-surface-glass)] backdrop-blur-xl rounded-xl border border-[var(--color-border-subtle)] p-1 shadow-[var(--shadow-soft)]">
      {toolOptions.map((tool) => {
        const Icon = tool.icon
        const isActive = mode === tool.id

        return (
          <button
            key={tool.id}
            onClick={() => onModeChange(tool.id)}
            className={`
              flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all
              ${
                isActive
                  ? 'bg-[var(--color-primary)] text-[var(--color-text-on-primary)] shadow-[var(--shadow-soft)]'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface)]'
              }
            `}
            title={tool.description}
          >
            <Icon size={16} />
            <span className="hidden md:inline">{tool.label}</span>
          </button>
        )
      })}
      {selectedCount > 0 && (
        <div className="ml-2 px-2 py-1 text-xs text-[var(--color-text-muted)]">
          {selectedCount} selected
        </div>
      )}
    </div>
  )
}
