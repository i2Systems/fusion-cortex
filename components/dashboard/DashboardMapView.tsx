/**
 * Dashboard Map View
 *
 * Renders the selected site's floor plan with devices and zones.
 * Used when dashboard viewMode is 'map'.
 */

'use client'

import { useMemo, memo } from 'react'
import dynamic from 'next/dynamic'
import { Map } from 'lucide-react'
import { MapUpload } from '@/components/map/MapUpload'
import { useMap } from '@/lib/hooks/useMap'
import { useDevices } from '@/lib/hooks/useDevices'
import { useZones } from '@/lib/hooks/useZones'
import { usePeople } from '@/lib/hooks/usePeople'
import { useSiteStore } from '@/lib/stores/siteStore'
import { isFixtureType } from '@/lib/deviceUtils'

const MapCanvas = dynamic(
  () => import('@/components/map/MapCanvas').then((mod) => ({ default: mod.MapCanvas })),
  { ssr: false, loading: () => <div className="h-full flex items-center justify-center text-[var(--color-text-muted)]">Loading map...</div> }
)

interface DashboardMapViewProps {
  onMapUpload?: (imageUrl: string, locationName: string) => void
  onVectorDataUpload?: (data: unknown) => void
}

function DashboardMapViewComponent({ onMapUpload, onVectorDataUpload }: DashboardMapViewProps) {
  const { mapData } = useMap()
  const { devices } = useDevices()
  const { zones } = useZones()
  const { people } = usePeople()
  const activeSiteId = useSiteStore((s) => s.activeSiteId)

  const devicePoints = useMemo(() => {
    return devices
      .filter((d) => d.x != null && d.y != null)
      .map((d) => ({
        id: d.id,
        x: d.x!,
        y: d.y!,
        type: d.type,
        deviceId: d.deviceId,
        status: d.status,
        signal: d.signal ?? 100,
        location: d.location,
        orientation: d.orientation,
        components: d.components,
      }))
  }, [devices])

  const peoplePoints = useMemo(() => {
    return people
      .filter((p) => p.x != null && p.y != null)
      .map((p) => ({
        id: p.id,
        firstName: p.firstName,
        lastName: p.lastName,
        x: p.x!,
        y: p.y!,
        imageUrl: p.imageUrl ?? undefined,
        role: p.role ?? undefined,
        email: p.email ?? undefined,
      }))
  }, [people])

  const zonesForCanvas = useMemo(
    () =>
      zones.map((z) => ({
        id: z.id,
        name: z.name,
        color: z.color,
        polygon: z.polygon,
      })),
    [zones]
  )

  const mapUploaded = mapData.mapUploaded || !!mapData.mapImageUrl

  if (!activeSiteId) {
    return (
      <div className="h-full flex items-center justify-center text-[var(--color-text-muted)]">
        Select a site to view the map
      </div>
    )
  }

  if (!mapUploaded) {
    if (onMapUpload && onVectorDataUpload) {
      return (
        <div className="h-full min-h-[400px]">
          <MapUpload onMapUpload={onMapUpload} onVectorDataUpload={onVectorDataUpload} />
        </div>
      )
    }
    return (
      <div className="h-full min-h-[400px] flex flex-col items-center justify-center gap-4 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)]">
        <Map size={48} className="text-[var(--color-text-muted)]" />
        <p className="text-[var(--color-text-muted)] text-center px-4">
          No map uploaded for this site
        </p>
        <a
          href="/map"
          className="px-4 py-2 rounded-lg bg-[var(--color-primary)] text-[var(--color-text-on-primary)] text-sm font-medium hover:opacity-90"
        >
          Upload Map
        </a>
      </div>
    )
  }

  return (
    <div className="h-full min-h-[400px] rounded-2xl overflow-hidden border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)]">
      <MapCanvas
        mapImageUrl={mapData.mapImageUrl}
        vectorData={mapData.vectorData}
        devices={devicePoints as any}
        zones={zonesForCanvas}
        people={peoplePoints}
        mode="select"
        showZones={true}
        showPeople={true}
        showWalls={true}
        showAnnotations={true}
        showText={true}
      />
    </div>
  )
}

export const DashboardMapView = memo(DashboardMapViewComponent)
