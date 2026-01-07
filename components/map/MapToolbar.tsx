/**
 * Map Toolbar Component
 * 
 * Top bar with actions for positioning and moving devices on the map.
 * Provides tools for selecting, moving, aligning, and organizing devices.
 * 
 * AI Note: This toolbar replaces the old MapViewsMenu with actionable
 * device positioning tools.
 */

'use client'

import { useState } from 'react'
import {
  MousePointer2,
  Move,
  RotateCw,
  ArrowUpDown,
  Sparkles,
  Undo2,
  Redo2
} from 'lucide-react'
import { Button } from '@/components/ui/Button'

export type MapToolMode =
  | 'select'
  | 'move'
  | 'rotate'
  | 'align-direction'
  | 'auto-arrange'

interface MapToolbarProps {
  mode: MapToolMode
  onModeChange: (mode: MapToolMode) => void
  onAction: (action: MapToolMode) => void
  canUndo: boolean
  canRedo: boolean
  onUndo: () => void
  onRedo: () => void
}

interface ToolOption {
  id: MapToolMode
  label: string
  icon: any
  description: string
  isToggle?: boolean // If true, clicking toggles the mode on/off
  isAction?: boolean // If true, clicking performs an immediate action
}

const toolOptions: ToolOption[] = [
  {
    id: 'select',
    label: 'Select',
    icon: MousePointer2,
    description: 'Click to select devices',
    isToggle: true,
  },
  {
    id: 'move',
    label: 'Move',
    icon: Move,
    description: 'Drag devices to reposition them',
    isToggle: true,
  },
  {
    id: 'rotate',
    label: 'Rotate',
    icon: RotateCw,
    description: 'Click devices to rotate them',
    isToggle: true,
  },
  {
    id: 'align-direction',
    label: 'Align Direction',
    icon: ArrowUpDown,
    description: 'Make all lights face the same direction (horizontal/vertical)',
    isAction: true,
  },
  {
    id: 'auto-arrange',
    label: 'Auto Arrange',
    icon: Sparkles,
    description: 'Automatically arrange devices by type',
    isAction: true,
  },
]

export function MapToolbar({
  mode,
  onModeChange,
  onAction,
  canUndo,
  canRedo,
  onUndo,
  onRedo
}: MapToolbarProps) {
  const handleToolClick = (tool: ToolOption) => {
    if (tool.isToggle) {
      // Toggle mode on/off
      onModeChange(mode === tool.id ? 'select' : tool.id)
    } else if (tool.isAction) {
      // Perform immediate action
      onAction(tool.id)
    }
  }

  return (
    <div className="pointer-events-auto flex items-center gap-2 bg-[var(--color-surface)] backdrop-blur-xl rounded-xl border border-[var(--color-border-subtle)] p-2 shadow-[var(--shadow-strong)]">
      {/* Undo/Redo */}
      <div className="flex items-center gap-1 pr-2 border-r border-[var(--color-border-subtle)]">
        <Button
          onClick={onUndo}
          disabled={!canUndo}
          variant="ghost"
          size="icon"
          className="w-8 h-8 rounded-lg"
          title="Undo last action"
        >
          <Undo2 size={16} />
        </Button>
        <Button
          onClick={onRedo}
          disabled={!canRedo}
          variant="ghost"
          size="icon"
          className="w-8 h-8 rounded-lg"
          title="Redo last action"
        >
          <Redo2 size={16} />
        </Button>
      </div>

      {/* Tool Buttons */}
      <div className="flex items-center gap-1">
        {toolOptions.map((tool) => {
          const Icon = tool.icon
          const isActive = mode === tool.id && tool.isToggle

          return (
            <Button
              key={tool.id}
              onClick={() => handleToolClick(tool)}
              variant={isActive ? 'primary' : 'ghost'}
              className={`gap-2 px-2 md:px-3 py-2 ${!isActive ? 'text-[var(--color-text-muted)] hover:text-[var(--color-primary)]' : ''}`}
              title={tool.description}
            >
              <Icon size={16} className={isActive ? 'opacity-100' : 'opacity-70'} />
              <span className="hidden md:inline text-sm font-medium whitespace-nowrap">{tool.label}</span>
            </Button>
          )
        })}
      </div>
    </div>
  )
}

