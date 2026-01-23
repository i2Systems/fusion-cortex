/**
 * useFocusTrap Hook
 * 
 * Custom hook for trapping focus within a modal/dialog.
 * Ensures keyboard navigation stays within the modal and manages focus on open/close.
 * 
 * Features:
 * - Traps Tab/Shift+Tab navigation within the modal
 * - Moves focus to first focusable element on open
 * - Returns focus to trigger element on close
 * - Handles Escape key (caller should handle this separately)
 */

import { useEffect, useRef, RefObject } from 'react'

interface UseFocusTrapOptions {
  /** Whether the modal is open */
  isOpen: boolean
  /** Callback when modal closes (for restoring focus) */
  onClose: () => void
  /** Optional ref to the trigger element that opened the modal */
  triggerRef?: RefObject<HTMLElement>
  /** Optional ref to the modal container (auto-detected if not provided) */
  containerRef?: RefObject<HTMLElement>
  /** Whether to enable focus trapping (default: true) */
  enabled?: boolean
}

/**
 * Get all focusable elements within a container
 */
function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const selector = [
    'a[href]',
    'button:not([disabled])',
    'textarea:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(', ')

  return Array.from(container.querySelectorAll<HTMLElement>(selector)).filter(
    (el) => {
      // Filter out hidden elements
      const style = window.getComputedStyle(el)
      return style.display !== 'none' && style.visibility !== 'hidden'
    }
  )
}

export function useFocusTrap({
  isOpen,
  onClose,
  triggerRef,
  containerRef,
  enabled = true,
}: UseFocusTrapOptions) {
  const containerElementRef = useRef<HTMLElement | null>(null)
  const previousActiveElementRef = useRef<HTMLElement | null>(null)

  // Get the container element (either from ref or find it)
  // This runs continuously to catch ref updates
  useEffect(() => {
    if (containerRef?.current) {
      containerElementRef.current = containerRef.current
      
      // If modal is open and we just got the container, try to focus immediately
      if (isOpen && enabled && document.body.contains(containerRef.current)) {
        const container = containerRef.current
        const focusableElements = getFocusableElements(container)
        const firstElement = focusableElements[0]
        
        if (firstElement) {
          // Use requestAnimationFrame to ensure element is ready
          requestAnimationFrame(() => {
            try {
              firstElement.focus({ preventScroll: true })
            } catch (e) {
              firstElement.focus()
            }
          })
        } else if (container.hasAttribute('tabindex')) {
          requestAnimationFrame(() => {
            try {
              container.focus({ preventScroll: true })
            } catch (e) {
              container.focus()
            }
          })
        }
      }
    }
  }, [containerRef?.current, isOpen, enabled])

  // Focus management: move focus to modal on open, restore on close
  useEffect(() => {
    if (!isOpen || !enabled) return

    // Capture the active element IMMEDIATELY when modal opens (before any DOM changes)
    // This must happen synchronously to catch the element that triggered the modal
    if (!previousActiveElementRef.current) {
      previousActiveElementRef.current = (document.activeElement as HTMLElement) || null
    }

    // Function to find and focus the modal
    const focusModal = (retryCount = 0) => {
      // Try containerRef first (most reliable)
      let container = containerRef?.current
      
      // If not found, try the stored ref
      if (!container) {
        container = containerElementRef.current
      }
      
      // If still not found, search for it (for portals that render asynchronously)
      if (!container) {
        const dialog = document.querySelector<HTMLElement>('[role="dialog"]')
        if (dialog) {
          container = dialog
          containerElementRef.current = dialog
        }
      }

      if (!container) {
        // Retry up to 10 times with increasing delays (for slow portals/animations)
        if (retryCount < 10) {
          setTimeout(() => focusModal(retryCount + 1), 30 * (retryCount + 1))
        }
        return
      }

      // Verify the container is actually in the DOM
      if (!document.body.contains(container)) {
        // Element not in DOM yet, retry
        if (retryCount < 10) {
          setTimeout(() => focusModal(retryCount + 1), 30 * (retryCount + 1))
        }
        return
      }

      // Ensure container can receive focus if needed
      if (!container.hasAttribute('tabindex')) {
        container.setAttribute('tabindex', '-1')
      }

      const focusableElements = getFocusableElements(container)
      const firstElement = focusableElements[0]

      if (firstElement) {
        // Use requestAnimationFrame to ensure element is ready
        requestAnimationFrame(() => {
          try {
            firstElement.focus({ preventScroll: true })
          } catch (e) {
            // Fallback if preventScroll is not supported
            firstElement.focus()
          }
        })
      } else {
        // If no focusable elements, focus the container itself
        requestAnimationFrame(() => {
          try {
            container!.focus({ preventScroll: true })
          } catch (e) {
            container!.focus()
          }
        })
      }
    }

    // Start focusing - use multiple strategies to catch the modal
    // Strategy 1: Immediate synchronous check (for non-portal modals that are already rendered)
    const container = containerRef?.current || containerElementRef.current
    if (container && document.body.contains(container)) {
      // Container is already available, focus immediately
      const focusableElements = getFocusableElements(container)
      const firstElement = focusableElements[0]
      if (firstElement) {
        try {
          firstElement.focus({ preventScroll: true })
        } catch (e) {
          firstElement.focus()
        }
      } else if (container.hasAttribute('tabindex')) {
        try {
          container.focus({ preventScroll: true })
        } catch (e) {
          container.focus()
        }
      }
    }
    
    // Strategy 2: Retry with delays (for portals/async rendering)
    const immediateCheck = setTimeout(() => focusModal(), 0)
    
    // Strategy 3: After animation frame (for portals with animations)
    requestAnimationFrame(() => {
      setTimeout(() => focusModal(), 50)
    })

    return () => {
      clearTimeout(immediateCheck)
    }
  }, [isOpen, enabled, containerRef])

  // Reset previous active element when modal closes
  useEffect(() => {
    if (isOpen) return // Don't reset while open
    
    // Restore focus to trigger element or previously focused element
    const restoreFocus = () => {
      const trigger = triggerRef?.current
      const previous = previousActiveElementRef.current

      if (trigger && document.contains(trigger)) {
        trigger.focus()
      } else if (previous && document.contains(previous)) {
        previous.focus()
      }
      
      // Clear the stored element after restoring
      previousActiveElementRef.current = null
    }

    // Small delay to ensure modal is fully closed
    const timeoutId = setTimeout(restoreFocus, 0)
    return () => clearTimeout(timeoutId)
  }, [isOpen, enabled, triggerRef])

  // Trap focus within the modal
  useEffect(() => {
    if (!isOpen || !enabled) return

    // Get the current container (check ref first, then stored ref)
    const container = containerRef?.current || containerElementRef.current
    if (!container || !document.body.contains(container)) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle Tab key
      if (e.key !== 'Tab') return

      const focusableElements = getFocusableElements(container)
      if (focusableElements.length === 0) return

      const firstElement = focusableElements[0]
      const lastElement = focusableElements[focusableElements.length - 1]
      const activeElement = document.activeElement as HTMLElement

      // Check if focus is within the modal
      if (!container.contains(activeElement)) {
        // Focus escaped, bring it back
        e.preventDefault()
        firstElement.focus()
        return
      }

      // Handle Tab navigation
      if (e.shiftKey) {
        // Shift+Tab: going backwards
        if (activeElement === firstElement) {
          e.preventDefault()
          lastElement.focus()
        }
      } else {
        // Tab: going forwards
        if (activeElement === lastElement) {
          e.preventDefault()
          firstElement.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, enabled])

  return containerElementRef
}
