/**
 * useMap Hook
 * 
 * Consumer hook for Map state and data using Zustand.
 * Replaces MapContext/ZoomContext.
 */

'use client'

import { useCallback, useRef } from 'react'
import { useMapStore, MapData } from '@/lib/stores/mapStore'
import { useSiteStore } from '@/lib/stores/siteStore'
import { useMapDataSync } from './useMapDataSync' // Only importing for type or if actions needed

export function useMap() {
    const store = useMapStore()
    const activeSiteId = useSiteStore((s) => s.activeSiteId)
    const { loadMapData } = useMapDataSync() // We can reuse the loader logic if force refresh needed

    const zoomTimeoutRef = useRef<NodeJS.Timeout | null>(null)

    // Construct current map data
    let mapData: MapData = {
        mapImageUrl: null,
        vectorData: null,
        mapUploaded: false,
        isLoading: false
    }

    if (activeSiteId && store.mapCache[activeSiteId]) {
        mapData = store.mapCache[activeSiteId]
    }

    const refreshMapData = useCallback(async () => {
        if (activeSiteId) {
            await loadMapData(activeSiteId, true)
        }
    }, [activeSiteId, loadMapData])

    const triggerZoomIndicator = useCallback(() => {
        store.setIsZooming(true)
        if (zoomTimeoutRef.current) clearTimeout(zoomTimeoutRef.current)
        zoomTimeoutRef.current = setTimeout(() => {
            store.setIsZooming(false)
        }, 2000)
    }, [store])

    return {
        mapData,
        refreshMapData,
        clearMapCache: store.clearMapCache,
        // Zoom state
        zoomLevel: store.zoomLevel,
        isZooming: store.isZooming,
        setZoomLevel: store.setZoomLevel,
        triggerZoomIndicator,
        interactionHint: store.interactionHint,
        setInteractionHint: store.setInteractionHint,
        modeHint: store.modeHint,
        setModeHint: store.setModeHint,
    }
}

/**
 * Zoom-only hook for components that only need zoom state.
 * Replaces useZoomContext from deprecated MapContext.
 */
export function useZoomContext() {
    const store = useMapStore()
    const { loadMapData } = useMapDataSync()
    const activeSiteId = useSiteStore((s) => s.activeSiteId)
    const zoomTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    const triggerZoomIndicator = useCallback(() => {
        store.setIsZooming(true)
        if (zoomTimeoutRef.current) clearTimeout(zoomTimeoutRef.current)
        zoomTimeoutRef.current = setTimeout(() => store.setIsZooming(false), 2000)
    }, [store])
    return {
        zoomLevel: store.zoomLevel,
        isZooming: store.isZooming,
        setZoomLevel: store.setZoomLevel,
        triggerZoomIndicator,
        interactionHint: store.interactionHint,
        setInteractionHint: store.setInteractionHint,
        modeHint: store.modeHint,
        setModeHint: store.setModeHint,
    }
}
