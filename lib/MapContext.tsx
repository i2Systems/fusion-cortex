/**
 * Map Context (Compatibility Layer)
 * 
 * Maps the old MapContext API to the new Zustand store.
 * New code should use `useMapStore` or `useMapSync` directly.
 * 
 * @deprecated Use `lib/stores/mapStore.ts` and `lib/stores/useMapSync.ts`
 */

'use client'

import { ReactNode } from 'react'
import { useMapStore, MapData } from '@/lib/stores/mapStore'
import { useMapSync } from '@/lib/stores/useMapSync'
import { useSiteStore } from '@/lib/stores/siteStore'

/**
 * MapProvider
 * 
 * @deprecated logic moved to StateHydration.
 */
export function MapProvider({ children }: { children: ReactNode }) {
  return <>{children}</>
}

/**
 * useMap
 * 
 * Returns map state from Zustand and actions from sync hook.
 */
export function useMap() {
  const store = useMapStore()
  const sync = useMapSync()
  const activeSiteId = useSiteStore((s) => s.activeSiteId)

  // Construct helper mapData object to match old API
  let mapData: MapData = {
    mapImageUrl: null,
    vectorData: null,
    mapUploaded: false,
    isLoading: false
  }

  if (activeSiteId && store.mapCache[activeSiteId]) {
    mapData = store.mapCache[activeSiteId]
  }

  return {
    mapData,
    refreshMapData: sync.refreshMapData,
    clearMapCache: store.clearMapCache,
    // Zoom state
    zoomLevel: store.zoomLevel,
    isZooming: store.isZooming,
    setZoomLevel: store.setZoomLevel,
    triggerZoomIndicator: sync.triggerZoomIndicator,
    interactionHint: store.interactionHint,
    setInteractionHint: store.setInteractionHint,
    modeHint: store.modeHint,
    setModeHint: store.setModeHint,
  }
}

/**
 * @deprecated Use useMap() instead. This is for backward compatibility with ZoomContext.
 */
export function useZoomContext() {
  const store = useMapStore()
  const sync = useMapSync()

  return {
    zoomLevel: store.zoomLevel,
    isZooming: store.isZooming,
    setZoomLevel: store.setZoomLevel,
    triggerZoomIndicator: sync.triggerZoomIndicator,
    interactionHint: store.interactionHint,
    setInteractionHint: store.setInteractionHint,
    modeHint: store.modeHint,
    setModeHint: store.setModeHint,
  }
}
