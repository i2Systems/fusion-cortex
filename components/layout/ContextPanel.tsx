/**
 * Context Panel Component
 * 
 * Right-side slide-in panel for contextual content:
 * - Selected device details
 * - Zone details
 * - Rule details
 * - BACnet mapping help
 * 
 * AI Note: This panel should be controlled by parent components
 * via context or state management. Use smooth transitions.
 */

'use client'

import { X } from 'lucide-react'
import { useState } from 'react'

interface ContextPanelProps {
  isOpen?: boolean
  onClose?: () => void
  title?: string
  children?: React.ReactNode
}

export function ContextPanel({ 
  isOpen = false, 
  onClose,
  title = 'Details',
  children 
}: ContextPanelProps) {
  // For now, this is a controlled component
  // In production, this would be managed by a context provider or state management

  if (!isOpen) return null

  return (
    <>
      {/* Mobile/Tablet Backdrop */}
      <div
        className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-[calc(var(--z-panel)-1)]"
        onClick={onClose}
      />
      <div
        className="w-full md:w-96 max-w-md md:max-w-none fixed md:relative right-0 top-0 h-full md:h-auto bg-[var(--color-surface)] backdrop-blur-xl border-l border-[var(--color-border-subtle)] flex flex-col shadow-[var(--shadow-strong)]"
        style={{ 
          zIndex: 'var(--z-panel)',
          animation: 'slideInRight 0.3s ease-out'
        }}
      >
      {/* Panel Header */}
      <div className="h-14 md:h-16 border-b border-[var(--color-border-subtle)] flex items-center justify-between px-4 md:px-6">
        <h2 className="text-base md:text-lg font-semibold text-[var(--color-text)]">
          {title}
        </h2>
        {onClose && (
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-[var(--color-surface-subtle)] transition-colors text-[var(--color-text-muted)]"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Panel Content */}
      <div className="flex-1 overflow-auto p-4 md:p-6">
        {children || (
          <div className="text-[var(--color-text-muted)] text-sm">
            No details available
          </div>
        )}
      </div>
    </div>
    </>
  )
}

// Add slide-in animation
if (typeof document !== 'undefined') {
  const style = document.createElement('style')
  style.textContent = `
    @keyframes slideInRight {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
  `
  document.head.appendChild(style)
}

