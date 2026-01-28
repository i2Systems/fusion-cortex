/**
 * Map Sync Hook
 * 
 * Manages loading map data from DB/IndexedDB into the useMapStore.
 * Replicates Logic from MapContext.tsx
 */

'use client'

import { useEffect, useCallback, useMemo, useRef } from 'react'
import { useSiteStore } from '@/lib/stores/siteStore'
import { useMapStore, MapData } from '@/lib/stores/mapStore'
import { trpc } from '@/lib/trpc/client'
import { loadLocations } from '@/lib/locationStorage'

export function useMapSync() {
    const activeSiteId = useSiteStore((s) => s.activeSiteId)
    const zoomTimeoutRef = useRef<NodeJS.Timeout | null>(null)

    // Load locations from database via tRPC
    const { data: dbLocationsData, isLoading: dbLocationsLoading } = trpc.location.list.useQuery(
        { siteId: activeSiteId || '' },
        { enabled: !!activeSiteId }
    )

    // Stable reference for dbLocations
    const dbLocations = useMemo(() => dbLocationsData ?? [], [dbLocationsData])

    // Load map data logic - completely stable, no dependencies that change
    const loadMapData = useCallback(async (siteId: string, forceRefresh = false, locationsData: any[] = []) => {
        if (!siteId || typeof window === 'undefined') return

        const mapStore = useMapStore.getState()

        // Check cache
        if (!forceRefresh && mapStore.mapCache[siteId]) {
            return
        }

        // Set loading state
        mapStore.setMapCache(siteId, {
            mapImageUrl: null,
            vectorData: null,
            mapUploaded: false,
            isLoading: true
        })

        try {
            let locations: any[] = []

            if (locationsData.length > 0) {
                locations = locationsData.map(loc => ({
                    id: loc.id,
                    name: loc.name,
                    type: loc.type,
                    parentId: loc.parentId,
                    imageUrl: loc.imageUrl,
                    vectorDataUrl: loc.vectorDataUrl,
                    zoomBounds: loc.zoomBounds,
                    storageKey: loc.storageKey,
                    vectorData: loc.vectorData,
                }))
            } else {
                // Fallback to localStorage
                locations = await loadLocations(siteId)
            }

            if (locations.length === 0) {
                mapStore.setMapCache(siteId, {
                    mapImageUrl: null, vectorData: null, mapUploaded: false, isLoading: false
                })
                return
            }

            const location = locations[0]
            let mapData: MapData = {
                mapImageUrl: null, vectorData: null, mapUploaded: true, isLoading: false
            }

            // 1. Check IndexedDB storageKey
            if (location.storageKey) {
                try {
                    const { getVectorData } = await import('@/lib/indexedDB')
                    const stored = await getVectorData(siteId, location.storageKey)
                    if (stored) {
                        const typedStored = stored as any
                        mapData = {
                            mapImageUrl: typedStored.data || null,
                            vectorData: (typedStored.paths || typedStored.texts) ? typedStored : null,
                            mapUploaded: true,
                            isLoading: false
                        }
                        mapStore.setMapCache(siteId, mapData)
                        return
                    }
                } catch (e) { console.error(e) }
            }

            // 2. Check imageUrl (could be indexeddb: prefix)
            if (location.imageUrl) {
                if (location.imageUrl.startsWith('indexeddb:')) {
                    try {
                        const { getImageDataUrl } = await import('@/lib/indexedDB')
                        const imageId = location.imageUrl.replace('indexeddb:', '')
                        const dataUrl = await getImageDataUrl(imageId)
                        if (dataUrl) {
                            mapData.mapImageUrl = dataUrl
                            mapStore.setMapCache(siteId, mapData)
                            return
                        }
                    } catch (e) { console.error(e) }
                } else {
                    // Regular URL
                    mapData.mapImageUrl = location.imageUrl
                    mapStore.setMapCache(siteId, mapData)
                    return
                }
            }

            // 3. Check vectorDataUrl
            if (location.vectorDataUrl && location.vectorDataUrl.startsWith('data:application/json;base64,')) {
                try {
                    const base64 = location.vectorDataUrl.replace('data:application/json;base64,', '')
                    const json = atob(base64)
                    mapData.vectorData = JSON.parse(json)
                    mapStore.setMapCache(siteId, mapData)
                    return
                } catch (e) { console.error(e) }
            }

            // 4. Old localStorage fallback
            if (location.vectorData) {
                mapData.vectorData = location.vectorData
                mapStore.setMapCache(siteId, mapData)
                return
            }

            // Final fallback
            const imageKey = `fusion_map-image-url_${siteId}`
            try {
                const { loadMapImage } = await import('@/lib/indexedDB')
                const imageUrl = await loadMapImage(imageKey)
                if (imageUrl) {
                    mapData.mapImageUrl = imageUrl
                    mapStore.setMapCache(siteId, mapData)
                    return
                }
            } catch (e) { }

            // If nothing found
            mapStore.setMapCache(siteId, {
                mapImageUrl: null, vectorData: null, mapUploaded: false, isLoading: false
            })

        } catch (error) {
            console.error('Failed to load map data', error)
            useMapStore.getState().setMapCache(siteId, {
                mapImageUrl: null, vectorData: null, mapUploaded: false, isLoading: false
            })
        }

    }, []) // No dependencies - completely stable

    // Effect to load data - pass dbLocations as parameter
    useEffect(() => {
        if (activeSiteId && !dbLocationsLoading) {
            loadMapData(activeSiteId, true, dbLocations)
        }
    }, [activeSiteId, dbLocations, dbLocationsLoading, loadMapData])

    // Helper Wrappers
    const refreshMapData = useCallback(async () => {
        const currentSiteId = useSiteStore.getState().activeSiteId
        if (currentSiteId) {
            await loadMapData(currentSiteId, true, [])
        }
    }, [loadMapData])

    const triggerZoomIndicator = useCallback(() => {
        const mapStore = useMapStore.getState()
        mapStore.setIsZooming(true)
        if (zoomTimeoutRef.current) clearTimeout(zoomTimeoutRef.current)
        zoomTimeoutRef.current = setTimeout(() => {
            useMapStore.getState().setIsZooming(false)
        }, 2000)
    }, [])

    return {
        refreshMapData,
        triggerZoomIndicator
    }
}
