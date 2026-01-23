/**
 * Canvas Colors Utility
 * 
 * Provides utilities to read CSS custom properties for canvas rendering.
 * Ensures all canvas components use design tokens instead of hardcoded colors.
 */

/**
 * Get a CSS custom property value, with optional fallback
 */
export function getCSSVariable(property: string, fallback?: string): string {
  if (typeof window === 'undefined') {
    return fallback || ''
  }
  
  const root = document.documentElement
  const computedStyle = getComputedStyle(root)
  const value = computedStyle.getPropertyValue(property).trim()
  
  return value || fallback || ''
}

/**
 * Get a color value from CSS custom property, converting hex to rgba if needed
 */
export function getColorVariable(property: string, fallback?: string): string {
  const value = getCSSVariable(property, fallback)
  
  // If it's already rgba/rgb/hex, return as-is
  if (value.startsWith('rgba') || value.startsWith('rgb') || value.startsWith('#')) {
    return value
  }
  
  // If it's a CSS variable reference, resolve it
  if (value.startsWith('var(')) {
    // Extract the variable name and resolve recursively
    const match = value.match(/var\(--([^)]+)\)/)
    if (match) {
      return getColorVariable(`--${match[1]}`, fallback)
    }
  }
  
  return value
}

/**
 * Canvas color palette interface
 */
export interface CanvasColors {
  primary: string
  fixture?: string
  accent: string
  success: string
  warning?: string
  danger?: string
  muted: string
  text: string
  border: string
  tooltipBg: string
  tooltipBorder: string
  tooltipText: string
  tooltipShadow: string
  selectionFill?: string
  selectionStroke?: string
  selectionShadow?: string
}

/**
 * Get all canvas colors from CSS custom properties
 * This function reads computed styles and returns a complete color palette
 */
export function getCanvasColors(): CanvasColors {
  const root = document.documentElement
  const computedStyle = getComputedStyle(root)
  
  // Helper to get CSS variable with fallback
  const getVar = (prop: string, fallback: string) => {
    const value = computedStyle.getPropertyValue(prop).trim()
    return value || fallback
  }
  
  return {
    primary: getVar('--color-primary', '#4c7dff'),
    fixture: getVar('--color-fixture', getVar('--color-primary', '#3b5998')),
    accent: getVar('--color-accent', '#f97316'),
    success: getVar('--color-success', '#22c55e'),
    warning: getVar('--color-warning', '#ffcc00'),
    danger: getVar('--color-danger', '#ef4444'),
    muted: getVar('--color-text-muted', '#9ca3af'),
    text: getVar('--color-text', '#ffffff'),
    border: getVar('--color-canvas-border', 'rgba(0, 0, 0, 0.4)'),
    tooltipBg: getVar('--color-tooltip-bg', 'rgba(17, 24, 39, 0.95)'),
    tooltipBorder: getVar('--color-tooltip-border', getVar('--color-primary', '#4c7dff')),
    tooltipText: getVar('--color-tooltip-text', getVar('--color-text', '#ffffff')),
    tooltipShadow: getVar('--color-tooltip-shadow', 'rgba(0, 0, 0, 0.5)'),
    selectionFill: getVar('--color-canvas-selection-fill', 'rgba(76, 125, 255, 0.25)'),
    selectionStroke: getVar('--color-canvas-selection-stroke', 'rgba(76, 125, 255, 1)'),
    selectionShadow: getVar('--color-canvas-selection-shadow', 'rgba(76, 125, 255, 0.9)'),
  }
}

/**
 * Convert hex color to rgba with specified opacity
 */
export function hexToRgba(hex: string, opacity: number): string {
  // Remove # if present
  const cleanHex = hex.replace('#', '')
  
  // Parse RGB values
  const r = parseInt(cleanHex.substring(0, 2), 16)
  const g = parseInt(cleanHex.substring(2, 4), 16)
  const b = parseInt(cleanHex.substring(4, 6), 16)
  
  return `rgba(${r}, ${g}, ${b}, ${opacity})`
}

/**
 * Get rgba color from CSS variable with opacity
 */
export function getRgbaVariable(property: string, opacity: number, fallback?: string): string {
  const color = getColorVariable(property, fallback)
  
  // If already rgba, adjust opacity
  if (color.startsWith('rgba')) {
    const match = color.match(/rgba\((\d+),\s*(\d+),\s*(\d+),/)
    if (match) {
      return `rgba(${match[1]}, ${match[2]}, ${match[3]}, ${opacity})`
    }
  }
  
  // If rgb, convert to rgba
  if (color.startsWith('rgb')) {
    const match = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/)
    if (match) {
      return `rgba(${match[1]}, ${match[2]}, ${match[3]}, ${opacity})`
    }
  }
  
  // If hex, convert to rgba
  if (color.startsWith('#')) {
    return hexToRgba(color, opacity)
  }
  
  // Fallback: try to use the color as-is, or return fallback
  return fallback || color
}
