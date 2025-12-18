/**
 * Location Storage System
 * 
 * Manages multiple locations (floor plans) per store, including:
 * - Base locations (uploaded images/PDFs)
 * - Zoom views (zoomed-in sections of base locations)
 * 
 * AI Note: Locations are stored per store in IndexedDB/localStorage.
 * Zoom views maintain coordinate mapping back to their parent location.
 */

import type { ExtractedVectorData } from './pdfVectorExtractor'

export interface Location {
  id: string
  name: string
  type: 'base' | 'zoom'
  parentLocationId?: string // For zoom views, reference to parent location
  imageUrl?: string | null // For small images only - large base64 strings should use storageKey
  vectorData?: ExtractedVectorData | null // For small vector data only - large data should use storageKey
  storageKey?: string // Key for IndexedDB storage of large image/vector data
  // For zoom views: the bounds of the zoomed area in parent coordinates (0-1 normalized)
  zoomBounds?: {
    minX: number
    minY: number
    maxX: number
    maxY: number
  }
  createdAt: number
  updatedAt: number
}

const LOCATIONS_STORAGE_KEY = 'fusion_locations'

/**
 * Get store-scoped storage key for locations
 */
function getLocationsKey(storeId: string | null): string {
  return storeId ? `${LOCATIONS_STORAGE_KEY}_${storeId}` : LOCATIONS_STORAGE_KEY
}

/**
 * Load all locations for a store
 */
export async function loadLocations(storeId: string | null): Promise<Location[]> {
  if (typeof window === 'undefined') return []
  
  try {
    const key = getLocationsKey(storeId)
    const stored = localStorage.getItem(key)
    if (stored) {
      const locations = JSON.parse(stored) as Location[]
      return locations || []
    }
  } catch (e) {
    console.warn('Failed to load locations:', e)
  }
  
  return []
}

/**
 * Save locations for a store
 * Large image/vector data should be stored separately in IndexedDB
 */
export async function saveLocations(storeId: string | null, locations: Location[]): Promise<void> {
  if (typeof window === 'undefined') return
  
  try {
    const key = getLocationsKey(storeId)
    // Remove large data before saving to localStorage - it should be in IndexedDB
    const locationsToSave = locations.map(loc => {
      const { imageUrl, vectorData, ...rest } = loc
      // Only keep imageUrl if it's small (not a huge base64 string)
      const hasLargeImage = imageUrl && imageUrl.length > 100000 // ~100KB threshold
      const hasLargeVector = vectorData && JSON.stringify(vectorData).length > 100000
      
      return {
        ...rest,
        // Only store small image URLs, large ones should use storageKey
        imageUrl: hasLargeImage ? undefined : imageUrl,
        // Don't store vector data in localStorage - use IndexedDB
        vectorData: undefined,
      }
    })
    
    localStorage.setItem(key, JSON.stringify(locationsToSave))
  } catch (e) {
    console.error('Failed to save locations:', e)
    // Try to save minimal data if storage is full
    try {
      const minimalLocations = locations.map(loc => ({
        id: loc.id,
        name: loc.name,
        type: loc.type,
        parentLocationId: loc.parentLocationId,
        storageKey: loc.storageKey,
        zoomBounds: loc.zoomBounds,
        createdAt: loc.createdAt,
        updatedAt: loc.updatedAt,
      }))
      const key = getLocationsKey(storeId)
      localStorage.setItem(key, JSON.stringify(minimalLocations))
      console.warn('Saved minimal location data due to storage limits')
    } catch (e2) {
      console.error('Failed to save even minimal location data:', e2)
      // Don't throw - allow the app to continue functioning
    }
  }
}

/**
 * Add a new location
 */
export async function addLocation(
  storeId: string | null,
  location: Omit<Location, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Location> {
  const locations = await loadLocations(storeId)
  
  const newLocation: Location = {
    ...location,
    id: `loc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
  
  locations.push(newLocation)
  await saveLocations(storeId, locations)
  
  return newLocation
}

/**
 * Update an existing location
 */
export async function updateLocation(
  storeId: string | null,
  locationId: string,
  updates: Partial<Omit<Location, 'id' | 'createdAt'>>,
): Promise<Location | null> {
  const locations = await loadLocations(storeId)
  const index = locations.findIndex(loc => loc.id === locationId)
  
  if (index === -1) return null
  
  locations[index] = {
    ...locations[index],
    ...updates,
    updatedAt: Date.now(),
  }
  
  await saveLocations(storeId, locations)
  return locations[index]
}

/**
 * Delete a location and all its zoom views
 */
export async function deleteLocation(
  storeId: string | null,
  locationId: string,
): Promise<void> {
  const locations = await loadLocations(storeId)
  
  // Remove the location and all its zoom views
  const filtered = locations.filter(
    loc => loc.id !== locationId && loc.parentLocationId !== locationId
  )
  
  await saveLocations(storeId, filtered)
}

/**
 * Get a location by ID
 */
export async function getLocation(
  storeId: string | null,
  locationId: string,
): Promise<Location | null> {
  const locations = await loadLocations(storeId)
  return locations.find(loc => loc.id === locationId) || null
}

/**
 * Get all zoom views for a parent location
 */
export async function getZoomViews(
  storeId: string | null,
  parentLocationId: string,
): Promise<Location[]> {
  const locations = await loadLocations(storeId)
  return locations.filter(loc => loc.parentLocationId === parentLocationId)
}

/**
 * Convert coordinates from a zoom view back to parent location coordinates
 */
export function convertZoomToParent(
  zoomView: Location,
  x: number,
  y: number,
): { x: number; y: number } {
  if (!zoomView.zoomBounds) {
    // Not a zoom view, return as-is
    return { x, y }
  }
  
  const { minX, minY, maxX, maxY } = zoomView.zoomBounds
  const width = maxX - minX
  const height = maxY - minY
  
  // Convert normalized coordinates (0-1 in zoom view) to parent coordinates
  return {
    x: minX + x * width,
    y: minY + y * height,
  }
}

/**
 * Convert coordinates from parent location to zoom view coordinates
 */
export function convertParentToZoom(
  zoomView: Location,
  x: number,
  y: number,
): { x: number; y: number } | null {
  if (!zoomView.zoomBounds) {
    return null
  }
  
  const { minX, minY, maxX, maxY } = zoomView.zoomBounds
  const width = maxX - minX
  const height = maxY - minY
  
  // Check if point is within zoom bounds
  if (x < minX || x > maxX || y < minY || y > maxY) {
    return null
  }
  
  // Convert parent coordinates to normalized zoom view coordinates (0-1)
  return {
    x: (x - minX) / width,
    y: (y - minY) / height,
  }
}

