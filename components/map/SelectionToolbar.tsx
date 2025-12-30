/**
 * Selection Toolbar Component
 * 
 * Floating contextual toolbar that appears when devices are selected.
 * Provides quick actions: Create Zone, Clear Selection, Add to Zone.
 * 
 * AI Note: This toolbar reduces mode confusion by providing clear
 * actions for selected devices.
 */

'use client'

import { Layers, X, Plus } from 'lucide-react'

interface SelectionToolbarProps {
  selectedCount: number
  onCreateZone?: () => void
  onClearSelection?: () => void
  onAddToZone?: () => void
  position?: { x: number; y: number }
}

export function SelectionToolbar({
  selectedCount,
  onCreateZone,
  onClearSelection,
  onAddToZone,
  position,
}: SelectionToolbarProps) {
  if (selectedCount === 0) return null

  const toolbarStyle: React.CSSProperties = position
    ? {
        position: 'absolute',
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: 'translate(-50%, -100%)',
        marginTop: '-12px',
      }
    : {
        position: 'absolute',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
      }

  return (
    <div
      className="pointer-events-auto flex items-center gap-2 bg-[var(--color-surface)] backdrop-blur-xl rounded-xl border border-[var(--color-primary)] p-2 shadow-[var(--shadow-strong)] z-50"
      style={toolbarStyle}
    >
      <div className="px-3 py-1 text-sm font-semibold text-[var(--color-text)] border-r border-[var(--color-border-subtle)]">
        {selectedCount} selected
      </div>
      
      {onCreateZone && (
        <button
          onClick={onCreateZone}
          className="fusion-button fusion-button-primary flex items-center gap-2 px-3 py-1.5 text-sm"
          title="Create zone from selection"
        >
          <Layers size={14} />
          <span>Create Zone</span>
        </button>
      )}
      
      {onAddToZone && (
        <button
          onClick={onAddToZone}
          className="fusion-button fusion-button-secondary flex items-center gap-2 px-3 py-1.5 text-sm"
          title="Add to existing zone"
        >
          <Plus size={14} />
          <span>Add to Zone</span>
        </button>
      )}
      
      {onClearSelection && (
        <button
          onClick={onClearSelection}
          className="fusion-button-ghost flex items-center gap-2 px-3 py-1.5 text-sm"
          title="Clear selection"
        >
          <X size={14} />
          <span>Clear</span>
        </button>
      )}
    </div>
  )
}

