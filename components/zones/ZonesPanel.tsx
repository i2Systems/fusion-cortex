/**
 * Zones Panel Component
 * 
 * Right-side panel for zone management.
 * Shows zone list and properties.
 * 
 * AI Note: This panel displays zones and allows editing zone properties.
 */

'use client'

import { useState, useEffect } from 'react'
import { Layers, Edit2, Trash2, MapPin, X, Save, CheckSquare, Square } from 'lucide-react'

interface Zone {
  id: string
  name: string
  deviceCount: number
  description: string
  colorVar?: string // CSS variable name like '--color-primary'
  color?: string // Hex color (alternative to colorVar)
}

interface ZonesPanelProps {
  zones: Zone[]
  selectedZoneId?: string | null
  onZoneSelect?: (zoneId: string | null) => void
  onCreateZone?: () => void
  onDeleteZone?: (zoneId: string) => void
  onDeleteZones?: (zoneIds: string[]) => void // Bulk delete
  onEditZone?: (zoneId: string, updates: { name?: string; description?: string; color?: string }) => void
  selectionMode?: boolean // When true, hide details and show only zone list
}

import { ZONE_COLORS, DEFAULT_ZONE_COLOR } from '@/lib/zoneColors'

export function ZonesPanel({ zones, selectedZoneId, onZoneSelect, onCreateZone, onDeleteZone, onDeleteZones, onEditZone, selectionMode = false }: ZonesPanelProps) {
  const [colors, setColors] = useState<Record<string, string>>({})
  const [isEditing, setIsEditing] = useState(false)
  const [editFormData, setEditFormData] = useState<{ name: string; description: string; color: string }>({
    name: '',
    description: '',
    color: DEFAULT_ZONE_COLOR,
  })
  const [selectedZoneIds, setSelectedZoneIds] = useState<Set<string>>(new Set())

  const selectedZone = zones.find(z => z.id === selectedZoneId)
  const allSelected = zones.length > 0 && selectedZoneIds.size === zones.length
  const someSelected = selectedZoneIds.size > 0 && selectedZoneIds.size < zones.length

  useEffect(() => {
    // Get CSS variable values or use direct color
    const root = document.documentElement
    const computedStyle = getComputedStyle(root)
    const colorMap: Record<string, string> = {}
    
    zones.forEach(zone => {
      if (zone.color) {
        colorMap[zone.id] = zone.color
      } else if (zone.colorVar) {
        const colorValue = computedStyle.getPropertyValue(zone.colorVar).trim()
        if (colorValue) {
          colorMap[zone.id] = colorValue
        }
      }
    })
    
    setColors(colorMap)
    
    // Update edit form color if editing and zone color changed
    if (isEditing && selectedZone) {
      const newColor = colorMap[selectedZone.id] || selectedZone.color || DEFAULT_ZONE_COLOR
      if (editFormData.color !== newColor) {
        setEditFormData(prev => ({ ...prev, color: newColor }))
      }
    }
  }, [zones, isEditing, selectedZone, editFormData.color])

  // Initialize edit form when entering edit mode
  useEffect(() => {
    if (isEditing && selectedZone) {
      setEditFormData({
        name: selectedZone.name,
        description: selectedZone.description || '',
        color: colors[selectedZone.id] || selectedZone.color || DEFAULT_ZONE_COLOR,
      })
    } else if (!selectedZone) {
      // Exit edit mode if zone is deselected
      setIsEditing(false)
    }
  }, [isEditing, selectedZone, colors])

  // Keyboard navigation: up/down arrows
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if an item is selected and we're not typing in an input
      if (!selectedZoneId || zones.length === 0) return
      if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') return

      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault()
        const currentIndex = zones.findIndex(z => z.id === selectedZoneId)
        if (currentIndex === -1) return

        let newIndex: number
        if (e.key === 'ArrowDown') {
          newIndex = currentIndex < zones.length - 1 ? currentIndex + 1 : currentIndex
        } else {
          newIndex = currentIndex > 0 ? currentIndex - 1 : currentIndex
        }

        if (newIndex !== currentIndex) {
          onZoneSelect?.(zones[newIndex].id)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedZoneId, zones, onZoneSelect])

  const handleStartEdit = () => {
    if (selectedZone) {
      setIsEditing(true)
    }
  }

  const handleSaveEdit = () => {
    if (!selectedZone) return
    
    if (!editFormData.name.trim()) {
      alert('Zone name is required')
      return
    }

    if (onEditZone) {
      onEditZone(selectedZone.id, {
        name: editFormData.name.trim(),
        description: editFormData.description.trim() || undefined,
        color: editFormData.color,
      })
    }
    setIsEditing(false)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    // Reset form data
    if (selectedZone) {
      setEditFormData({
        name: selectedZone.name,
        description: selectedZone.description || '',
        color: colors[selectedZone.id] || selectedZone.color || DEFAULT_ZONE_COLOR,
      })
    }
  }

  const handleToggleZoneSelection = (zoneId: string) => {
    setSelectedZoneIds(prev => {
      const next = new Set(prev)
      if (next.has(zoneId)) {
        next.delete(zoneId)
      } else {
        next.add(zoneId)
      }
      return next
    })
  }

  const handleSelectAll = () => {
    if (allSelected) {
      setSelectedZoneIds(new Set())
    } else {
      setSelectedZoneIds(new Set(zones.map(z => z.id)))
    }
  }

  const handleBulkDelete = () => {
    if (selectedZoneIds.size === 0) return
    
    const zoneNames = zones
      .filter(z => selectedZoneIds.has(z.id))
      .map(z => z.name)
      .join(', ')
    
    if (confirm(`Are you sure you want to delete ${selectedZoneIds.size} zone(s)?\n\n${zoneNames}`)) {
      if (onDeleteZones) {
        onDeleteZones(Array.from(selectedZoneIds))
      } else if (onDeleteZone) {
        // Fallback to individual delete if bulk delete not available
        selectedZoneIds.forEach(zoneId => onDeleteZone(zoneId))
      }
      setSelectedZoneIds(new Set())
      // Clear single selection if it was deleted
      if (selectedZoneId && selectedZoneIds.has(selectedZoneId)) {
        onZoneSelect?.(null)
      }
    }
  }

  // Clear multi-select when single selection changes
  useEffect(() => {
    if (selectedZoneId) {
      setSelectedZoneIds(new Set())
    }
  }, [selectedZoneId])

  return (
    <div className="h-full flex flex-col">
      {/* Panel Header - Always visible */}
      <div className="p-4 border-b border-[var(--color-border-subtle)]">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-[var(--color-text)]">
            Zones
          </h3>
          {zones.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleSelectAll}
                className="p-1.5 rounded-lg hover:bg-[var(--color-surface-subtle)] transition-colors"
                title={allSelected ? "Deselect all" : "Select all"}
              >
                {allSelected ? (
                  <CheckSquare size={16} className="text-[var(--color-primary)]" />
                ) : (
                  <Square size={16} className="text-[var(--color-text-muted)]" />
                )}
              </button>
              {selectedZoneIds.size > 0 && (
                <button
                  onClick={handleBulkDelete}
                  className="p-1.5 rounded-lg hover:bg-[var(--color-surface-subtle)] transition-colors text-[var(--color-danger)]"
                  title={`Delete ${selectedZoneIds.size} selected zone(s)`}
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          )}
        </div>
        {selectedZoneIds.size > 0 && (
          <div className="text-xs text-[var(--color-text-muted)] mt-1">
            {selectedZoneIds.size} zone{selectedZoneIds.size !== 1 ? 's' : ''} selected
          </div>
        )}
      </div>

      {/* Data-Dense Header for Selected Zone - Hidden in selection mode */}
      {selectedZone && !selectionMode && (
        <div className="p-4 border-b border-[var(--color-border-subtle)] bg-gradient-to-br from-[var(--color-primary-soft)]/30 to-[var(--color-surface-subtle)]">
          {isEditing ? (
            /* Edit Form */
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-base font-bold text-[var(--color-text)]">Edit Zone</h3>
                <div className="flex items-center gap-1">
                  <button
                    onClick={handleSaveEdit}
                    className="p-1.5 rounded-lg hover:bg-[var(--color-surface-subtle)] transition-colors text-[var(--color-success)]"
                    title="Save changes"
                  >
                    <Save size={14} />
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="p-1.5 rounded-lg hover:bg-[var(--color-surface-subtle)] transition-colors"
                    title="Cancel editing"
                  >
                    <X size={14} className="text-[var(--color-text-muted)]" />
                  </button>
                </div>
              </div>
              
              {/* Name Input */}
              <div>
                <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1.5">
                  Zone Name
                </label>
                <input
                  type="text"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border-subtle)] text-sm text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                  placeholder="Enter zone name"
                />
              </div>

              {/* Description Input */}
              <div>
                <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1.5">
                  Description
                </label>
                <textarea
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border-subtle)] text-sm text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent resize-none"
                  placeholder="Enter zone description (optional)"
                  rows={3}
                />
              </div>

              {/* Color Picker */}
              <div>
                <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1.5">
                  Zone Color
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 flex gap-2 flex-wrap">
                    {ZONE_COLORS.map((color) => (
                      <button
                        key={color}
                        onClick={() => setEditFormData({ ...editFormData, color })}
                        className={`w-8 h-8 rounded-lg border-2 transition-all ${
                          editFormData.color === color
                            ? 'border-[var(--color-text)] scale-110 shadow-[var(--shadow-soft)]'
                            : 'border-[var(--color-border-subtle)] hover:border-[var(--color-primary)]/50'
                        }`}
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                  <input
                    type="color"
                    value={editFormData.color}
                    onChange={(e) => setEditFormData({ ...editFormData, color: e.target.value })}
                    className="w-10 h-10 rounded-lg border border-[var(--color-border-subtle)] cursor-pointer"
                    title="Custom color"
                  />
                </div>
              </div>

              {/* Device Count (Read-only) */}
              <div className="px-2.5 py-1.5 rounded bg-[var(--color-surface)]/50 border border-[var(--color-border-subtle)]">
                <div className="text-xs text-[var(--color-text-soft)] mb-0.5">Devices in Zone</div>
                <div className="text-sm font-semibold text-[var(--color-text)]">{selectedZone.deviceCount}</div>
              </div>
            </div>
          ) : (
            /* View Mode */
            <div className="flex items-start gap-3 mb-3">
              {/* Zone Image/Icon */}
              <div 
                className="w-16 h-16 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border-subtle)] flex items-center justify-center flex-shrink-0 shadow-[var(--shadow-soft)]"
                style={{ backgroundColor: colors[selectedZone.id] ? `${colors[selectedZone.id]}20` : 'var(--color-primary-soft)' }}
              >
                <Layers size={32} style={{ color: colors[selectedZone.id] || 'var(--color-primary)' }} />
              </div>
              {/* Meta Information */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-bold text-[var(--color-text)] mb-0.5 truncate">
                      {selectedZone.name}
                    </h3>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      Control Zone
                    </p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleStartEdit()
                      }}
                      className="p-1.5 rounded-lg hover:bg-[var(--color-surface-subtle)] transition-colors"
                      title="Edit zone"
                    >
                      <Edit2 size={14} className="text-[var(--color-text-muted)]" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        if (onDeleteZone) {
                          if (confirm(`Are you sure you want to delete "${selectedZone.name}"?`)) {
                            onDeleteZone(selectedZone.id)
                            onZoneSelect?.(null)
                          }
                        }
                      }}
                      className="p-1.5 rounded-lg hover:bg-[var(--color-surface-subtle)] transition-colors"
                      title="Delete zone"
                    >
                      <Trash2 size={14} className="text-[var(--color-text-muted)]" />
                    </button>
                  </div>
                </div>
                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="px-2.5 py-1.5 rounded bg-[var(--color-surface)]/50 border border-[var(--color-border-subtle)] min-w-0">
                    <div className="text-xs text-[var(--color-text-soft)] mb-0.5 whitespace-nowrap">Devices</div>
                    <div className="text-sm font-semibold text-[var(--color-text)]">{selectedZone.deviceCount}</div>
                  </div>
                  <div 
                    className="px-2.5 py-1.5 rounded bg-[var(--color-surface)]/50 border border-[var(--color-border-subtle)] min-w-0"
                    style={{ borderColor: colors[selectedZone.id] ? `${colors[selectedZone.id]}40` : undefined }}
                  >
                    <div className="text-xs text-[var(--color-text-soft)] mb-0.5 whitespace-nowrap">Color</div>
                    <div className="flex items-center gap-1.5">
                      <div 
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: colors[selectedZone.id] || 'var(--color-primary)' }}
                      />
                      <div className="text-xs font-semibold text-[var(--color-text)] truncate">
                        {colors[selectedZone.id] || 'Default'}
                      </div>
                    </div>
                  </div>
                  {selectedZone.description && (
                    <div className="px-2.5 py-1.5 rounded bg-[var(--color-surface)]/50 border border-[var(--color-border-subtle)] col-span-2 min-w-0">
                      <div className="text-xs text-[var(--color-text-soft)] mb-0.5 whitespace-nowrap">Description</div>
                      <div className="text-xs font-semibold text-[var(--color-text)] line-clamp-2">{selectedZone.description}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Zone List */}
      <div 
        className="flex-1 overflow-auto pb-2"
        onClick={(e) => {
          // If clicking on the container itself (not a zone item), deselect
          if (e.target === e.currentTarget || (e.target as HTMLElement).classList.contains('zones-list-container')) {
            onZoneSelect?.(null)
          }
        }}
      >
        {zones.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-[var(--color-surface-subtle)] flex items-center justify-center mb-4">
              <Layers size={32} className="text-[var(--color-text-muted)]" />
            </div>
            <h3 className="text-lg font-semibold text-[var(--color-text)] mb-2">
              No Zones Created
            </h3>
            <p className="text-sm text-[var(--color-text-muted)] mb-4">
              Create your first zone by drawing on the map or clicking "Create New Zone" below.
            </p>
          </div>
        ) : (
          <div 
            className="space-y-2 p-2 zones-list-container"
            onClick={(e) => {
              // If clicking on empty space in the list container, deselect
              if (e.target === e.currentTarget) {
                onZoneSelect?.(null)
              }
            }}
          >
            {zones.map((zone) => {
              const isSelected = selectedZoneId === zone.id
              const isMultiSelected = selectedZoneIds.has(zone.id)
              return (
            <div
              key={zone.id}
              onClick={(e) => {
                // Don't toggle single selection if clicking on checkbox or buttons
                if ((e.target as HTMLElement).closest('button, input[type="checkbox"]')) {
                  return
                }
                e.stopPropagation() // Prevent container click handler
                // Toggle: if already selected, deselect; otherwise select
                onZoneSelect?.(isSelected ? null : zone.id)
              }}
              className={`
                p-3 rounded-lg border cursor-pointer transition-all
                ${isSelected
                  ? 'bg-[var(--color-primary-soft)] border-[var(--color-primary)] shadow-[var(--shadow-glow-primary)]'
                  : isMultiSelected
                  ? 'bg-[var(--color-primary-soft)]/50 border-[var(--color-primary)]/50'
                  : 'bg-[var(--color-surface-subtle)] border-[var(--color-border-subtle)] hover:border-[var(--color-primary)]/50'
                }
              `}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleToggleZoneSelection(zone.id)
                    }}
                    className="p-0.5 rounded hover:bg-[var(--color-surface-subtle)] transition-colors flex-shrink-0"
                    title={isMultiSelected ? "Deselect zone" : "Select zone"}
                  >
                    {isMultiSelected ? (
                      <CheckSquare size={16} className="text-[var(--color-primary)]" />
                    ) : (
                      <Square size={16} className="text-[var(--color-text-muted)]" />
                    )}
                  </button>
                  <div 
                    className="w-4 h-4 rounded-full flex-shrink-0"
                    style={{ backgroundColor: colors[zone.id] || 'var(--color-primary)' }}
                  />
                  <h4 className="font-semibold text-sm text-[var(--color-text)] truncate">
                    {zone.name}
                  </h4>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onZoneSelect?.(zone.id)
                    }}
                    className="p-1.5 rounded-lg hover:bg-[var(--color-surface-subtle)] transition-colors"
                    title="Select zone"
                  >
                    <MapPin size={14} className="text-[var(--color-text-muted)]" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      if (onDeleteZone) {
                        if (confirm(`Are you sure you want to delete "${zone.name}"?`)) {
                          onDeleteZone(zone.id)
                          if (selectedZoneId === zone.id) {
                            onZoneSelect?.(null)
                          }
                        }
                      }
                    }}
                    className="p-1.5 rounded-lg hover:bg-[var(--color-surface-subtle)] transition-colors"
                    title="Delete zone"
                  >
                    <Trash2 size={14} className="text-[var(--color-text-muted)]" />
                  </button>
                </div>
              </div>
              <p className="text-xs text-[var(--color-text-muted)] mb-1">
                {zone.deviceCount} devices
              </p>
              <p className="text-xs text-[var(--color-text-soft)]">
                {zone.description}
              </p>
            </div>
            )
          })}
          </div>
        )}
      </div>

      {/* Actions Footer */}
      <div className="p-4 border-t border-[var(--color-border-subtle)] flex-shrink-0">
        <button 
          onClick={() => {
            if (onCreateZone) {
              onCreateZone()
            } else {
              // Fallback: clear selection
              onZoneSelect?.(null)
            }
          }}
          className="w-full fusion-button fusion-button-primary flex items-center justify-center gap-2"
        >
          <Layers size={16} />
          Create New Zone
        </button>
      </div>
    </div>
  )
}

