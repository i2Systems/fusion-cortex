/**
 * Map Data Sync Hook
 * 
 * Fetches map data from DB/IndexedDB and keeps MapStore in sync.
 * Should only be used ONCE in the root application layout (StateHydration).
 */

'use client'

import { useEffect, useCallback, useMemo } from 'react'
import { useSiteStore } from '@/lib/stores/siteStore'
import { useMapStore, MapData } from '@/lib/stores/mapStore'
import { trpc } from '@/lib/trpc/client'
import { loadLocations } from '@/lib/locationStorage'

export function useMapDataSync() {
    const activeSiteId = useSiteStore((s) => s.activeSiteId)

    // Load locations from database via tRPC
    const { data: dbLocationsData, isLoading: dbLocationsLoading } = trpc.location.list.useQuery(
        { siteId: activeSiteId || '' },
        { enabled: !!activeSiteId }
    )

    // Stable reference for dbLocations
    const dbLocations = useMemo(() => dbLocationsData ?? [], [dbLocationsData])

    // Load map data logic - use getState() to avoid subscribing to store (prevents infinite loop)
    const loadMapData = useCallback(async (siteId: string, forceRefresh = false) => {
        if (!siteId || typeof window === 'undefined') return

        const mapStore = useMapStore.getState()
        if (!forceRefresh && mapStore.mapCache[siteId]) {
            return
        }

        mapStore.setMapCache(siteId, {
            mapImageUrl: null,
            vectorData: null,
            mapUploaded: false,
            isLoading: true
        })

        try {
            let locations: any[] = []

            if (dbLocations.length > 0) {
                locations = dbLocations.map(loc => ({
                    id: loc.id,
                    name: loc.name,
                    type: loc.type,
                    parentId: loc.parentId,
                    imageUrl: loc.imageUrl,
                    vectorDataUrl: loc.vectorDataUrl,
                    zoomBounds: loc.zoomBounds,
                }))
            } else {
                // Fallback to localStorage
                locations = await loadLocations(siteId)
            }

            if (locations.length === 0) {
                useMapStore.getState().setMapCache(siteId, {
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
                        useMapStore.getState().setMapCache(siteId, mapData)
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
                            useMapStore.getState().setMapCache(siteId, mapData)
                            return
                        }
                    } catch (e) { console.error(e) }
                } else {
                    // Regular URL
                    mapData.mapImageUrl = location.imageUrl
                    useMapStore.getState().setMapCache(siteId, mapData)
                    return
                }
            }

            // 3. Check vectorDataUrl
            if (location.vectorDataUrl && location.vectorDataUrl.startsWith('data:application/json;base64,')) {
                try {
                    const base64 = location.vectorDataUrl.replace('data:application/json;base64,', '')
                    const json = atob(base64)
                    mapData.vectorData = JSON.parse(json)
                    useMapStore.getState().setMapCache(siteId, mapData)
                    return
                } catch (e) { console.error(e) }
            }

            // 4. Old localStorage fallback
            if (location.vectorData) {
                mapData.vectorData = location.vectorData
                useMapStore.getState().setMapCache(siteId, mapData)
                return
            }

            // Final fallback
            const imageKey = `fusion_map-image-url_${siteId}`
            try {
                const { loadMapImage } = await import('@/lib/indexedDB')
                const imageUrl = await loadMapImage(imageKey)
                if (imageUrl) {
                    mapData.mapImageUrl = imageUrl
                    useMapStore.getState().setMapCache(siteId, mapData)
                    return
                }
            } catch (e) { }

            // If nothing found
            useMapStore.getState().setMapCache(siteId, {
                mapImageUrl: null, vectorData: null, mapUploaded: false, isLoading: false
            })

        } catch (error) {
            console.error('Failed to load map data', error)
            useMapStore.getState().setMapCache(siteId, {
                mapImageUrl: null, vectorData: null, mapUploaded: false, isLoading: false
            })
        }

    }, [dbLocations])

    // Effect to load data
    useEffect(() => {
        if (activeSiteId && !dbLocationsLoading) {
            loadMapData(activeSiteId, true)
        }
    }, [activeSiteId, dbLocations, dbLocationsLoading, loadMapData])

    return { loadMapData }
}
