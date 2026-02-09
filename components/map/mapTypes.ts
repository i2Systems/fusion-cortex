/**
 * Map Component Types
 * 
 * Shared TypeScript interfaces used across MapCanvas sub-components.
 * Extracted from MapCanvas.tsx for reusability.
 */

import type { Component, DeviceType as DeviceTypeEnum } from '@/lib/mockData'
import type { Location } from '@/lib/locationStorage'

/** Device point for rendering on map canvas */
export interface DevicePoint {
    id: string
    x: number
    y: number
    type: DeviceTypeEnum
    deviceId: string
    status: string
    signal: number
    location?: string
    locked?: boolean
    orientation?: number // Rotation angle in degrees
    components?: Component[]
}

/** Zone boundary for rendering on map canvas */
export interface MapZone {
    id: string
    name: string
    color: string
    polygon: Array<{ x: number; y: number }> // Normalized coordinates (0-1)
}

/** Person point for rendering on map canvas */
export interface PersonPoint {
    id: string
    firstName: string
    lastName: string
    x: number
    y: number
    imageUrl?: string | null
    role?: string | null
    email?: string | null
}

/** Theme colors for canvas rendering */
export interface CanvasColors {
    primary: string
    fixture: string
    accent: string
    success: string
    danger: string
    warning: string
    muted: string
    text: string
    border: string
    tooltipBg: string
    tooltipText: string
    tooltipBorder: string
    tooltipShadow: string
    selectionFill?: string
    selectionStroke?: string
    selectionShadow?: string
}

/** Drag state for device movement */
export interface DraggedDeviceState {
    id: string
    startX: number
    startY: number
    startCanvasX: number
    startCanvasY: number
    dragX?: number
    dragY?: number
}

/** Lasso selection state */
export interface SelectionState {
    isSelecting: boolean
    selectionStart: { x: number; y: number } | null
    selectionEnd: { x: number; y: number } | null
}

/** Image bounds for coordinate conversion */
export interface ImageBounds {
    x: number
    y: number
    width: number
    height: number
    naturalWidth: number
    naturalHeight: number
}

/** Map interaction mode */
export type MapMode = 'select' | 'move' | 'rotate' | 'align-direction' | 'auto-arrange'

/** Props for coordinate conversion functions */
export interface CoordinateConverterProps {
    imageBounds: ImageBounds | null
    dimensions: { width: number; height: number }
    currentLocation?: Location | null
}

/** Common device event handlers */
export interface DeviceEventHandlers {
    onDeviceSelect?: (deviceId: string | null) => void
    onDevicesSelect?: (deviceIds: string[]) => void
    onDeviceMove?: (deviceId: string, x: number, y: number) => void
    onDeviceMoveEnd?: (deviceId: string, x: number, y: number) => void
    onDevicesMoveEnd?: (updates: { deviceId: string; x: number; y: number }[]) => void
    onDeviceRotate?: (deviceId: string) => void
}

/** Common component event handlers */
export interface ComponentEventHandlers {
    onComponentExpand?: (deviceId: string, expanded: boolean) => void
    onComponentClick?: (component: Component, parentDevice: any) => void
}
