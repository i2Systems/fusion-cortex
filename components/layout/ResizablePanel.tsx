/**
 * Resizable Panel Component
 * 
 * Wraps panel content with a draggable handle for resizing.
 * Features:
 * - Draggable handle between panel and main content
 * - Minimum width threshold - below which panel collapses completely
 * - Collapsed state shows two-line grip that can be pulled to reopen
 * - Smooth spring-like animations
 * - Remembers last open width
 * 
 * AI Note: Use this component to wrap any right-side panel that should be resizable.
 */

'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { GripVertical } from 'lucide-react'

interface ResizablePanelProps {
  children: React.ReactNode
  defaultWidth?: number
  minWidth?: number
  maxWidth?: number
  collapseThreshold?: number
  storageKey?: string
  className?: string
}

export function ResizablePanel({
  children,
  defaultWidth = 384, // 24rem
  minWidth = 280,
  maxWidth = 600,
  collapseThreshold = 200, // Below this, panel collapses completely
  storageKey,
  className = '',
}: ResizablePanelProps) {
  const [width, setWidth] = useState(defaultWidth)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [lastOpenWidth, setLastOpenWidth] = useState(defaultWidth)
  const panelRef = useRef<HTMLDivElement>(null)
  const handleRef = useRef<HTMLDivElement>(null)
  const dragStartX = useRef(0)
  const dragStartWidth = useRef(0)

  // Load saved state from localStorage
  useEffect(() => {
    if (storageKey && typeof window !== 'undefined') {
      const saved = localStorage.getItem(`panel_${storageKey}`)
      if (saved) {
        try {
          const { width: savedWidth, isCollapsed: savedCollapsed } = JSON.parse(saved)
          if (savedWidth && !savedCollapsed) {
            setWidth(savedWidth)
            setLastOpenWidth(savedWidth)
          }
          if (savedCollapsed !== undefined) {
            setIsCollapsed(savedCollapsed)
          }
        } catch (e) {
          console.warn('Failed to load panel state:', e)
        }
      }
    }
  }, [storageKey])

  // Save state to localStorage
  useEffect(() => {
    if (storageKey && typeof window !== 'undefined') {
      localStorage.setItem(`panel_${storageKey}`, JSON.stringify({
        width: isCollapsed ? lastOpenWidth : width,
        isCollapsed,
      }))
    }
  }, [width, isCollapsed, lastOpenWidth, storageKey])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
    dragStartX.current = e.clientX
    dragStartWidth.current = isCollapsed ? 0 : width
    
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }, [width, isCollapsed])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return
    
    // Calculate new width (dragging left increases width, right decreases)
    const deltaX = dragStartX.current - e.clientX
    let newWidth = dragStartWidth.current + deltaX
    
    // If starting from collapsed state, expand if dragging left
    if (isCollapsed && deltaX > 20) {
      setIsCollapsed(false)
      newWidth = Math.max(minWidth, deltaX + collapseThreshold)
    }
    
    // Clamp width
    newWidth = Math.max(0, Math.min(maxWidth, newWidth))
    
    // Check if should collapse
    if (newWidth < collapseThreshold && !isCollapsed) {
      setIsCollapsed(true)
      setLastOpenWidth(width > collapseThreshold ? width : lastOpenWidth)
    } else if (newWidth >= collapseThreshold) {
      setIsCollapsed(false)
      setWidth(Math.max(minWidth, newWidth))
    }
  }, [isDragging, isCollapsed, width, lastOpenWidth, minWidth, maxWidth, collapseThreshold])

  const handleMouseUp = useCallback(() => {
    if (!isDragging) return
    setIsDragging(false)
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
  }, [isDragging])

  // Add global mouse event listeners for dragging
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
      return () => {
        window.removeEventListener('mousemove', handleMouseMove)
        window.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  // Handle double-click to toggle collapse
  const handleDoubleClick = useCallback(() => {
    if (isCollapsed) {
      setIsCollapsed(false)
      setWidth(lastOpenWidth)
    } else {
      setLastOpenWidth(width)
      setIsCollapsed(true)
    }
  }, [isCollapsed, width, lastOpenWidth])

  // Toggle open from collapsed state
  const handleExpandClick = useCallback(() => {
    setIsCollapsed(false)
    setWidth(lastOpenWidth)
  }, [lastOpenWidth])

  return (
    <div className="flex h-full">
      {/* Drag Handle */}
      <div
        ref={handleRef}
        onMouseDown={handleMouseDown}
        onDoubleClick={handleDoubleClick}
        className={`
          group relative flex-shrink-0 w-4 cursor-col-resize
          flex items-center justify-center
          transition-all duration-200 rounded-lg mx-1
          ${isDragging 
            ? 'bg-[var(--color-primary)]/30' 
            : 'bg-[var(--color-surface-subtle)] hover:bg-[var(--color-primary)]/20'
          }
        `}
        title={isCollapsed ? 'Drag or click to expand panel' : 'Drag to resize, double-click to collapse'}
      >
        {/* Handle visual indicator - vertical bar */}
        <div 
          className={`
            absolute inset-y-4 left-1/2 -translate-x-1/2 w-1
            rounded-full transition-all duration-200
            ${isDragging 
              ? 'bg-[var(--color-primary)] shadow-[0_0_8px_var(--color-primary)]' 
              : 'bg-[var(--color-border)] group-hover:bg-[var(--color-primary)]'
            }
          `}
        />
        
        {/* Grip dots - always visible for better discoverability */}
        <div 
          className={`
            flex flex-col items-center justify-center gap-1
            transition-all duration-300 z-10
            ${isCollapsed ? 'opacity-100' : 'opacity-60 group-hover:opacity-100'}
          `}
        >
          <div className={`
            flex flex-col gap-1 py-3 px-1 rounded-md
            ${isDragging 
              ? 'bg-[var(--color-primary)]/30' 
              : isCollapsed 
                ? 'bg-[var(--color-primary)]/20' 
                : 'bg-transparent group-hover:bg-[var(--color-primary)]/10'
            }
          `}>
            <div className={`w-1 h-3 rounded-full transition-colors ${
              isDragging
                ? 'bg-[var(--color-primary)]'
                : isCollapsed 
                  ? 'bg-[var(--color-primary)]' 
                  : 'bg-[var(--color-text-muted)] group-hover:bg-[var(--color-primary)]'
            }`} />
            <div className={`w-1 h-3 rounded-full transition-colors ${
              isDragging
                ? 'bg-[var(--color-primary)]'
                : isCollapsed 
                  ? 'bg-[var(--color-primary)]' 
                  : 'bg-[var(--color-text-muted)] group-hover:bg-[var(--color-primary)]'
            }`} />
          </div>
        </div>
      </div>

      {/* Panel Content */}
      <div
        ref={panelRef}
        style={{ 
          width: isCollapsed ? 0 : width,
          minWidth: isCollapsed ? 0 : minWidth,
          maxWidth: maxWidth,
        }}
        className={`
          relative overflow-hidden flex-shrink-0
          transition-all duration-300 ease-out
          ${isDragging ? 'transition-none' : ''}
          ${isCollapsed ? 'opacity-0' : 'opacity-100'}
          ${className}
        `}
      >
        <div 
          className={`
            w-full h-full bg-[var(--color-surface)] backdrop-blur-xl rounded-2xl 
            border border-[var(--color-border-subtle)] 
            shadow-[var(--shadow-strong)] overflow-hidden
            transition-transform duration-300
            ${isCollapsed ? 'translate-x-full' : 'translate-x-0'}
          `}
        >
          {children}
        </div>
      </div>

      {/* Collapsed state expand button overlay */}
      {isCollapsed && (
        <button
          onClick={handleExpandClick}
          className="
            absolute right-0 top-1/2 -translate-y-1/2
            w-6 h-24 rounded-l-lg
            bg-[var(--color-surface)] border border-r-0 border-[var(--color-border-subtle)]
            shadow-[var(--shadow-soft)]
            flex items-center justify-center
            hover:bg-[var(--color-primary)]/10 hover:border-[var(--color-primary)]/50
            transition-all duration-200
            group
          "
          title="Click or drag to expand panel"
        >
          <div className="flex flex-col gap-[3px]">
            <div className="w-0.5 h-3 rounded-full bg-[var(--color-text-muted)] group-hover:bg-[var(--color-primary)] transition-colors" />
            <div className="w-0.5 h-3 rounded-full bg-[var(--color-text-muted)] group-hover:bg-[var(--color-primary)] transition-colors" />
          </div>
        </button>
      )}
    </div>
  )
}

