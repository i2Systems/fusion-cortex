/**
 * Map Store
 * 
 * Zustand store for managing map state and data.
 * Replaces MapContext.
 */

import { create } from 'zustand'
import { ExtractedVectorData } from '@/lib/pdfVectorExtractor'

export interface MapData {
    mapImageUrl: string | null
    vectorData: ExtractedVectorData | null
    mapUploaded: boolean
    isLoading: boolean
}

// Zoom state (from MapContext/ZoomContext)
interface ZoomState {
    zoomLevel: number
    isZooming: boolean
    interactionHint: string | null
    modeHint: string | null
}

interface MapStoreState extends ZoomState {
    // Map Data
    mapCache: Record<string, MapData> // Keyed by siteId

    // Actions
    setMapCache: (siteId: string, data: MapData) => void
    clearMapCache: () => void

    // Zoom Actions
    setZoomLevel: (level: number) => void
    setIsZooming: (isZooming: boolean) => void
    setInteractionHint: (hint: string | null) => void
    setModeHint: (hint: string | null) => void
}

export const useMapStore = create<MapStoreState>()((set, get) => ({
    // Default State
    mapCache: {},
    zoomLevel: 100,
    isZooming: false,
    interactionHint: null,
    modeHint: null,

    // Actions - plain Zustand (no immer) to avoid compatibility issues
    setMapCache: (siteId, data) => {
        const prev = get().mapCache ?? {}
        set({ mapCache: { ...prev, [siteId]: data } })
    },

    clearMapCache: () => set({ mapCache: {} }),

    setZoomLevel: (level) => set({ zoomLevel: Math.round(level * 100) }),

    setIsZooming: (isZooming) => set({ isZooming }),

    setInteractionHint: (interactionHint) => set({ interactionHint }),

    setModeHint: (modeHint) => set({ modeHint }),
}))
