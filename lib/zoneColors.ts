/**
 * Zone Color System
 *
 * Semantic zone colors that adapt to the active theme.
 * Zones can use either:
 * - Semantic keys (e.g. "zone-primary") — resolve to theme tokens
 * - Custom hex (e.g. "#4c7dff") — user-defined, stored as-is
 *
 * AI Note: Use resolveZoneColor() when you need a hex value (e.g. for canvas/Konva).
 * Use getZoneColorOptions() for the color picker UI.
 */

import { getColorVariable } from './canvasColors'

/** Semantic zone color options — use theme zone palette when defined, else fallback to base tokens */
export const ZONE_SEMANTIC_OPTIONS = [
  { id: 'zone-primary', label: 'Primary', cssVar: '--color-zone-primary', fallbackVar: '--color-primary' },
  { id: 'zone-accent', label: 'Accent', cssVar: '--color-zone-accent', fallbackVar: '--color-accent' },
  { id: 'zone-success', label: 'Success', cssVar: '--color-zone-success', fallbackVar: '--color-success' },
  { id: 'zone-warning', label: 'Warning', cssVar: '--color-zone-warning', fallbackVar: '--color-warning' },
  { id: 'zone-danger', label: 'Danger', cssVar: '--color-zone-danger', fallbackVar: '--color-danger' },
  { id: 'zone-info', label: 'Info', cssVar: '--color-zone-info', fallbackVar: '--color-info' },
] as const

export type ZoneSemanticId = (typeof ZONE_SEMANTIC_OPTIONS)[number]['id']

/** Default semantic color (first in palette) */
export const DEFAULT_ZONE_COLOR = ZONE_SEMANTIC_OPTIONS[0].id

/** Check if a color value is a semantic key (not hex) */
export function isSemanticZoneColor(color: string): boolean {
  return ZONE_SEMANTIC_OPTIONS.some((opt) => opt.id === color)
}

/**
 * Resolve zone color to hex for rendering (canvas, inline styles).
 * - Semantic keys (zone-primary, etc.) → resolved from theme
 * - Hex values (#xxx) → returned as-is
 */
export function resolveZoneColor(color: string): string {
  if (!color) return getColorVariable('--color-primary', '#4c7dff')

  // Already hex
  if (color.startsWith('#')) return color

  // Semantic key → resolve from theme (zone palette or fallback)
  const option = ZONE_SEMANTIC_OPTIONS.find((opt) => opt.id === color)
  if (option) {
    const zoneColor = getColorVariable(option.cssVar, '')
    const baseColor = getColorVariable(option.fallbackVar, '#4c7dff')
    return zoneColor || baseColor
  }

  // Legacy: might be old hex without # or unknown — treat as primary
  return getColorVariable('--color-primary', '#4c7dff')
}

/**
 * Get zone color options with resolved hex for UI display.
 * Used by color picker swatches.
 */
export function getZoneColorOptions(): Array<{ id: string; label: string; hex: string }> {
  return ZONE_SEMANTIC_OPTIONS.map((opt) => {
    const zoneColor = getColorVariable(opt.cssVar, '')
    const baseColor = getColorVariable(opt.fallbackVar, '#4c7dff')
    return {
      id: opt.id,
      label: opt.label,
      hex: zoneColor || baseColor,
    }
  })
}

/**
 * Get semantic color id for new zone by index (cycles through palette).
 * Use when creating zones programmatically.
 */
export function getZoneColorForIndex(index: number): string {
  return ZONE_SEMANTIC_OPTIONS[index % ZONE_SEMANTIC_OPTIONS.length].id
}
