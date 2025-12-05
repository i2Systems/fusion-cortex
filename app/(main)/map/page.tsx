/**
 * Map & Devices Section
 * 
 * Main area: Map (point cloud over blueprint) using react-konva
 * Right panel: Selected device details
 * Bottom drawer: Filters, layer toggles
 * 
 * AI Note: This section uses react-konva for canvas-based rendering.
 * Device points should be color-coded by type (fixtures, motion, light sensors).
 * Search island is positioned at the bottom.
 */

'use client'

import { useState, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import { X } from 'lucide-react'
import { SearchIsland } from '@/components/layout/SearchIsland'
import { DeviceTable } from '@/components/map/DeviceTable'
import { MapUpload } from '@/components/map/MapUpload'
import { MapViewsMenu } from '@/components/map/MapViewsMenu'

// Dynamically import MapCanvas to avoid SSR issues with Konva
const MapCanvas = dynamic(() => import('@/components/map/MapCanvas').then(mod => ({ default: mod.MapCanvas })), {
  ssr: false,
  loading: () => (
    <div className="h-full flex items-center justify-center">
      <div className="text-[var(--color-text-muted)]">Loading map...</div>
    </div>
  ),
})

import { mockDevices } from '@/lib/mockData'

export default function MapPage() {
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null)
  const [mapUploaded, setMapUploaded] = useState(false)
  const [mapImageUrl, setMapImageUrl] = useState<string | null>(null)
  const [activeView, setActiveView] = useState<string | null>(null)
  const uploadInputRef = useRef<HTMLInputElement>(null)

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
    setSelectedDevice(null)
    if (typeof window !== 'undefined') {
      localStorage.removeItem('map-image-url')
    }
    // Reset file input if it exists
    if (uploadInputRef.current) {
      uploadInputRef.current.value = ''
    }
  }

  return (
    <div className="h-full flex flex-col min-h-0 pb-2 overflow-visible">
      {/* Main Content: Map + Table Panel */}
      <div className="flex-1 flex min-h-0 gap-4 p-4 overflow-visible">
        {/* Map Canvas - Left Side */}
        <div className="flex-1 relative min-w-0" style={{ overflow: 'visible' }}>
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
          {/* Hidden file input for upload button in menu */}
          {!mapUploaded && (
            <input
              ref={uploadInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/svg+xml,application/pdf"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) {
                  const reader = new FileReader()
                  reader.onloadend = () => {
                    const base64String = reader.result as string
                    localStorage.setItem('map-image-url', base64String)
                    handleMapUpload(base64String)
                    // Reset input after upload
                    if (uploadInputRef.current) {
                      uploadInputRef.current.value = ''
                    }
                  }
                  reader.onerror = () => {
                    alert('Error reading file. Please try again.')
                    if (uploadInputRef.current) {
                      uploadInputRef.current.value = ''
                    }
                  }
                  reader.readAsDataURL(file)
                }
              }}
              className="hidden"
            />
          )}
          {!mapUploaded ? (
            <MapUpload onMapUpload={handleMapUpload} />
          ) : (
            <div className="w-full h-full rounded-2xl shadow-[var(--shadow-strong)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] relative">
              <div className="w-full h-full rounded-2xl overflow-hidden">
                <MapCanvas 
                  onDeviceSelect={setSelectedDevice}
                  selectedDeviceId={selectedDevice}
                  mapImageUrl={mapImageUrl}
                  highlightDeviceId={selectedDevice}
                  devices={mockDevices.map(d => ({
                    id: d.id,
                    x: d.x || 0,
                    y: d.y || 0,
                    type: d.type,
                    deviceId: d.deviceId,
                    status: d.status,
                    signal: d.signal,
                    location: d.location,
                  }))}
                />
              </div>
            </div>
          )}
        </div>

        {/* Device Table Panel - Right Side (only show when map is uploaded) */}
        {mapUploaded && (
          <div className="w-[28rem] min-w-[20rem] max-w-[32rem] bg-[var(--color-surface)] backdrop-blur-xl rounded-2xl border border-[var(--color-border-subtle)] flex flex-col shadow-[var(--shadow-strong)] overflow-hidden flex-shrink-0">
            <DeviceTable
              devices={mockDevices}
              selectedDeviceId={selectedDevice}
              onDeviceSelect={setSelectedDevice}
            />
          </div>
        )}
      </div>

      {/* Bottom Search Island - Always visible, same position as other pages */}
      <SearchIsland 
        position="bottom" 
        fullWidth={true}
        showActions={mapUploaded}
        title="Map & Devices"
        subtitle="Visualize and manage device locations"
        placeholder={mapUploaded ? "Search devices, zones, or locations..." : "Upload a map to search devices..."}
      />
    </div>
  )
}



