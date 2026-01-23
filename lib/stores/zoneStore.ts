/**
 * Zone Store (Zustand)
 * 
 * Replaces ZoneContext with a Zustand store.
 * Zones are polygons on the map containing devices.
 * 
 * AI Note: tRPC mutations are handled via useZoneSync hook.
 */

import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

export interface Zone {
    id: string
    name: string
    color: string
    description?: string
    polygon: Array<{ x: number; y: number }>
    deviceIds: string[]
    createdAt: Date
    updatedAt: Date
}

interface ZoneState {
    zones: Zone[]

    // Actions
    setZones: (zones: Zone[]) => void
    addZone: (zone: Zone) => void
    updateZone: (zoneId: string, updates: Partial<Zone>) => void
    removeZone: (zoneId: string) => void
}

export const useZoneStore = create<ZoneState>()(
    immer((set) => ({
        zones: [],

        setZones: (zones) =>
            set((state) => {
                state.zones = zones
            }),

        addZone: (zone) =>
            set((state) => {
                state.zones.push(zone)
            }),

        updateZone: (zoneId, updates) =>
            set((state) => {
                const index = state.zones.findIndex((z) => z.id === zoneId)
                if (index >= 0) {
                    state.zones[index] = { ...state.zones[index], ...updates, updatedAt: new Date() }
                }
            }),

        removeZone: (zoneId) =>
            set((state) => {
                state.zones = state.zones.filter((z) => z.id !== zoneId)
            }),
    }))
)

// Helper function to check if a point is inside a polygon (ray casting)
export function pointInPolygon(
    point: { x: number; y: number },
    polygon: Array<{ x: number; y: number }>
): boolean {
    let inside = false
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i].x
        const yi = polygon[i].y
        const xj = polygon[j].x
        const yj = polygon[j].y

        const intersect =
            yi > point.y !== yj > point.y && point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi
        if (intersect) inside = !inside
    }
    return inside
}

// Convenience selectors
export const useZones = () => useZoneStore((s) => s.zones)
