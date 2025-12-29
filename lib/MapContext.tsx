/**
 * Map Context
 * 
 * Provides cached map data (images and vector data) across all pages.
 * Prevents reloading the same map data when switching between pages.
 * 
 * AI Note: This context caches map data in memory per site, so switching
 * pages doesn't require re-fetching from IndexedDB.
 */

'use client'

import { createContext, useContext, ReactNode, useState, useEffect, useCallback, useMemo } from 'react'
import { useSite } from './SiteContext'
import { loadLocations } from './locationStorage'
import type { ExtractedVectorData } from './pdfVectorExtractor'

interface MapData {
  mapImageUrl: string | null
  vectorData: ExtractedVectorData | null
  mapUploaded: boolean
  isLoading: boolean
}

interface MapContextType {
  mapData: MapData
  refreshMapData: () => Promise<void>
  clearMapCache: () => void
}

const MapContext = createContext<MapContextType | undefined>(undefined)

export function MapProvider({ children }: { children: ReactNode }) {
  const { activeSiteId } = useSite()
  const [mapCache, setMapCache] = useState<Record<string, MapData>>({})
  const [isLoading, setIsLoading] = useState(false)

  // Load map data for current site
  const loadMapData = useCallback(async (siteId: string | null, forceRefresh = false) => {
    if (!siteId || typeof window === 'undefined') {
      return {
        mapImageUrl: null,
        vectorData: null,
        mapUploaded: false,
        isLoading: false,
      }
    }

    // Check cache first (unless forcing refresh)
    if (!forceRefresh && mapCache[siteId]) {
      return mapCache[siteId]
    }

    setIsLoading(true)
    
    try {
      // Load locations from shared storage
      const locations = await loadLocations(siteId)
      if (locations.length === 0) {
        const emptyData: MapData = {
          mapImageUrl: null,
          vectorData: null,
          mapUploaded: false,
          isLoading: false,
        }
        setMapCache(prev => ({ ...prev, [siteId]: emptyData }))
        setIsLoading(false)
        return emptyData
      }

      // Use first location
      const location = locations[0]

      // Load data from IndexedDB if storageKey exists
      if (location.storageKey && siteId) {
        try {
          const { getVectorData } = await import('@/lib/indexedDB')
          const stored = await getVectorData(siteId, location.storageKey)
          if (stored) {
            const mapData: MapData = {
              mapImageUrl: stored.data || null,
              vectorData: (stored.paths || stored.texts) ? stored : null,
              mapUploaded: true,
              isLoading: false,
            }
            setMapCache(prev => ({ ...prev, [siteId]: mapData }))
            setIsLoading(false)
            return mapData
          } else {
            console.warn(`No data found in IndexedDB for site ${siteId}, key ${location.storageKey}`)
          }
        } catch (e) {
          console.error('Failed to load location data from IndexedDB:', e)
          // Continue to fallback options
        }
      }

      // Fallback to direct data from location
      if (location.imageUrl) {
        // Check if it's an IndexedDB reference
        if (location.imageUrl.startsWith('indexeddb:') && siteId) {
          try {
            const { getImageDataUrl } = await import('@/lib/indexedDB')
            const imageId = location.imageUrl.replace('indexeddb:', '')
            const dataUrl = await getImageDataUrl(imageId)
            if (dataUrl) {
              const mapData: MapData = {
                mapImageUrl: dataUrl,
                vectorData: null,
                mapUploaded: true,
                isLoading: false,
              }
              setMapCache(prev => ({ ...prev, [siteId]: mapData }))
              setIsLoading(false)
              return mapData
            } else {
              console.warn(`Failed to load image from IndexedDB, imageId: ${imageId}`)
            }
          } catch (e) {
            console.error('Failed to load image from IndexedDB:', e)
            // Continue to fallback
          }
        } else {
          const mapData: MapData = {
            mapImageUrl: location.imageUrl,
            vectorData: null,
            mapUploaded: true,
            isLoading: false,
          }
          setMapCache(prev => ({ ...prev, [siteId]: mapData }))
          setIsLoading(false)
          return mapData
        }
      }

      if (location.vectorData) {
        const mapData: MapData = {
          mapImageUrl: null,
          vectorData: location.vectorData,
          mapUploaded: true,
          isLoading: false,
        }
        setMapCache(prev => ({ ...prev, [siteId]: mapData }))
        setIsLoading(false)
        return mapData
      }

      // Check for old localStorage format (backward compatibility)
      const imageKey = `fusion_map-image-url_${siteId}`
      try {
        const { loadMapImage } = await import('@/lib/indexedDB')
        const imageUrl = await loadMapImage(imageKey)
        if (imageUrl) {
          const mapData: MapData = {
            mapImageUrl: imageUrl,
            vectorData: null,
            mapUploaded: true,
            isLoading: false,
          }
          setMapCache(prev => ({ ...prev, [siteId]: mapData }))
          setIsLoading(false)
          return mapData
        }
      } catch (e) {
        console.warn('Failed to load map from old storage:', e)
      }

      // No map data found
      const emptyData: MapData = {
        mapImageUrl: null,
        vectorData: null,
        mapUploaded: false,
        isLoading: false,
      }
      setMapCache(prev => ({ ...prev, [siteId]: emptyData }))
      setIsLoading(false)
      return emptyData
    } catch (error) {
      console.error('Failed to load map data:', error)
      const errorData: MapData = {
        mapImageUrl: null,
        vectorData: null,
        mapUploaded: false,
        isLoading: false,
      }
      setMapCache(prev => ({ ...prev, [siteId]: errorData }))
      setIsLoading(false)
      return errorData
    }
  }, [])

  // Load map data when site changes
  useEffect(() => {
    if (activeSiteId) {
      // Only load if not already cached
      if (!mapCache[activeSiteId]) {
        loadMapData(activeSiteId, false)
      }
    }
  }, [activeSiteId, loadMapData])

  // Get current map data
  const mapData = useMemo(() => {
    if (!activeSiteId) {
      return {
        mapImageUrl: null,
        vectorData: null,
        mapUploaded: false,
        isLoading: false,
      }
    }
    
    const cached = mapCache[activeSiteId]
    if (cached) {
      return { ...cached, isLoading }
    }
    
    return {
      mapImageUrl: null,
      vectorData: null,
      mapUploaded: false,
      isLoading,
    }
  }, [activeSiteId, mapCache, isLoading])

  // Refresh map data (force reload)
  const refreshMapData = useCallback(async () => {
    if (activeSiteId) {
      setIsLoading(true)
      // Force reload (bypasses cache)
      await loadMapData(activeSiteId, true)
    }
  }, [activeSiteId, loadMapData])

  // Clear all map cache
  const clearMapCache = useCallback(() => {
    setMapCache({})
  }, [])

  return (
    <MapContext.Provider value={{
      mapData,
      refreshMapData,
      clearMapCache,
    }}>
      {children}
    </MapContext.Provider>
  )
}

export function useMap() {
  const context = useContext(MapContext)
  if (context === undefined) {
    throw new Error('useMap must be used within a MapProvider')
  }
  return context
}

