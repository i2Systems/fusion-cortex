/**
 * Zones Section
 * 
 * Map + multi-select in main area.
 * Right panel: Zone properties (name, color, daylight settings).
 * 
 * AI Note: Zones are the unit of control for BMS + rules.
 * Users can drag-select devices on map to create zones.
 */

'use client'

import { useState, useEffect, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { X } from 'lucide-react'
import { SearchIsland } from '@/components/layout/SearchIsland'
import { MapUpload } from '@/components/map/MapUpload'
import { MapViewsMenu } from '@/components/map/MapViewsMenu'
import { ZonesPanel } from '@/components/zones/ZonesPanel'
import { mockDevices } from '@/lib/mockData'

// Dynamically import MapCanvas to avoid SSR issues with Konva
const MapCanvas = dynamic(() => import('@/components/map/MapCanvas').then(mod => ({ default: mod.MapCanvas })), {
  ssr: false,
  loading: () => (
    <div className="h-full flex items-center justify-center">
      <div className="text-[var(--color-text-muted)]">Loading map...</div>
    </div>
  ),
})

// Mock zone data - in production, this would come from tRPC/API
const mockZones = [
  { id: '1', name: 'Zone 1 - Electronics', deviceCount: 127, description: 'Electronics department, aisles 11-18', colorVar: '--color-primary' },
  { id: '2', name: 'Zone 2 - Clothing', deviceCount: 203, description: 'Apparel section, aisles 23-42', colorVar: '--color-accent' },
  { id: '3', name: 'Zone 3 - Retail', deviceCount: 156, description: 'Toys, Sporting Goods, Home & Garden', colorVar: '--color-success' },
  { id: '4', name: 'Zone 7 - Grocery', deviceCount: 312, description: 'Grocery aisles 13-22, Meat & Seafood, Produce', colorVar: '--color-warning' },
]

export default function ZonesPage() {
  const [selectedZone, setSelectedZone] = useState<string | null>(null)
  const [mapUploaded, setMapUploaded] = useState(false)
  const [mapImageUrl, setMapImageUrl] = useState<string | null>(null)
  const [activeView, setActiveView] = useState<string | null>(null)

  // Load saved map image on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedImageUrl = localStorage.getItem('map-image-url')
      if (savedImageUrl) {
        setMapImageUrl(savedImageUrl)
        setMapUploaded(true)
      }
    }
  }, [])

  const handleMapUpload = (imageUrl: string) => {
    setMapImageUrl(imageUrl)
    setMapUploaded(true)
  }

  const handleClearMap = () => {
    setMapImageUrl(null)
    setMapUploaded(false)
    setSelectedZone(null)
    if (typeof window !== 'undefined') {
      localStorage.removeItem('map-image-url')
    }
  }

  // Get devices for the selected zone, or all devices if no zone selected
  // Make devices more subtle on zones page (smaller, more transparent)
  const zoneDevices = useMemo(() => {
    const devices = selectedZone 
      ? mockDevices.filter(d => d.zone === selectedZone)
      : mockDevices
    
    return devices.map(d => ({
      id: d.id,
      x: d.x || 0,
      y: d.y || 0,
      type: d.type,
      deviceId: d.deviceId,
      status: d.status,
      signal: d.signal,
      location: d.location,
    }))
  }, [selectedZone])

  return (
    <div className="h-full flex flex-col min-h-0 pb-2 overflow-visible">
      {/* Main Content: Map + Zones Panel */}
      <div className="flex-1 flex min-h-0 gap-4 p-4 overflow-visible">
        {/* Map Canvas - Left Side */}
        <div className="flex-1 relative min-w-0 rounded-2xl shadow-[var(--shadow-strong)] border border-[var(--color-border-subtle)]" style={{ overflow: 'visible' }}>
          {/* Map Views Menu - Half on/half off top right of map */}
          {mapUploaded && (
            <div className="absolute top-0 right-4 z-30 pointer-events-none" style={{ transform: 'translateY(-50%)' }}>
              <div className="pointer-events-auto flex items-center gap-2">
                <MapViewsMenu 
                  activeView={activeView as any}
                  onViewChange={(view) => setActiveView(view)}
                  showUpload={false}
                />
                <button
                  onClick={handleClearMap}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-surface)] backdrop-blur-xl border border-[var(--color-border-subtle)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-subtle)] hover:text-[var(--color-danger)] transition-all duration-200 shadow-[var(--shadow-soft)]"
                  title="Clear map and show upload"
                >
                  <X size={18} />
                  <span className="text-sm font-medium">Clear</span>
                </button>
              </div>
            </div>
          )}
          {!mapUploaded ? (
            <MapUpload onMapUpload={handleMapUpload} />
          ) : (
            <div className="w-full h-full rounded-2xl overflow-hidden">
              <MapCanvas 
                onDeviceSelect={setSelectedZone}
                selectedDeviceId={selectedZone}
                mapImageUrl={mapImageUrl}
                devices={zoneDevices}
              />
            </div>
          )}
        </div>

        {/* Zones Panel - Right Side (only show when map is uploaded) */}
        {mapUploaded && (
          <div className="w-96 min-w-[20rem] max-w-[32rem] bg-[var(--color-surface)] backdrop-blur-xl rounded-2xl border border-[var(--color-border-subtle)] flex flex-col shadow-[var(--shadow-strong)] overflow-hidden flex-shrink-0">
            <ZonesPanel
              zones={mockZones}
              selectedZoneId={selectedZone}
              onZoneSelect={setSelectedZone}
            />
          </div>
        )}
      </div>

      {/* Bottom Search Island */}
      <SearchIsland 
        position="bottom" 
        fullWidth={true}
        showActions={mapUploaded}
        title="Zones"
        subtitle="Create and manage control zones for your lighting system"
        placeholder={mapUploaded ? "Search zones or devices..." : "Upload a map to manage zones..."}
      />
    </div>
  )
}

